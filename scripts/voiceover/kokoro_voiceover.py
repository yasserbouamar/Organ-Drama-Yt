#!/usr/bin/env python3
"""
Offline voiceover for Cosmic Eviction, voiced by Kokoro-82M (Apache-2.0) via
kokoro-onnx. No account or API key: the model runs locally on the CPU.

Setup (once):
    npm run voiceover:setup          # python3 -m venv .venv + pip install

Usage:
    npm run voiceover                            # every line (skips existing clips)
    npm run voiceover -- --force                 # re-render everything
    npm run voiceover -- --only s2-just-a-tan --force
    npm run voiceover -- --apply-layout          # retime script60s.ts to fit the clips

For each line it synthesizes the speaker's voice, applies the character's
pitch/FX, normalises loudness, writes public/voiceover/<line-id>.mp3 and
derives word timings from the audio. src/data/voiceover.generated.ts gets
the same manifest the ElevenLabs script writes, so captions and lip-sync
follow the real speech.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "kokoro"
OUT_DIR = ROOT / "public" / "voiceover"
MANIFEST = ROOT / "src" / "data" / "voiceover.generated.ts"
SCRIPT_TS = ROOT / "src" / "data" / "script60s.ts"

RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
MODEL_FILES = {
    "kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
    "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}


@dataclass(frozen=True)
class Persona:
    voice: str
    """Kokoro voice id."""
    lang: str
    """espeak language used to phonemise the text."""
    speed: float
    """Kokoro speed (1.0 = the voice's natural pace)."""
    semitones: float = 0.0
    """Pitch shift after synthesis (formants move too: cartoon-style)."""
    effects: str = ""
    """Extra ffmpeg audio filters for the character."""
    tail: float = 0.06
    """Silence kept after the last word (longer for reverb/echo tails)."""


# The cast. Brisk explainer pacing: the whole script has to land in 60 seconds.
CAST: dict[str, Persona] = {
    "HOST": Persona("bm_george", "en-gb", 1.3),
    "ROCKET": Persona("am_puck", "en-us", 1.18, semitones=1.0, effects="treble=g=2"),
    "LIL_SAT": Persona("af_bella", "en-us", 1.12, semitones=3.0),
    "SUN": Persona("bm_lewis", "en-gb", 1.0, semitones=-2.5),  # no lines in the pilot
    "GRAVITY": Persona("am_fenrir", "en-us", 1.0, semitones=-3.0, effects="bass=g=5,aecho=0.8:0.5:60|130:0.22|0.12", tail=0.3),
}
DELIVERY_SPEED = {"normal": 1.0, "shout": 1.03, "calm": 0.96}

# Per-line fixes found by transcribing the takes with Whisper.
SAY_AS = {
    # Puck swallows a sentence-initial "We" ("He ran…"); a beat after it lands the word.
    "s3-another-sun": "We, ran from the Sun, and found another Sun?!",
}
"""What the TTS is given instead of the script text (same words, so timings still map)."""
LINE_SPEED = {
    # At full shout pace "we're" gets lost; a touch slower keeps it.
    "s4-staying-home": 0.92,
}
"""Per-line speed multipliers on top of the cast speed."""
SENTENCE_PAUSE = 0.14
CLAUSE_PAUSE = 0.05
LEAD_IN = 0.05
MAX_PAUSE = 0.15
"""Pauses inside a line longer than this (seconds) are tightened, like trimming breaths in an edit."""
OUT_RATE = 44100
TARGET_RMS_DB = -18.0
PEAK_DB = -1.0

# --apply-layout: gaps (frames) after each line before the slack is shared out.
GAP_IN_SCENE = 3
GAP_AT_CUT = 8
END_HOLD = 10


def log(msg: str) -> None:
    print(msg, flush=True)


# ── Inputs ────────────────────────────────────────────────────────────────
def load_script() -> dict:
    """The script lives in TypeScript; tsx prints it as JSON."""
    npx = shutil.which("npx")
    if not npx:
        sys.exit("npx not found: install Node.js and run `npm install` first.")
    out = subprocess.run([npx, "tsx", "scripts/dump-script.ts"], cwd=ROOT, check=True, capture_output=True, text=True)
    return json.loads(out.stdout)


def ensure_models() -> tuple[Path, Path]:
    CACHE.mkdir(parents=True, exist_ok=True)
    paths = []
    for name, sha in MODEL_FILES.items():
        path = CACHE / name
        if not path.exists() or sha256(path) != sha:
            log(f"Downloading {name} …")
            tmp = path.with_suffix(".part")
            urllib.request.urlretrieve(f"{RELEASE}/{name}", tmp)
            if sha256(tmp) != sha:
                tmp.unlink()
                sys.exit(f"Checksum mismatch for {name}")
            tmp.replace(path)
        paths.append(path)
    return paths[0], paths[1]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ffmpeg_cmd() -> list[str]:
    """System ffmpeg if present, otherwise the one bundled with Remotion."""
    system = shutil.which("ffmpeg")
    if system:
        return [system]
    npx = shutil.which("npx")
    if not npx:
        sys.exit("No ffmpeg found (install ffmpeg or run `npm install`).")
    return [npx, "remotion", "ffmpeg"]


def run_ffmpeg(ffmpeg: list[str], args: list[str]) -> None:
    subprocess.run([*ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *args], cwd=ROOT, check=True)


# ── Audio ─────────────────────────────────────────────────────────────────
def frame_db(audio: np.ndarray, sr: int, hop_s: float = 0.01) -> np.ndarray:
    hop = max(1, int(sr * hop_s))
    n = len(audio) // hop
    frames = audio[: n * hop].reshape(n, hop)
    return 20 * np.log10(np.sqrt((frames**2).mean(axis=1) + 1e-12))


def trim_silence(audio: np.ndarray, sr: int, floor_db: float = 45.0) -> np.ndarray:
    db = frame_db(audio, sr)
    active = np.flatnonzero(db > db.max() - floor_db)
    if len(active) == 0:
        return audio
    hop = int(sr * 0.01)
    # Keep a little air either side so soft onsets ("t", "h") and releases survive.
    return audio[max(0, (active[0] - 3) * hop) : min(len(audio), (active[-1] + 4) * hop)]


def compress_pauses(audio: np.ndarray, sr: int, max_pause: float = MAX_PAUSE, floor_db: float = 42.0) -> np.ndarray:
    """Shortens silent stretches longer than `max_pause` to that length, with short crossfades."""
    db = frame_db(audio, sr)
    hop = int(sr * 0.01)
    silent = db < db.max() - floor_db
    keep = int(max_pause / 0.01)
    fade = int(sr * 0.005)
    out, cursor, i = [], 0, 0
    while i < len(silent):
        if not silent[i]:
            i += 1
            continue
        j = i
        while j < len(silent) and silent[j]:
            j += 1
        if j - i > keep and i > 0 and j < len(silent):
            cut_from = (i + keep // 2) * hop
            cut_to = (j - keep // 2) * hop
            head = audio[cursor:cut_from].copy()
            tail = audio[cut_to : cut_to + fade].copy()
            if len(head) > fade and len(tail) == fade:
                ramp = np.linspace(0, 1, fade, dtype=np.float32)
                head[-fade:] = head[-fade:] * (1 - ramp) + tail * ramp
                out.append(head)
                cursor = cut_to + fade
        i = j
    out.append(audio[cursor:])
    return np.concatenate(out)


def speech_mask(audio: np.ndarray, sr: int, floor_db: float = 38.0, bridge_s: float = 0.08) -> np.ndarray:
    """10 ms frames that carry speech; gaps shorter than `bridge_s` (stop closures) are filled."""
    db = frame_db(audio, sr)
    active = db > db.max() - floor_db
    idx = np.flatnonzero(active)
    bridge = int(round(bridge_s / 0.01))
    for a, b in zip(idx[:-1], idx[1:]):
        if 1 < b - a <= bridge + 1:
            active[a:b] = True
    return active


def word_weights(kokoro, words: list[str], lang: str) -> list[float]:
    """Phoneme count per word (+1 for the boundary): how long each word takes to say."""
    weights = []
    for word in words:
        clean = re.sub(r"[^\w'-]", "", word)
        phonemes = kokoro.tokenizer.phonemize(clean, lang) if clean else ""
        weights.append(len(re.sub(r"[ˈˌː\s]", "", phonemes)) + 1.0)
    return weights


def word_timings(audio: np.ndarray, sr: int, words: list[str], weights: list[float]) -> list[tuple[float, float]]:
    """
    Walks the voiced frames of the clip and hands them out to the words in
    proportion to their phoneme counts. Pauses carry no voicing, so the words
    after a comma or full stop land after the pause automatically.
    """
    voiced = np.flatnonzero(speech_mask(audio, sr))
    total = len(voiced)
    cum = np.concatenate([[0.0], np.cumsum(weights)]) / sum(weights)
    out = []
    for i in range(len(words)):
        a = min(total - 1, int(round(cum[i] * total)))
        b = max(a + 1, min(total, int(round(cum[i + 1] * total))))
        out.append((voiced[a] * 0.01, (voiced[b - 1] + 1) * 0.01))
    return out


def process(ffmpeg: list[str], dry: np.ndarray, sr: int, persona: Persona, workdir: Path) -> np.ndarray:
    """Pitch shift, character FX, then resample to OUT_RATE."""
    filters = []
    if persona.semitones:
        f = 2 ** (persona.semitones / 12)
        filters += [f"asetrate={sr * f:.0f}", f"aresample={sr}", f"atempo={1 / f:.6f}"]
    if persona.effects:
        filters.append(persona.effects)
    filters += ["highpass=f=70", f"aresample={OUT_RATE}"]
    src, dst = workdir / "dry.wav", workdir / "wet.wav"
    sf.write(src, dry, sr, subtype="FLOAT")
    run_ffmpeg(ffmpeg, ["-i", str(src), "-af", ",".join(filters), "-c:a", "pcm_f32le", str(dst)])
    wet, _ = sf.read(dst, dtype="float32")
    return wet if wet.ndim == 1 else wet.mean(axis=1)


def normalise(audio: np.ndarray, sr: int) -> np.ndarray:
    mask = np.repeat(speech_mask(audio, sr), int(sr * 0.01))
    voiced = audio[: len(mask)][mask[: len(audio)]]
    rms = np.sqrt((voiced**2).mean()) if len(voiced) else 1.0
    gain = 10 ** (TARGET_RMS_DB / 20) / max(rms, 1e-9)
    peak = np.abs(audio).max() * gain
    limit = 10 ** (PEAK_DB / 20)
    if peak > limit:
        gain *= limit / peak
    return (audio * gain).astype(np.float32)


# ── Manifest + layout ─────────────────────────────────────────────────────
def read_manifest() -> dict:
    if not MANIFEST.exists():
        return {}
    text = MANIFEST.read_text()
    match = re.search(r"VOICEOVER: VoiceoverManifest = (\{.*\});", text, re.S)
    return json.loads(match.group(1)) if match else {}


def write_manifest(manifest: dict, order: list[str]) -> None:
    ordered = {k: manifest[k] for k in order if k in manifest}
    MANIFEST.write_text(
        "\n".join(
            [
                "// This file is overwritten by `npm run voiceover`. Do not edit by hand.",
                "// While it is empty the video renders silent and captions use estimated word timings.",
                "import type {VoiceoverManifest} from '../types/dialogue';",
                "",
                f"export const VOICEOVER: VoiceoverManifest = {json.dumps(ordered, indent=2)};",
                "",
            ]
        )
    )


def apply_layout(script: dict, manifest: dict, total: int) -> None:
    """Retime script60s.ts so every clip fits its window and the lines still tile 0..total."""
    lines = script["lines"]
    missing = [l["id"] for l in lines if l["id"] not in manifest]
    if missing:
        sys.exit(f"Generate these clips first: {', '.join(missing)}")
    clips = [manifest[l["id"]]["durationInFrames"] for l in lines]
    scene_of = [l["id"].split("-")[0] for l in lines]
    gaps, weights = [], []
    for i in range(len(lines)):
        if i == len(lines) - 1:
            gaps.append(END_HOLD)
            weights.append(2.0)
        elif scene_of[i + 1] != scene_of[i]:
            gaps.append(GAP_AT_CUT)
            weights.append(2.0)
        else:
            gaps.append(GAP_IN_SCENE)
            weights.append(1.0)
    slack = total - sum(clips) - sum(gaps)
    if slack < 0:
        sys.exit(f"The voice track is {-slack} frames too long for {total} frames: raise the cast speeds.")
    extra = [int(slack * w / sum(weights)) for w in weights]
    extra[-1] += slack - sum(extra)

    durations = [c + g + e for c, g, e in zip(clips, gaps, extra)]
    starts = [sum(durations[:i]) for i in range(len(lines))]
    source = SCRIPT_TS.read_text()
    for line, start, dur in zip(lines, starts, durations):
        pattern = re.compile(rf"(id: '{re.escape(line['id'])}',[\s\S]*?startFrame: )\d+(,\s*durationInFrames: )\d+")
        source, n = pattern.subn(rf"\g<1>{start}\g<2>{dur}", source, count=1)
        if n != 1:
            sys.exit(f"Could not find line {line['id']} in {SCRIPT_TS}")

    scene_ids = sorted({int(s[1:]) for s in scene_of})
    scene_starts = {sid: starts[scene_of.index(f"s{sid}")] for sid in scene_ids}
    for sid in scene_ids:
        nxt = scene_starts.get(sid + 1, total)
        pattern = re.compile(rf"(\{{id: {sid}, title: '[^']*', startFrame: )\d+(, durationInFrames: )\d+")
        source, n = pattern.subn(rf"\g<1>{scene_starts[sid]}\g<2>{nxt - scene_starts[sid]}", source, count=1)
        if n != 1:
            sys.exit(f"Could not find scene {sid} in {SCRIPT_TS}")
    SCRIPT_TS.write_text(source)

    log(f"\nRetimed {SCRIPT_TS.relative_to(ROOT)} ({slack} spare frames shared between the gaps):")
    for line, start, dur, clip in zip(lines, starts, durations, clips):
        log(f"  {line['id']:20s} start {start:5d}  window {dur:4d}f  (speech {clip}f)")


# ── Main ──────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", help="comma-separated line ids")
    parser.add_argument("--force", action="store_true", help="re-render clips that already exist")
    parser.add_argument("--apply-layout", action="store_true", help="retime script60s.ts to fit the clips")
    args = parser.parse_args()

    script = load_script()
    fps = script["fps"]
    lines = script["lines"]
    order = [l["id"] for l in lines]
    if args.only:
        wanted = {s.strip() for s in args.only.split(",")}
        unknown = wanted - set(order)
        if unknown:
            sys.exit(f"Unknown line id(s): {', '.join(sorted(unknown))}")
        lines = [l for l in lines if l["id"] in wanted]

    manifest = read_manifest()
    todo = [l for l in lines if args.force or l["id"] not in manifest or not (ROOT / "public" / manifest[l["id"]]["file"]).exists()]

    if todo:
        from kokoro_onnx import Kokoro

        model, voices = ensure_models()
        kokoro = Kokoro(str(model), str(voices))
        ffmpeg = ffmpeg_cmd()
        OUT_DIR.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory() as tmp:
            workdir = Path(tmp)
            for line in todo:
                persona = CAST[line["speaker"]]
                speed = persona.speed * DELIVERY_SPEED.get(line["delivery"], 1.0) * LINE_SPEED.get(line["id"], 1.0)
                log(f"→ {line['id']:20s} [{line['speaker']} · {persona.voice} @ {speed:.2f}x]  \"{line['text']}\"")
                audio, sr = kokoro.create(
                    SAY_AS.get(line["id"], line["text"]),
                    voice=persona.voice,
                    speed=speed,
                    lang=persona.lang,
                    sentence_pause=SENTENCE_PAUSE,
                    clause_pause=CLAUSE_PAUSE,
                )
                dry = compress_pauses(trim_silence(np.asarray(audio, dtype=np.float32), sr), sr)
                dry = np.concatenate([np.zeros(int(sr * LEAD_IN), np.float32), dry, np.zeros(int(sr * persona.tail), np.float32)])

                words = line["text"].split()
                timings = word_timings(dry, sr, words, word_weights(kokoro, words, persona.lang))

                wet = normalise(process(ffmpeg, dry, sr, persona, workdir), OUT_RATE)
                wav = workdir / "final.wav"
                sf.write(wav, wet, OUT_RATE, subtype="PCM_16")
                rel = f"voiceover/{line['id']}.mp3"
                run_ffmpeg(ffmpeg, ["-i", str(wav), "-c:a", "libmp3lame", "-b:a", "160k", str(ROOT / "public" / rel)])

                manifest[line["id"]] = {
                    "file": rel,
                    "durationInFrames": math.ceil(len(wet) / OUT_RATE * fps),
                    "words": [
                        {"text": w, "startFrame": round(s * fps, 2), "endFrame": round(e * fps, 2)}
                        for w, (s, e) in zip(words, timings)
                    ],
                }
                write_manifest(manifest, order)

    log(f"\nManifest: {MANIFEST.relative_to(ROOT)}")
    over = []
    for line in script["lines"]:
        clip = manifest.get(line["id"])
        if clip and clip["durationInFrames"] > line["durationInFrames"]:
            over.append(f"  {line['id']}: speech {clip['durationInFrames']}f > window {line['durationInFrames']}f")

    if args.apply_layout:
        apply_layout(script, manifest, sum(l["durationInFrames"] for l in script["lines"]))
    elif over:
        log("\nThese clips run past their windows (run with --apply-layout to retime the script):\n" + "\n".join(over))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Kokoro-82M (Apache-2.0) batch synthesizer for scripts/generate-audio.ts.

Runs fully offline on the CPU. The model (~330 MB) is downloaded once into
.cache/kokoro. Reads a JSON list of jobs on stdin:

    [{"text": "...", "voice": "af_heart", "lang": "en-us", "speed": 1.1, "out": "/tmp/x.wav"}]

and writes one float WAV per job, printing a JSON line as each finishes.
`--probe` only checks that kokoro-onnx is importable.

Setup: npm run audio:kokoro-setup
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "kokoro"
SENTENCE_PAUSE = 0.14
CLAUSE_PAUSE = 0.05
RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
MODEL_FILES = {
    "kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
    "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def ensure_models() -> tuple[Path, Path]:
    CACHE.mkdir(parents=True, exist_ok=True)
    paths = []
    for name, sha in MODEL_FILES.items():
        path = CACHE / name
        if not path.exists() or sha256(path) != sha:
            print(json.dumps({"status": f"downloading {name}"}), file=sys.stderr, flush=True)
            tmp = path.with_suffix(".part")
            urllib.request.urlretrieve(f"{RELEASE}/{name}", tmp)
            if sha256(tmp) != sha:
                tmp.unlink()
                sys.exit(f"Checksum mismatch for {name}")
            tmp.replace(path)
        paths.append(path)
    return paths[0], paths[1]


def main() -> None:
    import kokoro_onnx  # noqa: F401  (fails fast if the venv isn't set up)

    if "--probe" in sys.argv:
        print("ok")
        return

    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro

    jobs = json.load(sys.stdin)
    model, voices = ensure_models()
    kokoro = Kokoro(str(model), str(voices))
    for job in jobs:
        audio, sr = kokoro.create(
            job["text"],
            voice=job["voice"],
            speed=float(job["speed"]),
            lang=job["lang"],
            # Tighter than Kokoro's defaults: the script's windows are brisk.
            sentence_pause=SENTENCE_PAUSE,
            clause_pause=CLAUSE_PAUSE,
        )
        sf.write(job["out"], np.asarray(audio, dtype=np.float32), sr, subtype="FLOAT")
        print(json.dumps({"out": job["out"], "seconds": round(len(audio) / sr, 3)}), flush=True)


if __name__ == "__main__":
    main()

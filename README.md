# Cosmic Eviction (60s Pilot)

A 60-second comic-pop science explainer built in [Remotion](https://www.remotion.dev) with React and TypeScript. The Sun is the landlord of Solar System St. and it wants Earth out. Rocket, Lil Sat and Gravity go looking for the safest place in the universe. It turns out to be the one they already live in.

Everything is drawn in code. The halftone Ben-Day dots, the 6px ink outlines with white sticker borders, the puppets and the infographics are all procedural SVG. There are no image assets.

| | |
|---|---|
| Composition ID | `CosmicEvictionPilot` |
| Format | 1920 × 1080, 30 fps, 1800 frames (60.0 s) |
| Dev composition | `Dev/CharacterSheet`: every puppet on one model sheet |

## Quick start

```bash
npm install
npm run dev            # Remotion Studio: scrub, tweak props, preview
npm run render         # → out/cosmic-eviction-pilot.mp4 (full quality)
npm run render:draft   # → half-resolution draft, much faster
npm run typecheck
```

The first render downloads Remotion's headless Chrome. If your machine can't reach the download host, point Remotion at any Chromium build with `--browser-executable=/path/to/chrome`.

## Voiceover

The voiceover ships in the repo (`public/voiceover/*.mp3`). It was made with **[Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)**, an open-weight (Apache-2.0) neural TTS model that runs offline on a CPU, so there's no account or API key. `npm run render` already has sound.

To regenerate it, for example after editing a line, you need Python 3.10+:

```bash
npm run voiceover:setup                              # once: .venv + kokoro-onnx (~330 MB model downloads on first run)
npm run voiceover -- --force                         # re-voice every line
npm run voiceover -- --only s2-just-a-tan --force    # re-voice one line
npm run voiceover -- --apply-layout                  # retime script60s.ts around the new clip lengths
```

For each line, `scripts/voiceover/kokoro_voiceover.py` does the following:

1. It synthesizes the line in the speaker's voice and tightens over-long pauses.
2. It applies the character's pitch and FX, then normalises loudness.
3. It writes `public/voiceover/<line-id>.mp3`.
4. It derives **word timings** from the audio: voiced frames are shared out in proportion to each word's phoneme count, so pauses land between the right words.
5. It writes `src/data/voiceover.generated.ts`.

The composition plays each clip at its line's start. Captions highlight the words as they're spoken, mouths flap on the real timing, and scene beats fire on cue words (below).

| Speaker | Kokoro voice | Speed | Processing | Direction |
|---|---|---|---|---|
| HOST | `bm_george` (British) | 1.30× | none | Clear, enthusiastic explainer |
| ROCKET | `am_puck` | 1.18× (+3% when shouting) | +1 semitone, presence boost | Brash, fast-talking |
| LIL SAT | `af_bella` | 1.12× | +3 semitones | High, cute, curious |
| GRAVITY | `am_fenrir` | 0.96× | −3 semitones, bass boost, cosmic echo | Deep, calm bass |
| SUN | `bm_lewis` | 1.0× | −2.5 semitones | No lines in the pilot |

The cast, per-line speed tweaks and pronunciation fixes (`SAY_AS`) are at the top of the script.

Every take was transcribed with Whisper `base.en` to check it says its line. The remaining transcript differences are number formatting ("5 billion"), homophones ("wait"/"weight", "we're"/"were") and Whisper dropping a sentence-initial "And".

**Prefer ElevenLabs?** `npm run voiceover:elevenlabs` (needs `ELEVENLABS_API_KEY`, see `.env.example`) writes the same manifest with ElevenLabs voices (`src/data/voiceCast.ts`). Run `npm run voiceover -- --apply-layout` afterwards to retime around those clips.

## Frame map

Line windows are half-open, `[startFrame, startFrame + durationInFrames)`, and tile frames 0–1799 with no gaps. `assertScriptIntegrity()` throws in the Studio if an edit breaks that.

The spec's original windows (F0, F46, F181, …) would have needed some lines at nearly double speed. One example is "That's plenty… move-out date": 19 words in 4 s. Other lines would have sat in silence. So the windows are **conformed to the voice track**: lines run end to end around their real lengths, and the spare frames become breathing gaps. Scene beats are keyed to spoken words with `cue(lineId, word)` (`src/scenes/shared.ts`), so they stay in sync whenever the timing changes. Examples: the hammer hits on "It owns…", the stamp lands on "dry", and the odometer reaches 1,800 MI on "melts".

| Scene | Frames | Line | Speaker |
|---|---|---|---|
| **1 · The Eviction Notice** | 0–346 | | |
| | 0 | Nobody's home. | ROCKET |
| | 33 | That's the Sun. It owns the whole street… | HOST |
| | 128 | Evicted?! Where do we go?… | LIL SAT |
| | 241 | Relax, Sat! I can take you anywhere!… | ROCKET |
| **2 · The 10% Heat Limit** | 347–792 | | |
| | 347 | Wait, the Sun won't swallow us for five billion years… | HOST |
| | 518 | Ten percent? That's just a tan! | ROCKET |
| | 569 | That's plenty. In roughly one billion years… | HOST |
| | 751 | So where do we hide?! | LIL SAT |
| **3 · The Core Elevator** | 793–1286 | | |
| | 793 | Easy! When it's too hot upstairs… | ROCKET |
| | 888 | Down through the crust, past the mantle… | HOST |
| | 1066 | And dead center sits a solid iron ball… | HOST |
| | 1217 | We ran from the Sun, and found another Sun?! | ROCKET |
| **4 · The Magnetic Shield Reveal** | 1287–1799 | | |
| | 1287 | Somebody has to hold it together. | GRAVITY |
| | 1355 | That churning iron core turns Earth into a giant magnet… | HOST |
| | 1523 | The green lights! Our shield is already on! | LIL SAT |
| | 1591 | The zero-bedroom magnet! Pack the bags… | ROCKET |
| | 1690 | The safest place in the universe… is where you already are. | HOST |

## Project layout

```
src/
├── Root.tsx                    # Composition registry (+ Dev/CharacterSheet)
├── CosmicEvictionPilot.tsx     # Scenes, panel wipes, chapter tags, captions, voiceover
├── theme.ts                    # Palette, ink weights, fonts, pop spring
├── fonts.ts                    # Bangers + Montserrat, bundled offline via @fontsource
├── types/
│   ├── dialogue.ts             # DialogueEvent, SceneDefinition, WordTiming, VoiceoverClip
│   └── characters.ts           # Speaker, Expression, Viseme, Pose, PoseCue
├── data/
│   ├── script60s.ts            # The script: lines, frame windows, acting cues, helpers
│   ├── speakers.ts             # Badge labels and colours per speaker
│   ├── voiceCast.ts            # ElevenLabs casting
│   └── voiceover.generated.ts  # Written by `npm run voiceover`
├── components/
│   ├── comic/                  # HalftoneBackground, SunburstRays, SpeedLines, SpeakerBadge,
│   │                           # Sticker, Camera, Place, Starfield, ComicBurst, Stamp,
│   │                           # PanelWipe, ChapterTag
│   ├── characters/             # Rocket, Satellite, Sun, Gravity, Earth (+ parts/Mouth, NoodleArm)
│   ├── infographics/           # DepthOdometer, HeatDialGauge, MagneticShieldArcs, Thermometer
│   ├── props/                  # ElevatorCage, MovingCrate, IronCore, Pluto, AuroraCurtains,
│   │                           # StreetSign, SubscribePill
│   └── subtitles/
│       └── ComicSubtitles.tsx  # Word-by-word kinetic captions driven by script60s.ts
├── scenes/                     # Scene1_EvictionNotice … Scene4_MagneticShield, shared camera helpers
└── utils/                      # Animation (springs, noise, shake), geometry, lip-sync, SVG ids
scripts/
├── voiceover/
│   ├── kokoro_voiceover.py     # Offline Kokoro TTS: cast, FX, word timings, --apply-layout
│   └── requirements.txt
├── generate-voiceover.ts       # Optional ElevenLabs TTS + alignment → same manifest
└── dump-script.ts              # Prints script60s.ts as JSON for the Python tool
public/
└── voiceover/                  # One MP3 per line (generated, committed)
```

## How it fits together

- **Script-driven.** `script60s.ts` is the single source of truth. Captions read the active line from the current frame. Speaker badges and lip-sync read line windows through `lineWindow(id)`, and scene beats read spoken words through `cue(id, word)`. If you retime a line or re-record it, the picture follows.
- **Puppets** are pure SVG components. You control them with props: `expression`, `mouth` (a viseme), `look`, `blink`, plus character rigs such as Rocket's `thrust`, `puff`, `bulge` and `sunglasses`, Lil Sat's `wingAngle`, `tremble` and `aura`, the Sun's `hammer`, `glassesDrop` and `heat`, Gravity's stretchy `arms`, and Earth's `doorOpen`, `notice`, `boil`, `dryness` and `cutaway`. Idle motion (blinks, flames, wobble) comes from the frame number.
- **Sticker borders** use an SVG `feMorphology` filter (`Sticker.tsx`), so the white border follows each silhouette. CSS `drop-shadow` can't spread, so it can't do this.
- **Lip-sync:** `mouthAt(speaker, frame)` cycles through syllable shapes while that speaker's line plays. Shouted lines get bigger shapes, calm lines get softer ones, and the mouth closes between words.
- **Camera:** scenes lay out a 1920×1080 world and move a spring-blended keyframe camera over it (`scenes/shared.ts`).

## Composition props

| Prop | Default | |
|---|---|---|
| `showSubtitles` | `true` | Kinetic captions |
| `showChapterTags` | `true` | "PART n" stickers at each scene start |
| `voiceoverVolume` | `1` | Gain for all voiceover clips |
| `musicFile` | `null` | Optional music bed in `public/`, e.g. `"music/bed.mp3"` |
| `musicVolume` | `0.12` | Music gain |

Example: `npx remotion render CosmicEvictionPilot out/clean.mp4 --props='{"showSubtitles":false,"showChapterTags":true,"voiceoverVolume":1,"musicFile":null,"musicVolume":0.12}'`

## Credits

- Fonts: [Bangers](https://fonts.google.com/specimen/Bangers) and [Montserrat](https://fonts.google.com/specimen/Montserrat), both under the SIL Open Font License, bundled from `@fontsource`.
- Voices: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad (Apache-2.0), run through [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT).

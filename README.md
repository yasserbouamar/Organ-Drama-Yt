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

## Voiceover (ElevenLabs)

The video renders silent until clips exist. Captions and lip-sync then use estimated word timings.

```bash
cp .env.example .env          # add ELEVENLABS_API_KEY
npm run voiceover -- --dry-run   # show the casting plan
npm run voiceover                # render every line
npm run voiceover -- --only s2-just-a-tan --force   # redo one line
```

For each line, `scripts/generate-voiceover.ts` does the following:

1. It calls ElevenLabs' `/text-to-speech/{voice}/with-timestamps` endpoint.
2. It saves the clip to `public/voiceover/<line-id>.mp3`.
3. It turns the character alignment into **real word timings**.
4. It rewrites `src/data/voiceover.generated.ts`.

The composition plays each clip at its line's start frame, and captions and mouth shapes follow the real timings automatically.

| Speaker | Voice (alternate) | Direction |
|---|---|---|
| HOST | George (Adam) | Clear, enthusiastic, mid-tempo explainer |
| ROCKET | Callum (Fin) | High-energy, brash, fast-talking |
| LIL SAT | Freya (Gigi) | High-pitched, cute, curious |
| SUN | Bill (Marcus) | Gruff, monotone landlord baritone |
| GRAVITY | Antoni (Adam) | Deep, smooth, calm cosmic bass |

Voice IDs live in `src/data/voiceCast.ts`. Override any of them with `ELEVENLABS_VOICE_<SPEAKER>` if your account uses different voices.

The script warns when a clip runs longer than its frame window. **Expect a warning on the last line:** the spec gives `s4-home-sweet-home` (11 words) only 59 frames, which is about 2 s, and natural speech needs about 3 s. To fix it, raise HOST's `speed` or borrow frames from the previous line in `script60s.ts`.

## Frame map

Line windows are half-open, `[startFrame, startFrame + durationInFrames)`. They use the spec's start frames verbatim and tile frames 0–1799 with no gaps. `assertScriptIntegrity()` throws in the Studio if an edit breaks that.

| Scene | Frames | Line | Speaker |
|---|---|---|---|
| **1 · The Eviction Notice** | 0–360 | | |
| | 0 | Nobody's home. | ROCKET |
| | 46 | That's the Sun. It owns the whole street… | HOST |
| | 181 | Evicted?! Where do we go?… | LIL SAT |
| | 271 | Relax, Sat! I can take you anywhere!… | ROCKET |
| **2 · The 10% Heat Limit** | 361–780 | | |
| | 361 | Wait, the Sun won't swallow us for five billion years… | HOST |
| | 521 | Ten percent? That's just a tan! | ROCKET |
| | 591 | That's plenty. In roughly one billion years… | HOST |
| | 711 | So where do we hide?! | LIL SAT |
| **3 · The Core Elevator** | 781–1260 | | |
| | 781 | Easy! When it's too hot upstairs… | ROCKET |
| | 881 | Down through the crust, past the mantle… | HOST |
| | 1051 | And dead center sits a solid iron ball… | HOST |
| | 1171 | We ran from the Sun, and found another Sun?! | ROCKET |
| **4 · The Magnetic Shield Reveal** | 1261–1799 | | |
| | 1261 | Somebody has to hold it together. | GRAVITY |
| | 1351 | That churning iron core turns Earth into a giant magnet… | HOST |
| | 1531 | The green lights! Our shield is already on! | LIL SAT |
| | 1651 | The zero-bedroom magnet! Pack the bags… | ROCKET |
| | 1741 | The safest place in the universe… is where you already are. | HOST |

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
└── generate-voiceover.ts       # ElevenLabs TTS + word alignment → manifest
```

## How it fits together

- **Script-driven.** `script60s.ts` is the single source of truth. Captions read the active line from the current frame. Speaker badges, lip-sync and scene beats read line windows through `lineWindow(id)`. If you retime a line, the picture follows.
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

Fonts: [Bangers](https://fonts.google.com/specimen/Bangers) and [Montserrat](https://fonts.google.com/specimen/Montserrat), both under the SIL Open Font License, bundled from `@fontsource`.

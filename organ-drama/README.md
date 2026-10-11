# Organ Drama: Midnight Pizza (Pilot)

A 56-second animated health explainer built in [Remotion](https://www.remotion.dev) with React and TypeScript. It's midnight, the Brain sneaks a whole pizza, and the Stomach finds out the hard way. The pilot teaches two facts: the fullness signal takes about 20 minutes to reach the brain, and you should wait 3 hours after a heavy meal before lying down.

Everything is drawn in code: 2D cutout-style puppets with bold ink outlines, flat pastel colours and soft gradients. The puppets, backgrounds and infographics are all procedural SVG, so there are no image assets. The sound effects and music are synthesized procedurally too.

| | |
|---|---|
| Composition ID | `OrganDramaPilot` |
| Format | 1920 × 1080, 30 fps, 1680 frames (56.0 s), hard cuts, no captions |
| Dev compositions | `Dev/Scene1` … `Dev/Scene5` (each scene alone), `Dev/CharacterSheet` (every puppet and state), `Dev/ShapeSheet` (the episode shape library) |
| Episodes | `Episodes/<slug>`: videos made from a topic with the episode engine (see below) |

## Quick start

```bash
cd organ-drama
npm install
npm run dev            # Remotion Studio: scrub, tweak props, preview
npm run render         # → out/organ-drama-midnight-pizza.mp4
npm run render:draft   # half resolution, much faster
npm run typecheck
```

The first render downloads Remotion's headless Chrome. If your network blocks that, point Remotion at any Chromium build with `--browser-executable=/path/to/chrome`.

## Audio

The repo ships with sound, so `npm run render` already has audio:

- **Voiceover**: `public/audio/vo/*.mp3`, voiced offline by [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0).
- **Sound effects**: `public/audio/sfx/*.wav`, baked from the procedural recipes.
- **Music**: `public/audio/bgm/bgm.wav`, an 8-bar pizzicato loop at 120 BPM, also baked procedurally.

`npm run audio` (`scripts/generate-audio.ts`) regenerates all of it:

```bash
npm run audio                                # fill in anything missing
npm run audio -- --force                     # redo everything
npm run audio -- --only s2-pizza-hi --force  # re-voice one line
npm run audio -- --provider kokoro           # elevenlabs | edge | kokoro | procedural | auto
npm run audio -- --skip-vo --skip-sfx --skip-bgm --dry-run
```

**Voice providers.** For each line the generator tries these in order and keeps the first that works:

1. **ElevenLabs**, when `ELEVENLABS_API_KEY` is set (shell or `.env`, see `.env.example`). The cast in `src/data/voiceCast.ts` uses premade library voices: Narrator neutral explainer, Brain energetic, Stomach deep and drowsy, Letter high-pitched and cute, Heart dramatic. You can override any voice with `ELEVENLABS_VOICE_<SPEAKER>`.
2. **edge-tts**, Microsoft Edge's free online voices. It uses the `edge-tts` CLI from `pip install edge-tts` if that's on your PATH, otherwise `npx node-edge-tts`. Check Microsoft's terms before publishing these voices commercially.
3. **Kokoro**, fully offline on the CPU. Run `npm run audio:kokoro-setup` once (Python 3.10+). The ~330 MB model downloads into `.cache/` on first use.
4. **Procedural babble**, which always works. It synthesizes cartoon "speech tones" (a pitched glottal buzz through vowel formant filters) that follow each line's syllables.

**Post-processing.** Every take goes through the same steps:

1. Trim silence and tighten long pauses.
2. Apply the character's pitch and effects (Kokoro voices only).
3. Fit the take inside its script window. It is re-voiced at a faster pace if the provider supports speed control, and time-stretched only as a last resort.
4. Normalise loudness and encode to MP3.

The finished audio is then analysed into a per-frame **viseme track** (`idle`, `open`, `o`, `teeth`, `smile`) and **word timings**, which go into `src/data/voiceover.generated.ts`. Loudness opens the mouth, a dark spectrum rounds it to "o", 1–3 kHz energy spreads it into a smile, and hiss closes it to teeth. That's why the mouths follow the real voice whichever provider produced it.

**Live fallbacks.** Remotion only renders audio that comes from `<Audio>` sources, so playing through Web Audio at render time would never reach the MP4. Instead, whenever a file is missing from `public/audio/`, the same recipes run in the browser. Their samples are wrapped in a Web Audio `AudioBuffer` and handed to `<Audio>` as a `data:` URL, which works in the Studio and in renders. This applies to the voice (babble), every SFX cue and the music. The project renders with sound even straight from a clean checkout with `public/audio/` deleted.

**Swapping in real recordings.** You can replace any generated sound:

- **SFX**: save a recording as `public/audio/sfx/<id>.mp3` (or `.wav`/`.ogg`). An `.mp3` takes priority over the baked `.wav`.
- **Music**: save it as `public/audio/bgm/bgm.mp3` (or `.wav`/`.ogg`). It loops automatically.

**Mix.** `AudioController.tsx` ducks the music to **0.15** while a voice is sounding and lets it swell to **0.35** in gaps and scene transitions. Ducking is fast and anticipates the next line; the swell back up is slow. Short gaps between lines stay ducked, so the music doesn't pump.

## Timeline

Every frame number below is taken from the shooting script (`src/data/scriptData.ts`), inclusive at both ends. The script's subscribe outro (F1651–F1800) was cut, so the video ends on the 3-hour rule with a one-second hold after the last line.

| Scene | Frames | Dialogue | SFX cues |
|---|---|---|---|
| **1 · Midnight Pizza Heist** (bedroom) | 0–330 | NARRATOR 0–75, BRAIN 76–180 | clock 0, rustle 80, creak 95, chime 100 |
| **2 · The Valve Closes** (gut) | 331–690 | STOMACH 331–430, NARRATOR 431–520, PIZZA 521–560, STOMACH 561–690 | lock 390, knock 480, splash 520, pop 530 |
| **3 · The 20-Minute Delay** (gut) | 691–1110 | BRAIN 691–810, NARRATOR 811–960, STOMACH 961–1050, LETTER 1051–1110 | gulps 700/740/780, ticking 840, ding 920, horn 1060 |
| **4 · The Heartburn Catastrophe** (gut) | 1111–1500 | BRAIN 1111–1190, NARRATOR 1191–1310, HEART 1311–1410, STOMACH 1411–1500 | flomp 1160, slosh 1210, sizzle 1240, siren 1320, morning chime 1500 |
| **5 · The 3-Hour Golden Rule** (bedroom) | 1501–1679 | NARRATOR 1501–1650 | ratchet 1560 |

Scene beats are written in absolute script frames as well. For example, `tween(g, [386, 391], …)` means "F386–F391", so the picture and the cue sheet read the same. `assertScriptIntegrity()` throws at startup if scenes stop tiling the timeline, lines overlap or spill out of their scene, or a cue runs past the end.

## Project layout

```
src/
├── Root.tsx                     # OrganDramaPilot (1920×1080, 30 fps, 1680 frames) + Dev compositions
├── index.ts
├── OrganDramaPilot.tsx          # Master timeline: scenes on hard cuts, optional subtitles, audio
├── theme.ts · fonts.ts          # Palette, ink weights, fonts (Bangers + Montserrat, bundled offline)
├── types/
│   ├── dialogue.ts              # DialogueLine, Viseme, CharacterType, SpeakerId, SceneDefinition
│   ├── audio.ts                 # SFXTrigger, AudioTrack, VoiceoverClip, VoicePersona
│   └── characters.ts            # Expression, MouthShape, Pose, LimbPose
├── data/
│   ├── scriptData.ts            # Scenes, dialogue, SFX cues, helpers, integrity check
│   ├── voiceCast.ts             # Per-speaker voices for every provider
│   └── voiceover.generated.ts   # Written by `npm run audio`
├── audio/
│   ├── AudioController.tsx      # Voiceover sequencing, ducked music, live fallbacks
│   ├── SFXPlayer.tsx            # Frame-driven SFX triggers (file or procedural)
│   ├── ProceduralSFX.ts         # 20 effect recipes + the Web Audio bridge
│   ├── proceduralMusic.ts       # Karplus–Strong pizzicato loop
│   ├── nightMusic.ts            # Music-box loop for the style test
│   ├── proceduralVoice.ts       # Formant "babble" voice
│   └── dsp.ts                   # Oscillators, noise, filters, plucks, WAV encoder
├── components/
│   ├── characters/              # Brain, Stomach, Letter, Heart, PizzaSlice + parts (Eye, Mouth, Limb, Tears)
│   ├── infographics/            # StopwatchGauge, AcidRefluxMeter, TitleCard
│   ├── ui/                      # OrganSubtitles, SpeechBubble, InsetPanel
│   ├── backgrounds/             # Bedroom (night ↔ morning, 7-segment clock), Gut (peristaltic walls)
│   ├── props/                   # PizzaBox, Esophagus, RedBloodCellTaxi, Mailbox, Callout
│   └── fx/                      # Camera, Place, ComicBurst, Zzz
├── scenes/                      # Scene1_MidnightHeist … Scene5_ThreeHourRule, UpstairsSet, shared camera/clock
├── utils/                       # Animation (springs, blinks), lip-sync, syllables, geometry, static files
├── engine/                      # Episode engine: format (types.ts), timeline, renderer, shapes, sets, pop-ups
├── remake/                      # ReferenceRemake style test (script, puppets, sets, shots)
└── dev/CharacterSheet.tsx
episodes/<slug>/                 # One video per folder: episode.ts + voiceover.generated.ts
scripts/
├── episode.ts                   # Episode CLI: new, check, voice, stills, render
├── generate-audio.ts            # Voiceover + SFX + music generator
├── kokoro_tts.py                # Offline Kokoro helper (optional)
└── requirements.txt
public/audio/{vo,sfx,bgm}/       # Generated audio (committed)
public/audio/remake/            # Kokoro lines (vo/) and music (bgm.wav) for the style test
public/episodes/<slug>/vo/       # Episode voice clips
```

## How it fits together

- **The script is the source of truth.** Subtitles read the active line from the current frame. Mouths read the line's viseme track, the music ducks around voiced frames, and scenes key their beats to the script's frame numbers.
- **Puppets** are pure SVG components driven by props: `expression`, `mouth` (one of the visemes or an acting shape such as `yawn`, `chew` or `wobbly`), `look` and `blink`. Each one also has its own rig:

  | Puppet | Rig props |
  |---|---|
  | Brain | chewing `cheeks`, noodle-limb poses, `holding` a prop |
  | Stomach | `bloat`, `slices` (fractional values animate the next slice falling in), `acidLevel`, `slosh`, `tilt`, `valveOpen`, padlock `lockShow` / `lockClosed` / `lockBroken`, `valveShake`, `valveGlow` |
  | Letter | `run` |
  | Heart | `panic`, `bpm`, `armsCrossed` |
  | Pizza Slice | `glasses`, `wave`, `bite` |

  Eyelids blink on springs (a stiff close, a softer open, the odd double blink).
- **The Stomach's belly window** is a `clipPath` porthole. Its contents counter-rotate against `tilt`, so when the Stomach lies down the acid stays level with the world and sloshes toward the valve.
- **Camera:** scenes lay out a 1920×1080 world and move a spring-blended keyframe camera over it, clamped so the world's edges never show. "Meanwhile, upstairs…" cut-aways are a second world inside an `InsetPanel` with its own camera.

## Composition props

| Prop | Default | |
|---|---|---|
| `showSubtitles` | `false` | Kinetic subtitles with speaker tags (off: the pilot ships without captions) |
| `voiceVolume` | `1` | Voiceover gain |
| `musicVolume` | `1` | Multiplier on the ducking curve |
| `sfxVolume` | `1` | Sound-effect gain |
| `music` | `true` | Music on/off |

## Episodes: from a topic to a video

The pilot's look is also a reusable engine. An episode is one typed file,
`episodes/<slug>/episode.ts`, listing a cast (puppet + Kokoro voice each) and
scenes made of beats (a line, plus acting, camera, pop-ups and sound effects).
`src/engine/` turns it into a video, timing everything from the recorded
voices, so nobody writes frame numbers.

```bash
npm run episode -- new why-we-yawn     # scaffold episodes/why-we-yawn/episode.ts
npm run episode -- check why-we-yawn   # typecheck + validate + timeline table
npm run episode -- voice why-we-yawn   # Kokoro voices; re-times the video
npm run episode -- stills why-we-yawn  # one frame per beat + a contact sheet
npm run episode -- render why-we-yawn  # → out/episodes/why-we-yawn.mp4
```

In Claude Code, the `make-video` skill (`.claude/skills/make-video/` at the
repository root) runs this whole loop from a topic: it asks for the length,
researches the facts, writes the script, casts and voices the characters,
reviews the frames and renders the MP4. Try `/make-video why we yawn`.

What the engine provides:

- **Cast**: the pilot's Brain, Stomach, Heart, Letter and Pizza, plus a shape
  library (lungs, liver, kidney, intestine, bladder, tooth, bone, blood cells,
  virus, bacteria, neuron, cell, molecule, water drop, pill, mug, apple, sugar
  cube, muscle, eyeball) drawn in the same style, with hats, glasses and ties.
  Custom bodies are one SVG path plus a few anchor points.
- **Acting**: 14 expressions, 13 gestures (wave, point, shrug, facepalm…),
  one-off motions (jump, faint, spin…), walking, entrances and exits, props
  that can be picked up, automatic eye lines and lip-sync.
- **Sets**: bedroom, kitchen, gut, body interior, outdoors, stage,
  classroom and a plain comic backdrop.
- **Camera**: frames whoever is on screen and leans in on the speaker
  without cropping anyone.
- **Pop-ups**: title cards, callouts with arrows, dials, meters, speech
  bubbles, starbursts and tip lists.
- **Sound**: the ducked pizzicato (or music-box) score and the SFX library.
  No captions, logos or outro.

`episodes/coffee-vs-sleep/` is a complete example (about 40 s).

## Style test: ReferenceRemake

`Tests/ReferenceRemake` (1124 frames, about 37 s) is an internal test. It rebuilds a short reference clip shot for shot to check whether this pipeline can match a given look. It has no captions. Under the dialogue runs a quiet music-box bed (`src/audio/nightMusic.ts`, baked to `public/audio/remake/bgm.wav`); it ducks under every line and cuts out for the knock gag. It uses sparse SFX and a Kokoro-voiced cast with a British narrator, and it reuses the pilot's lip sync, SFX player, voice sequencing and ducking.

```bash
npm run render:remake                        # → out/reference-remake.mp4
npm run audio -- --script remake --provider kokoro --force   # re-voice the test and re-bake its music
```

The script, timings and cast are in `src/remake/remakeScript.ts`. The puppets (`RemakeBrain`, `RemakeStomach`) and sets use the thinner plum line and the muted palette in `src/remake/remakeTheme.ts`.

## Credits

- Voices: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) by hexgrad (Apache-2.0), run through [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT).
- Fonts: [Bangers](https://fonts.google.com/specimen/Bangers) and [Montserrat](https://fonts.google.com/specimen/Montserrat), SIL Open Font License, bundled from `@fontsource`.
- Sound effects and music: synthesized by the code in `src/audio/`.
- This is an entertainment explainer, not medical advice.

---
name: make-video
description: Make a complete animated explainer video (Remotion, 16:9) about any topic in the Organ Drama pilot style. Claude writes the script, designs the cast of talking organs/molecules/objects, picks Kokoro voices, voices it, reviews frames and renders the MP4. Use when the user gives a topic and asks for a video, episode, short, explainer or cartoon ("make a video about why we yawn", "/make-video caffeine").
argument-hint: <topic>
---

# Make a video from a topic

You turn a topic into a finished MP4 in the house style of `organ-drama/`: bold
ink outlines, bright pastel puppets with big eyes and rubber-hose arms,
comic pop-ups, spring camera moves, Kokoro voices, a ducked pizzicato score
and sparse cartoon sound effects. **No captions, no channel name or logo, no
subscribe outro, hard cuts between scenes.**

Everything happens in `organ-drama/` (run commands from there). A video is one
file, `episodes/<slug>/episode.ts`; the engine (`src/engine/`) does the rest.
Read `reference.md` (format), `voices.md` (casting) and `checklist.md` (review)
in this folder when you reach those steps.

## 1. Ask for the length (every time)

Before writing anything, ask the user how long the video should be. Use
AskUserQuestion when available, with options like **30 s**, **45 s**, **60 s**,
**90 s**. Do this even if they gave a topic and nothing else. Do **not** ask
about voices or characters: choosing them is your job. Ask about the angle only
if the topic is genuinely ambiguous ("sugar" → crash? cavities? cravings?).

## 2. Set up (first run in a session)

```bash
cd organ-drama
npm ci                      # if node_modules is missing
npm run episode -- doctor   # ffmpeg, Kokoro, browser
npm run audio:kokoro-setup  # only if doctor says Kokoro is missing
```

The Kokoro model (~330 MB) downloads on the first `voice` run.

## 3. Get the facts right

Pick 2–4 facts the video will teach. Prefer health authorities and reviews
(NIH/NHS/CDC/WHO, Sleep Foundation, peer-reviewed reviews). Use web search
when you have it. Record each fact with its source in `facts`. Never invent
numbers; round honestly ("about five hours"). If a claim is contested, pick a
safer framing.

## 4. Write the story

The formula (one idea, told as a tiny sitcom):

1. **Hook** (≤ 4 s): the situation in one narrator line or a character
   blurting something. Time/place cards ("3:00 PM") work well.
2. **Conflict**: the body parts/molecules want opposite things. Give each a
   clear want.
3. **Explain**: the narrator states each fact in one or two short lines while
   the characters *act it out* (callouts, dials, meters).
4. **Escalate**: consequences, panic, comic timing (jumps, faints, bursts).
5. **Tip**: the practical takeaway, usually as a `list` card.
6. **Button**: a last character line that lands the joke. Never end on the
   narrator.

Pacing: ~2.6 spoken words per second overall. Budget words before writing:
30 s ≈ 70 words, 45 s ≈ 110, 60 s ≈ 150, 90 s ≈ 220. Lines: 3–14 words,
punchy, in character. The narrator explains; characters react, bicker and
joke. Use `sayAs` for tricky pronunciations.

## 5. Cast it

- One puppet per agent in the story. Reuse the pilot's builtins when they fit
  (`brain`, `stomach`, `heart`, `letter`, `pizza`); otherwise pick a library
  shape (lungs, liver, kidney, intestine, bladder, tooth, bone, redBloodCell,
  whiteBloodCell, virus, bacteria, neuron, cell, molecule, drop, blob, pill,
  mug, apple, sugarCube, muscle, eyeball) and give it a distinct colour and one
  signature accessory (hat, glasses, tie...). To see them all, render
  `Dev/ShapeSheet` (see reference.md).
- Nothing fits? Draw a `CustomShape` (reference.md shows how).
- Silhouettes and colours must read at a glance: no two cast members the same
  shape **and** colour.
- Voices: follow `voices.md`. Pick a narrator that suits the topic and a
  distinct voice per character (vary gender, accent, pitch with `semitones`,
  pace with `speed`).

## 6. Write the episode

```bash
npm run episode -- new <slug>        # kebab-case, e.g. why-we-yawn
```

Replace the template in `episodes/<slug>/episode.ts`. Follow `reference.md`;
`episodes/coffee-vs-sleep/episode.ts` is a complete worked example. Rules of
thumb:

- 2–4 scenes. Set each with `set` and place the cast with `x` (0–1920).
  Two characters: x ≈ 650 and 1250. Three: ≈ 520 / 960 / 1400.
- Every spoken beat gets a stable `id` (it names the voice file).
- Act every beat: change `expression`/`gesture` on whoever speaks and on whoever
  reacts. Use `motion` (jump, shake, faint...) for comic hits, with an `sfx`.
- One pop-up per beat at most (card, callout, dial, meter, bubble, burst, list).
- Bring surprise characters in with `hidden: true` + `act: {X: {visible: true}}`.

## 7. Check, voice, fit the length

```bash
npm run episode -- check <slug>    # typecheck + validation + timeline table
npm run episode -- voice <slug>    # Kokoro; re-times the video to the real voices
```

`voice` prints the timeline with the real total. If it is more than ~10% off
the requested length, add or cut lines (or tweak `speed`) and voice again:
only new or changed lines are voiced; use `--force --only id1,id2` to redo
specific ones (e.g. after changing a voice).

## 8. Review frames

```bash
npm run episode -- stills <slug>   # one frame per beat + out/episodes/<slug>/contact-sheet.png
```

Open the contact sheet (and individual stills) with the Read tool and go
through `checklist.md`. Fix and repeat until it passes. Pass explicit frame
numbers to re-check specific moments: `npm run episode -- stills <slug> 120 480`.

## 9. Render and deliver

```bash
npm run episode -- render <slug>   # → out/episodes/<slug>.mp4
```

Check the render: sample a few frames with ffmpeg and confirm it has audio
(`ffmpeg -i out/episodes/<slug>.mp4 -af ebur128 -f null -` → about −20 LUFS).
Send the MP4 to the user (SendUserFile when available) with a short summary:
the story in one line, the cast and voices, the length, and the facts with
sources. Offer obvious next tweaks.

Commit `episodes/<slug>/`, `public/episodes/<slug>/vo/` and
`src/engine/episodes.generated.ts` (never `out/`), then push if the session
asks you to.

## House rules (do not break)

- No captions/subtitles, no channel names or logos, no "subscribe" outro.
- Hard cuts between scenes (no wipes or slide transitions).
- Health claims must match the `facts` you cited. Keep advice general and
  safe; no dosing or diagnosis.
- Characters never insult real people or brands.

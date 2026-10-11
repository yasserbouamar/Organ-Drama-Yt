# Episode format reference

The types live in `organ-drama/src/engine/types.ts` (the source of truth; the
typechecker enforces them). A complete example:
`organ-drama/episodes/coffee-vs-sleep/episode.ts`.

```ts
import {defineEpisode} from '../../src/engine/types';

export default defineEpisode({
  slug: 'why-we-yawn',              // = folder name = composition id
  title: 'Working title',           // never shown
  topic: 'Why yawns are contagious',
  logline: 'One sentence: the joke and the lesson.',
  targetSeconds: 45,                // what the user asked for
  facts: [{claim: '…', source: '…'}],
  narrator: {voice: 'bm_george', speed: 1.05},
  music: 'pizzicato',               // 'pizzicato' (default) | 'nightbox' (soft music box) | 'none'
  musicVolume: 1,                   // multiplier on the ducked level
  cast: { /* id → CastMember */ },
  scenes: [ /* Scene[] */ ],
});
```

## Cast

```ts
LUNGS: {
  name: 'Lungs',
  personality: 'Dramatic athlete who never stops breathing loudly.',
  puppet: {kind: 'organ', shape: 'lungs', color: '#F8A5C2', accessories: [{type: 'headband'}]},
  voice: {voice: 'am_fenrir', speed: 1.05, semitones: -1, effects: 'bass=g=3'},
},
```

Cast ids are UPPER_SNAKE (`BRAIN`, `SLEEPY_MOLECULE`). `NARRATOR` is reserved
for the off-screen voice.

### Puppets

| kind | notes |
|---|---|
| `brain` | pink brain with tie (pilot). `size` ≈ 340 |
| `stomach` | mustard stomach, nightcap, mustache, belly window. Extra: `slices` (pizza slices inside), `acid` 0..1. `size` ≈ 400 |
| `heart` | ruby heart in a top hat; beats faster when `worried`/`shocked`. `size` ≈ 290 |
| `letter` | envelope messenger. `size` ≈ 230 |
| `pizza` | pizza slice in shades (no gestures). `size` ≈ 190 |
| `organ` | any library `shape` or a custom one; options below |

`organ` options: `shape`, `color` (body; light/dark shading and limb colour are
derived), `limbColor`, `shoeColor`, `accessories`, `size` (width px; library
defaults 210–380), `face: false` for a faceless object/prop.

Library shapes: `lungs`, `liver`, `kidney`, `intestine`, `bladder`, `tooth`,
`bone`, `redBloodCell`, `whiteBloodCell`, `virus`, `bacteria`, `neuron`,
`cell`, `molecule` (ball-and-stick, great for hormones/chemicals), `drop`
(water), `blob`, `pill`, `mug`, `apple`, `sugarCube`, `muscle`, `eyeball`.

To see every shape with faces and accessories, render the model sheet:

```bash
npx remotion still src/index.ts ShapeSheet out/shapes0.png --props='{"page":0}'
npx remotion still src/index.ts ShapeSheet out/shapes1.png --props='{"page":1}'
```

Accessories (`{type, color?, label?}`):
hats `nightcap`, `tophat`, `cap`, `crown`, `beanie`, `chefHat`, `partyHat`,
`headband`, `bow`, `gradCap`, `hardhat`; face `glasses`, `shades`,
`mustache`, `monocle`; neck `tie`, `bowtie`, `scarf`, `badge` (with `label`,
e.g. `'ZZZ'`).

### Custom shapes

When nothing in the library fits, pass a `CustomShape` as `shape`. Draw in a
~400-unit viewBox, body roughly centred, leaving ~20% at the bottom for legs:

```ts
shape: {
  viewBox: {width: 400, height: 420},
  body: 'M200,40 C300,40 350,140 340,240 C330,330 270,370 200,370 C130,370 70,330 60,240 C50,140 100,40 200,40 Z',
  details: [{d: 'M120,300 C160,320 240,320 280,300', stroke: 5, strokeColor: 'dark', opacity: 0.4}], // clipped inside
  behind: [{d: 'M200,40 L200,0', fill: 'light', stroke: 24, tube: true}],                              // tubes, stems
  front: [{d: 'M190,20 C210,0 240,0 250,20 Z', fill: '#22C55E', stroke: 5}],                           // leaves, lids
  face: {eyes: [{x: 160, y: 200}, {x: 240, y: 200}], eyeR: 40, mouth: {x: 200, y: 280}, mouthScale: 0.9},
  arms: {left: {x: 62, y: 230}, right: {x: 338, y: 230}, length: 100},
  legs: {left: {x: 160, y: 366}, right: {x: 240, y: 366}, length: 60},
  head: {x: 200, y: 44, width: 200},  // hats sit here
  neck: {x: 200, y: 330},             // ties hang here
},
```

`fill` may be `'body'` (the gradient), `'light'`, `'dark'` or any CSS colour.
`strokeColor` may be `'ink'`, `'dark'` or a colour. Eyes ~35–45 units, about
80 units apart; mouth ~75 units below the eyes. Arms start on the body edge at
mid-height; legs start at the bottom edge. Render a still to check it.

## Scenes

```ts
{
  set: {name: 'body', tint: '#7C3AED', particles: 'sparks'},
  cast: [
    {id: 'BRAIN', x: 1260, act: {expression: 'sleepy'}},
    {id: 'ADENOSINE', x: 560, enter: 'walk'},
    {id: 'CAFFEINE', x: 860, hidden: true},           // appears later via act.visible
  ],
  props: [{id: 'mug', puppet: {kind: 'organ', shape: 'mug', face: false, size: 150}, x: 1240, y: 612}],
  camera: 'follow',     // default: frames the group, leans in on speakers. 'static' = locked wide
  holdAfter: 14,        // frames held after the last beat before the cut
  beats: [ /* Beat[] */ ],
}
```

Placement: `x` (0–1920, centre), `y` (feet; default = the set's floor),
`size`, `face: 'left' | 'right'`, `enter: 'pop' | 'walk' | 'drop' | 'none'`,
`hidden`, `act` (starting acting).

Sets (`set.name`):

| set | options | floor y |
|---|---|---|
| `bedroom` | `time: 'night' \| 'morning'`, `text` = clock ('12:00') | 985 |
| `kitchen` | `time: 'night'` for a dark kitchen; counter top at y ≈ 612 for props | 990 |
| `gut` | the pilot's stomach interior (no floor shadow) | 960 |
| `body` | generic inside-the-body; `tint` colour, `particles: 'cells' \| 'bubbles' \| 'sparks' \| 'none'` | 950 |
| `outdoors` | `time: 'day' \| 'sunset' \| 'night'` | 975 |
| `stage` | curtains + spotlight (quiz shows, announcements) | 960 |
| `classroom` | chalkboard; `text` is written on it | 990 |
| `plain` | comic backdrop with rays and halftone; `tint` | 960 |

## Beats

A beat is one line (or a silent moment) plus everything that happens during it.

```ts
{
  id: 'c-not-so-fast',            // required on spoken beats; names the voice file
  speaker: 'CAFFEINE',            // cast id, ['A', 'B'] for a chorus, or 'NARRATOR' (default)
  line: 'Not so fast, sleepyhead.',
  sayAs: undefined,               // TTS spelling when it differs
  delivery: 'normal',             // 'normal' | 'shout' | 'whisper' | 'drowsy'
  gap: 10,                        // frames of silence before (default 6)
  hold: 0,                        // extra frames after the line; silent beats: their length (default 30)
  act: {
    CAFFEINE: {visible: true, expression: 'smug', gesture: 'point', look: 'ADENOSINE'},
    ADENOSINE: {expression: 'shocked', motion: 'jump'},
  },
  camera: 'push',                 // optional override (see below)
  sfx: [{id: 'whoosh_soft', at: -4}, {id: 'flomp_bounce', at: 6, volume: 0.6}],
  note: 'What the picture shows (for the record).',
  // plus at most one pop-up: card | callout | dial | meter | bubble | burst | list
  // and any effects: [{type: 'sweat', on: 'BRAIN'}, {type: 'shake'}]
}
```

Acting persists until changed. `act` keys:

| key | values |
|---|---|
| `expression` | `neutral`, `happy`, `excited`, `smug`, `sneaky`, `cool`, `worried`, `shocked`, `grumpy`, `irritated`, `crying`, `sleepy`, `sleeping`, `chewing` |
| `gesture` | `idle`, `wave`, `point`, `present`, `stop`, `hold`, `shrug`, `cheer`, `hips`, `think`, `facepalm`, `panic`, `crossed` |
| `motion` (one-off) | `jump`, `shake`, `shiver`, `bounce`, `spin`, `faint` (stays down until another motion) |
| `look` | a cast id, `camera`, `up`, `down`, `left`, `right`, or `auto` (default: whoever is talking) |
| `moveTo` | `{x, y?}`: walks there over ~0.5–1.4 s |
| `face` | `left` / `right` (which arm points/presents) |
| `holding` | a `PropSpec` shown in the screen-right hand, or `null` |
| `take` | id of a scene prop: it leaves the set and goes in the hand (use with `gesture: 'hold'`) |
| `visible` | `true` pops a hidden character in, `false` pops them out |

Mouths are automatic: lip-sync while speaking, and a resting shape that suits
the expression otherwise.

Pop-ups (one per beat):

| key | shape | example |
|---|---|---|
| `card` | banner across the top | `{text: '3:00 PM'}`, `{text: '20 MIN LATER', sub: '…'}` |
| `callout` | label + arrow to a character or point | `{label: 'ADENOSINE', sub: 'the sleepy signal', target: 'ADENOSINE'}` |
| `dial` | gauge sweeping to a value | `{value: 5, max: 12, unit: 'HOURS', label: 'HALF GONE AFTER'}` |
| `meter` | tube filling/draining | `{label: 'ENERGY', from: 90, to: 15, color: '#F43F5E'}` |
| `bubble` | speech/thought bubble | `{text: 'SHHH...', from: 'BRAIN', variant: 'whisper'}` |
| `burst` | starburst sound-word | `{text: 'GULP!', at: 'STOMACH'}` |
| `list` | tip card, items tick in | `{title: 'BEFORE BED', items: ['…', '…']}` |

Effects (`effects: [{type, on?}]`): `zzz`, `sweat`, `hearts`, `sparkle`,
`steam` (on a character); `flash`, `shake`, `alarm` (whole screen).

Camera (`camera`): `group` (everyone on screen), `push` (lean toward the
speaker; default on character lines), `close` (speaker close-up), `two-shot`,
`wide` (whole set), or `{x, y, zoom}`. Narrator lines default to `group`.

## Sound effects

`sfx: [{id, at?, volume?}]`, `at` in frames from the beat start (negative =
before, `'end'` = when the line ends). Library:

`whoosh_soft`, `bubble_pop`, `cartoon_gulp`, `boing_jump`, `flomp_bounce`,
`comic_rimshot`, `chime_sparkle`, `bell_ding`, `morning_chime`, `horn_beep`,
`heavy_knock`, `lock_click`, `box_creak`, `gear_ratchet`, `clock_tick`,
`stopwatch_tick`, `liquid_splash`, `liquid_slosh`, `acid_sizzle`,
`cartoon_alarm`.

Keep it sparse: 1–2 cues per scene beat at most, on visual hits.

## Commands

```bash
npm run episode -- new <slug>
npm run episode -- check <slug>
npm run episode -- voice <slug> [--force] [--only id1,id2] [--provider kokoro|elevenlabs|edge]
npm run episode -- stills <slug> [frame ...]
npm run episode -- render <slug>
npm run episode -- sync      # re-register episodes (new/check/voice/stills/render do it too)
npm run episode -- doctor
npm run dev                  # Studio: episodes are under "Episodes"
```

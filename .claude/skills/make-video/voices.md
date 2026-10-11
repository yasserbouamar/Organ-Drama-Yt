# Casting voices (Kokoro)

Every voice is offline Kokoro-82M. Pick per topic: a narrator that fits the
mood, and a clearly different voice for each character. Shape them further
with `speed` (0.85–1.25), `semitones` (cartoon pitch shift, −4…+4) and
`effects` (ffmpeg filters).

These notes are rough guides. Audition before committing to a cast:
voice one line, listen to the clip
(`public/episodes/<slug>/vo/<id>.mp3`), then change the voice and run
`npm run episode -- voice <slug> --force --only <id>`.

## Narrators

| voice | feel | good for |
|---|---|---|
| `af_heart` | warm, friendly, very natural (highest quality) | default narrator, cosy/everyday topics |
| `bm_george` | classic British documentary | science-y, wry, "nature documentary" humour |
| `bf_emma` | clear, poised British | calm explainers, health advice |
| `am_michael` | warm, steady American male | straightforward explainers |
| `af_sarah` | clear, neutral | quick factual topics |

## Character voices

American female: `af_bella` (energetic, expressive), `af_nicole` (soft,
breathy: sleepy or shy characters), `af_sky` (light, young), `af_nova`
(bright, crisp), `af_jessica` (casual), `af_alloy` (even), `af_aoede`
(smooth), `af_kore` (calm), `af_river` (relaxed).

American male: `am_puck` (playful, bright: schemers, kids), `am_fenrir`
(deeper, gruff: grumps, bouncers), `am_onyx` (deep, low: big slow organs),
`am_eric` (confident), `am_liam` (friendly, young), `am_echo` (clear),
`am_santa` (jolly, older). Avoid `am_adam` (lower quality).

British: `bf_isabella` (warm), `bf_alice` (crisp), `bf_lily` (soft),
`bm_fable` (theatrical: divas, villains), `bm_lewis` (deep), `bm_daniel`
(calm).

## Recipes

| character type | try |
|---|---|
| sleepy / gentle | `af_nicole`, speed 0.95, semitones +1 |
| hyper / scheming | `am_puck`, speed 1.1, semitones +2, `effects: 'treble=g=2'` |
| grumpy giant | `am_onyx`, speed 0.98, semitones −2.5, `effects: 'bass=g=4'` |
| cool smooth talker | `am_michael`, speed 1.05, semitones −1 |
| dramatic diva | `bm_fable`, semitones +1, `effects: 'vibrato=f=5.5:d=0.1'` |
| tiny messenger | `af_sky`, speed 1.15, semitones +4 |
| villain germ | `am_fenrir`, semitones −3, `effects: 'aecho=0.8:0.7:40:0.25'` |

Keep at least one male and one female voice in a multi-character cast, and
never give two characters the same base voice with the same pitch.

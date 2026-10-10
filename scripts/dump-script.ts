/**
 * Prints the dialogue script as JSON, for tools outside the TypeScript build
 * (e.g. the offline Kokoro voiceover generator).
 *
 *   npx tsx scripts/dump-script.ts > script.json
 */
import {FPS, SCRIPT_60S} from '../src/data/script60s';

process.stdout.write(
  JSON.stringify(
    {
      fps: FPS,
      lines: SCRIPT_60S.map(({id, speaker, text, startFrame, durationInFrames, delivery}) => ({
        id,
        speaker,
        text,
        startFrame,
        durationInFrames,
        delivery,
      })),
    },
    null,
    2,
  ),
);

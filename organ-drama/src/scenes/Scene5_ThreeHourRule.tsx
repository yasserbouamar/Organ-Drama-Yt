import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {LetterCharacter} from '../components/characters/LetterCharacter';
import {Camera} from '../components/fx/Camera';
import {Place} from '../components/fx/Place';
import {StopwatchGauge} from '../components/infographics/StopwatchGauge';
import {TitleCard} from '../components/infographics/TitleCard';
import {LAST_FRAME} from '../data/scriptData';
import {TONES} from '../theme';
import {pop} from '../utils/animation';
import {cameraAt, type CameraKey, useSceneClock} from './shared';
import {UpstairsSet} from './UpstairsSet';

/** The golden-rule card holds to the last frame (its 8-frame exit would start after it). */
const END = LAST_FRAME + 1;

const CAMERA: CameraKey[] = [
  {at: 1501, x: 860, y: 500, zoom: 1.12},
  {at: 1586, x: 940, y: 520, zoom: 1.05, duration: 30},
];

/**
 * Scene 5 · The 3-Hour Golden Rule (F1501–F1679). Next morning the letter has
 * finally arrived and holds up a stopwatch that ratchets round to 3 HOURS.
 * The video ends here, on the rule.
 */
export const Scene5ThreeHourRule: React.FC = () => {
  const {fps, g, local} = useSceneClock(5);
  const cam = cameraAt(g, fps, CAMERA);
  const letterLift = pop(g, fps, 1540, {damping: 11, stiffness: 160});
  return (
    <AbsoluteFill>
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom}>
        <UpstairsSet
          morning={1}
          time="07:00"
          brain={{
            expression: g < 1600 ? 'sleepy' : 'happy',
            mouth: g < 1600 ? 'yawn' : 'grin',
            leftArm: g < 1600 ? {angle: 160, bend: 15} : {angle: 18, bend: 10},
            rightArm: g < 1600 ? {angle: 160, bend: 15} : {angle: 18, bend: 10},
          }}
          slicesLeft={0}
          mailbox={{open: 0, flag: 1}}
        />
        <Place x={520} y={735 - letterLift * 20}>
          <LetterCharacter
            size={250}
            expression={g < 1585 ? 'excited' : 'happy'}
            mouth={g < 1585 ? 'o' : 'smile'}
            look={{x: 0, y: -1}}
            leftArm={{angle: 165, bend: 10}}
            rightArm={{angle: 165, bend: 10}}
          />
        </Place>
        <Place x={520} y={455 - letterLift * 20} rotation={Math.sin(g * 0.15) * 3} scale={0.6 + 0.4 * letterLift}>
          <StopwatchGauge target="3 HOURS" start={local(1556)} sweepFrames={22} size={330} />
        </Place>
      </Camera>
      <Sequence from={local(1503)} durationInFrames={52} layout="none" name="NEXT MORNING">
        <TitleCard text="NEXT MORNING" durationInFrames={52} x={1180} y={160} color={TONES.sky} />
      </Sequence>
      <Sequence from={local(1588)} durationInFrames={END - 1588} layout="none" name="Golden rule">
        <TitleCard text="3-HOUR GOLDEN RULE" sub="Big meal? Wait 3 hours before lying down." durationInFrames={END - 1588 + 8} x={1220} y={190} rotation={3} />
      </Sequence>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {BrainCharacter} from '../components/characters/BrainCharacter';
import {HeartCharacter} from '../components/characters/HeartCharacter';
import {LetterCharacter} from '../components/characters/LetterCharacter';
import {StomachCharacter} from '../components/characters/StomachCharacter';
import {Camera} from '../components/fx/Camera';
import {ComicBurst} from '../components/fx/ComicBurst';
import {Place} from '../components/fx/Place';
import {SceneWipe} from '../components/fx/SceneWipe';
import {SunburstRays} from '../components/fx/SunburstRays';
import {StopwatchGauge} from '../components/infographics/StopwatchGauge';
import {TitleCard} from '../components/infographics/TitleCard';
import {EKGLine, ekgOffsetAt, SubscribeButton} from '../components/props/StageProps';
import {PALETTE, TONES} from '../theme';
import type {Expression} from '../types/characters';
import {clamp, pop, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {cameraAt, type CameraKey, useSceneClock} from './shared';
import {UpstairsSet} from './UpstairsSet';

const OUTRO = 1651;
const EKG_Y = 850;

const CAMERA: CameraKey[] = [
  {at: 1501, x: 860, y: 500, zoom: 1.12},
  {at: 1586, x: 940, y: 520, zoom: 1.05, duration: 30},
];

/** Who stands where on the outro's heartbeat line. */
const LINEUP = [
  {id: 'LETTER', x: 290},
  {id: 'BRAIN', x: 730},
  {id: 'STOMACH', x: 1190},
  {id: 'HEART', x: 1640},
] as const;

/**
 * Scene 5 · The 3-Hour Golden Rule & Outro (F1501–F1799). Next morning the
 * letter has finally arrived and holds up a stopwatch that ratchets round to
 * 3 HOURS. Then every organ bounces on a beating EKG line beside a subscribe
 * button, and the Stomach and Heart refuse: "We will not!"
 */
export const Scene5ThreeHourRule: React.FC = () => {
  const {g, local} = useSceneClock(5);
  return (
    <AbsoluteFill>
      {g < OUTRO ? <NextMorning /> : <Outro />}
      <SceneWipe at={local(OUTRO)} kind="slide" />
    </AbsoluteFill>
  );
};

/** F1501–F1650: the letter has arrived and holds up the 3-hour stopwatch. */
const NextMorning: React.FC = () => {
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
      <Sequence from={local(1588)} durationInFrames={OUTRO - 1588} layout="none" name="Golden rule">
        <TitleCard text="3-HOUR GOLDEN RULE" sub="Big meal? Wait 3 hours before lying down." durationInFrames={OUTRO - 1588} x={1220} y={190} rotation={3} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** F1651–F1799: everyone on the heartbeat line, the subscribe button, and the refusal. */
const Outro: React.FC = () => {
  const {fps, g, local} = useSceneClock(5);
  const boing = g >= 1700 ? Math.sin(clamp((g - 1700) / 18) * Math.PI) * 130 : 0;
  const refusing = g >= 1731;
  const hop = (x: number) => -Math.min(60, -ekgOffsetAt(x, g, fps) * 0.5) - boing;
  const enter = (i: number) => pop(g, fps, OUTRO + 4 + i * 4, {damping: 11, stiffness: 170});

  const brainExpression: Expression = refusing ? 'shocked' : 'excited';
  return (
    <AbsoluteFill>
      <SunburstRays colors={['#FBCFE8', '#F9A8D4']} rays={22} speed={0.4} center={{x: 960, y: 620}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: EKG_Y, bottom: 0, background: PALETTE.midnight, opacity: 0.9}} />
      <EKGLine y={EKG_Y} reveal={tween(g, [OUTRO, OUTRO + 14], [0, 1])} bpm={110} color={TONES.mint} />
      {LINEUP.map((who, i) => {
        const s = enter(i);
        const y = EKG_Y + 8 + hop(who.x);
        let puppet: React.ReactNode = null;
        if (who.id === 'LETTER') {
          puppet = <LetterCharacter size={230} expression="happy" mouth="smile" rightArm={{angle: 150 + Math.sin(g * 0.5) * 25, bend: 20}} />;
        } else if (who.id === 'BRAIN') {
          puppet = (
            <BrainCharacter
              size={350}
              expression={brainExpression}
              mouth={mouthAt('BRAIN', g, refusing ? 'o' : 'grin')}
              look={refusing ? {x: 1, y: 0} : {x: 0.2, y: -0.3}}
              leftArm={refusing ? {angle: 60, bend: 20} : {angle: 150 + Math.sin(g * 0.6) * 15, bend: 20}}
              rightArm={refusing ? {angle: 60, bend: 20} : {angle: 150 - Math.sin(g * 0.6) * 15, bend: 20}}
            />
          );
        } else if (who.id === 'STOMACH') {
          puppet = (
            <StomachCharacter
              size={390}
              stub={false}
              expression={refusing ? 'grumpy' : 'happy'}
              mouth={mouthAt('STOMACH', g, refusing ? 'frown' : 'grin')}
              look={{x: -0.6, y: 0}}
              armsCrossed={refusing}
              slices={0}
              acidLevel={0.3}
            />
          );
        } else {
          puppet = (
            <HeartCharacter
              size={300}
              expression={refusing ? 'grumpy' : 'happy'}
              mouth={mouthAt('HEART', g, refusing ? 'frown' : 'grin')}
              look={{x: -0.8, y: 0}}
              armsCrossed={refusing}
              bpm={110}
            />
          );
        }
        return (
          <Place key={who.id} x={who.x} y={y} anchor="bottom" scale={s} squash={1 + Math.max(0, -hop(who.x)) * 0.0008}>
            {puppet}
          </Place>
        );
      })}
      <SubscribeButton x={960} y={180} start={local(1660)} clickAt={local(1714)} />
      <Sequence from={local(1780)} durationInFrames={20} layout="none" name="BA-DUM-TSS!">
        <ComicBurst text="BA-DUM-TSS!" x={960} y={470} start={0} duration={20} size={180} rotation={-6} fontSize={62} />
      </Sequence>
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Easing, Sequence} from 'remotion';
import {GutBackground} from '../components/backgrounds/GutBackground';
import {LetterCharacter} from '../components/characters/LetterCharacter';
import {PizzaSlice} from '../components/characters/PizzaSlice';
import {STOMACH_ANCHORS, StomachCharacter, stomachPointToWorld} from '../components/characters/StomachCharacter';
import {Camera} from '../components/fx/Camera';
import {ComicBurst} from '../components/fx/ComicBurst';
import {Place} from '../components/fx/Place';
import {StopwatchGauge} from '../components/infographics/StopwatchGauge';
import {TitleCard} from '../components/infographics/TitleCard';
import {Esophagus} from '../components/props/Esophagus';
import {BloodVessel, RedBloodCellTaxi} from '../components/props/RedBloodCellTaxi';
import {InsetPanel} from '../components/ui/InsetPanel';
import {SpeechBubble} from '../components/ui/SpeechBubble';
import {PALETTE, TONES} from '../theme';
import type {Expression, LimbPose, MouthShape} from '../types/characters';
import {clamp, impact, pop, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {cameraAt, type CameraKey, useSceneClock, worldToScreen} from './shared';
import {BRAIN_IN_BED, UpstairsSet} from './UpstairsSet';

const STOMACH_SPOT = {x: 900, y: 610, size: 600} as const;
const VALVE = stomachPointToWorld(STOMACH_SPOT, STOMACH_ANCHORS.valve);
const STUB = stomachPointToWorld(STOMACH_SPOT, STOMACH_ANCHORS.stubTop);
const WINDOW = stomachPointToWorld(STOMACH_SPOT, STOMACH_ANCHORS.window);
const PIPE_TOP = {x: 760, y: -120};
const LETTER_SPOT = {x: 1400, y: 770};
const VESSEL_X = 1700;
const TAXI_STOP = {x: VESSEL_X, y: 800};

/** The three extra slices: each one is swallowed (gulp) on these frames. */
const GULPS = [700, 740, 780] as const;

const CAMERA: CameraKey[] = [
  {at: 691, x: 960, y: 540, zoom: 1},
  {at: 961, x: 1120, y: 580, zoom: 1.12, duration: 20},
  {at: 1046, x: 1300, y: 600, zoom: 1.08, duration: 16},
  {at: 1090, x: 1380, y: 420, zoom: 1.1, duration: 20},
];

/**
 * Scene 3 · The 20-Minute Delay & Taxi Run (F691–F1110). Slices 2, 3 and 4
 * drop in while the Brain begs for "just one more". The bloated Stomach
 * releases the "I'M FULL" letter, a stopwatch ticks to 20 MIN, and the letter
 * hails a red-blood-cell taxi up the blood vessel to the brain.
 */
export const Scene3TwentyMinuteDelay: React.FC = () => {
  const {fps, g, local} = useSceneClock(3);
  const cam = cameraAt(g, fps, CAMERA);
  const screen = (p: {x: number; y: number}) => worldToScreen(cam, p);

  // ── Slices 2–4: fall down the pipe, gulp through the valve, splash into the window ──
  const slices = 1 + GULPS.reduce((acc, at) => acc + tween(g, [at - 1, at + 7], [0, 1], Easing.in(Easing.quad)), 0);
  const falling = GULPS.map((at) => ({at, t: tween(g, [at - 13, at], [0, 1], Easing.in(Easing.quad))})).find((f) => g >= f.at - 13 && g < f.at);
  const valveOpen = GULPS.reduce((acc, at) => acc + tween(g, [at - 3, at], [0, 1]) - tween(g, [at + 3, at + 9], [0, 1]), 0);
  const count = Math.floor(slices + 1e-6);
  const bloat = clamp((slices - 1) * 0.28);

  // ── Stomach acting ──
  let expression: Expression = 'worried';
  let rest: MouthShape = 'wobbly';
  let rightArm: LimbPose = {angle: 22, bend: 12};
  let leftArm: LimbPose = {angle: 30, bend: 14};
  if (g >= 700 && g < 811) {
    expression = 'shocked';
  } else if (g >= 811 && g < 840) {
    expression = 'crying';
  } else if (g >= 961 && g < 1051) {
    expression = 'irritated';
    rest = 'frown';
    rightArm = {angle: 95, bend: 20};
  } else if (g >= 1051) {
    expression = 'worried';
    leftArm = {angle: 150 + Math.sin(g * 0.7) * 20, bend: 20};
  }
  const groan = impact(g, 815, 30);

  // ── The letter: popped out of the stomach, hops, then rides the taxi ──
  const out = pop(g, fps, 818, {damping: 11, stiffness: 150});
  const hop = g >= 961 && g < 1072 ? Math.abs(Math.sin((g - 961) * 0.22)) * -40 : 0;
  const taxiIn = pop(g, fps, 1040, {damping: 14, stiffness: 120});
  const taxiOut = tween(g, [1088, 1110], [0, 1], Easing.in(Easing.cubic));
  const taxiY = 1350 + (TAXI_STOP.y - 1350) * taxiIn - taxiOut * 1400;
  const jump = tween(g, [1074, 1084], [0, 1]);
  const onTaxi = g >= 1084;
  const letterPos = onTaxi
    ? {x: TAXI_STOP.x, y: taxiY - 120}
    : {
        x: LETTER_SPOT.x + (TAXI_STOP.x - LETTER_SPOT.x) * jump,
        y: LETTER_SPOT.y + (taxiY - 120 - LETTER_SPOT.y) * jump - Math.sin(jump * Math.PI) * 160 + hop,
      };
  const letterStart = stomachPointToWorld(STOMACH_SPOT, {x: 470, y: 330});
  const letterX = letterStart.x + (letterPos.x - letterStart.x) * out;
  const letterY = letterStart.y + (letterPos.y - letterStart.y) * out - Math.sin(out * Math.PI) * 180 * (g < 860 ? 1 : 0);
  let letterExpression: Expression = 'worried';
  if (g >= 961) {
    letterExpression = 'excited';
  }

  const windowScreen = screen(WINDOW);
  const taxiScreen = screen({x: TAXI_STOP.x, y: taxiY});
  const stopwatch = screen({x: 300, y: 600});

  return (
    <AbsoluteFill>
      <GutBackground pace={1.2} />
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom}>
        <BloodVessel path={`M${VESSEL_X + 40},1250 C${VESSEL_X - 60},800 ${VESSEL_X + 60},300 ${VESSEL_X - 40},-200`} width={230} />
        <Esophagus bottom={{x: STUB.x, y: STUB.y + 8}} top={PIPE_TOP} squeeze={falling ? falling.t : 0} />
        {falling ? (
          <Place x={PIPE_TOP.x + (STUB.x - PIPE_TOP.x) * falling.t} y={PIPE_TOP.y + (VALVE.y - PIPE_TOP.y) * falling.t} rotation={falling.t * 220} scale={1 - tween(g, [falling.at - 3, falling.at], [0, 1])}>
            <PizzaSlice size={120} mouth="smile" />
          </Place>
        ) : null}
        <Place x={STOMACH_SPOT.x} y={STOMACH_SPOT.y} squash={1 + Math.sin(g * 0.08) * 0.012 - groan * 0.06} rotation={Math.sin(g * 1.7) * 2 * groan}>
          <StomachCharacter
            size={STOMACH_SPOT.size}
            expression={expression}
            mouth={mouthAt('STOMACH', g, rest)}
            look={g >= 961 ? {x: 0.9, y: 0.3} : g >= 830 ? {x: -0.9, y: 0} : {x: -0.3, y: -0.8}}
            leftArm={leftArm}
            rightArm={rightArm}
            bloat={bloat}
            slices={slices}
            acidLevel={0.34 + bloat * 0.08}
            slosh={Math.max(...GULPS.map((at) => impact(g, at + 6, 24))) * 0.8}
            valveOpen={valveOpen}
            lockShow={1}
            lockClosed={1}
          />
        </Place>
        {g >= 818 ? (
          <Place x={letterX} y={letterY} scale={0.3 + 0.7 * out}>
            <LetterCharacter
              size={240}
              expression={letterExpression}
              mouth={mouthAt('LETTER', g, g >= 961 ? 'smile' : 'o')}
              look={g < 961 ? {x: -1, y: -0.2} : g < 1040 ? {x: -0.8, y: -0.3} : {x: 1, y: 0}}
              run={g >= 1074 && g < 1084 ? 1 : 0}
              rightArm={g >= 990 && g < 1050 ? {angle: 160, bend: 20} : g >= 1051 ? {angle: 140 + Math.sin(g * 0.8) * 20, bend: 20} : undefined}
            />
          </Place>
        ) : null}
        <Place x={TAXI_STOP.x} y={taxiY}>
          <RedBloodCellTaxi size={340} speed={taxiOut > 0 ? 1 : g < 1056 ? 0.6 : 0} honk={g >= 1060 && g < 1078 ? 1 : 0} trail="down" />
        </Place>
      </Camera>

      {/* Slice tallies as each one lands. */}
      {GULPS.map((at, i) => (
        <Sequence key={at} from={local(at + 4)} durationInFrames={30} layout="none" name={`Slice ${i + 2}`}>
          <SpeechBubble x={windowScreen.x + 300 + i * 30} y={windowScreen.y - 190 - i * 40} tailX={windowScreen.x + 70} tailY={windowScreen.y - 60} text={`${i + 2}!`} variant="shout" start={0} duration={30} fontSize={70} />
        </Sequence>
      ))}
      <Sequence from={local(803)} durationInFrames={24} layout="none" name="GROAN">
        <ComicBurst text="GROOAN!" x={windowScreen.x - 360} y={windowScreen.y - 330} start={0} duration={24} size={120} fill={PALETTE.stomachOchre} textColor={PALETTE.white} rotation={-12} />
      </Sequence>

      {/* The 20-minute stopwatch. */}
      <Sequence from={local(830)} durationInFrames={131} layout="none" name="Stopwatch 20 MIN">
        <div style={{position: 'absolute', left: stopwatch.x - 190, top: stopwatch.y - 220, transform: `scale(${pop(g, fps, 830)}) rotate(${-6 + Math.sin(g * 0.2) * 2}deg)`, zIndex: 40}}>
          <StopwatchGauge target="20 MIN" start={840 - 830} sweepFrames={80} size={380} />
        </div>
      </Sequence>
      <Sequence from={local(920)} durationInFrames={24} layout="none" name="DING!">
        <ComicBurst text="DING!" x={stopwatch.x + 170} y={stopwatch.y - 230} start={0} duration={24} size={110} />
      </Sequence>
      <Sequence from={local(921)} durationInFrames={40} layout="none" name="20 MIN LATER">
        <TitleCard text="20 MIN LATER" sub="...is when the brain finally gets the memo" durationInFrames={40} x={1060} y={150} />
      </Sequence>

      <Sequence from={local(1018)} durationInFrames={26} layout="none" name="RUSH!">
        <ComicBurst text="RUSH!" x={screen({x: LETTER_SPOT.x, y: LETTER_SPOT.y - 260}).x} y={screen({x: LETTER_SPOT.x, y: LETTER_SPOT.y - 260}).y} start={0} duration={26} size={100} fill={TONES.alarmRed} textColor={PALETTE.white} />
      </Sequence>
      <Sequence from={local(1060)} durationInFrames={22} layout="none" name="BEEP BEEP">
        <ComicBurst text="BEEP BEEP!" x={taxiScreen.x - 230} y={taxiScreen.y - 220} start={0} duration={22} size={130} rotation={8} />
      </Sequence>

      {/* Upstairs: "just one more", then munching through the narration. */}
      <InsetPanel x={60} y={60} width={600} label="MEANWHILE, UPSTAIRS..." enter={0} exit={local(917)} camera={{x: BRAIN_IN_BED.x + 110, y: BRAIN_IN_BED.y + 10, zoom: 2.6}}>
        <UpstairsSet
          brain={{
            expression: g < 811 ? 'excited' : 'chewing',
            mouth: mouthAt('BRAIN', g, g < 811 ? 'grin' : 'chew'),
            look: {x: -0.5, y: 0.6},
            rightArm: {angle: -88 + Math.sin(g * 0.5) * (g >= 811 ? 6 : 0), bend: -36},
            leftArm: g < 811 ? {angle: 150, bend: 25} : {angle: 18, bend: 10},
          }}
          slice={{bite: g < 811 ? 0.2 : 0.2 + tween(g, [811, 910], [0, 0.7])}}
          slicesLeft={Math.max(2, 6 - count + 1)}
        />
      </InsetPanel>
    </AbsoluteFill>
  );
};

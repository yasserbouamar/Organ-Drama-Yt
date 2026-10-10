import React from 'react';
import {AbsoluteFill, Easing, Sequence} from 'remotion';
import {GutBackground} from '../components/backgrounds/GutBackground';
import {PizzaSlice} from '../components/characters/PizzaSlice';
import {STOMACH_ANCHORS, StomachCharacter, stomachPointToWorld} from '../components/characters/StomachCharacter';
import {Camera} from '../components/fx/Camera';
import {ComicBurst} from '../components/fx/ComicBurst';
import {Place} from '../components/fx/Place';
import {Zzz} from '../components/fx/Zzz';
import {Esophagus} from '../components/props/Esophagus';
import {Callout} from '../components/props/StageProps';
import {InsetPanel} from '../components/ui/InsetPanel';
import {SpeechBubble} from '../components/ui/SpeechBubble';
import {FONTS, INK, PALETTE, TONES} from '../theme';
import type {Expression, LimbPose, MouthShape} from '../types/characters';
import {impact, impacts, pop, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {cameraAt, type CameraKey, useSceneClock, worldToScreen} from './shared';
import {BRAIN_IN_BED, UpstairsSet} from './UpstairsSet';

export const STOMACH_SPOT = {x: 1010, y: 610, size: 620} as const;
const VALVE = stomachPointToWorld(STOMACH_SPOT, STOMACH_ANCHORS.valve);
const STUB = stomachPointToWorld(STOMACH_SPOT, STOMACH_ANCHORS.stubTop);
const WINDOW = stomachPointToWorld(STOMACH_SPOT, STOMACH_ANCHORS.window);
const PIPE_TOP = {x: 860, y: -120};

const CAMERA: CameraKey[] = [
  {at: 331, x: 960, y: 560, zoom: 1},
  {at: 356, x: 990, y: 470, zoom: 1.22, duration: 30},
  {at: 431, x: 900, y: 400, zoom: 1.6, duration: 24},
  {at: 497, x: 920, y: 380, zoom: 1.3, duration: 14},
  {at: 519, x: 1010, y: 700, zoom: 2.2, duration: 12},
  {at: 561, x: 980, y: 540, zoom: 1, duration: 18},
];

/** A big golden key for locking the valve, drawn at the hand. */
const Key: React.FC<{turn: number}> = ({turn}) => (
  <g transform={`rotate(${-40 + turn * 90}) scale(0.9)`}>
    <circle cx={0} cy={-34} r={20} fill={TONES.valveGold} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    <circle cx={0} cy={-34} r={8} fill={PALETTE.gutPink} stroke={PALETTE.ink} strokeWidth={INK.fine} />
    <rect x={-6} y={-16} width={12} height={56} rx={4} fill={TONES.valveGold} stroke={PALETTE.ink} strokeWidth={INK.medium} />
    <path d="M6,26 L18,26 L18,34 L6,34 M6,36 L14,36 L14,42 L6,42" fill={TONES.valveGold} stroke={PALETTE.ink} strokeWidth={INK.fine} />
  </g>
);

/** A small rule-of-thumb tag with an arrow: "FOOD IN ↓" / "ACID STAYS DOWN". */
const RuleTag: React.FC<{x: number; y: number; text: string; arrow: 'down' | 'up'; ok: boolean; s: number}> = ({x, y, text, arrow, ok, s}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${s}) rotate(${arrow === 'down' ? -4 : 3}deg)`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: ok ? TONES.mint : TONES.alarmRed,
      border: `5px solid ${PALETTE.ink}`,
      boxShadow: `0 0 0 6px ${PALETTE.white}, 7px 8px 0 6px ${PALETTE.ink}`,
      borderRadius: 16,
      padding: '6px 18px 2px 12px',
      fontFamily: FONTS.display,
      fontSize: 40,
      letterSpacing: 2,
      color: PALETTE.ink,
      whiteSpace: 'nowrap',
      zIndex: 44,
    }}
  >
    <svg width={42} height={52} viewBox="0 0 42 52">
      <path
        d={arrow === 'down' ? 'M21,4 L21,40 M7,28 L21,44 L35,28' : 'M21,48 L21,12 M7,24 L21,8 L35,24'}
        fill="none"
        stroke={PALETTE.ink}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!ok ? <path d="M4,10 L38,44 M38,10 L4,44" stroke={PALETTE.white} strokeWidth={6} strokeLinecap="round" /> : null}
    </svg>
    {text}
  </div>
);

/**
 * Scene 2 · The Valve Closes & Slice #1 Drops (F331–F690). Inside the gut,
 * the Stomach locks its valve for the night; the narrator names the lower
 * esophageal sphincter; a slice in sunglasses knocks, drops in and says hi;
 * the Stomach wakes up furious while the Brain grins guiltily upstairs.
 */
export const Scene2ValveAndPizza: React.FC = () => {
  const {fps, g, local} = useSceneClock(2);
  const cam = cameraAt(g, fps, CAMERA);
  const screen = (p: {x: number; y: number}) => worldToScreen(cam, p);

  // ── Stomach acting ──
  let expression: Expression = 'sleepy';
  let rest: MouthShape = 'idle';
  let leftArm: LimbPose = {angle: 22, bend: 12};
  let rightArm: LimbPose = {angle: 22, bend: 12};
  let look = {x: 0, y: 0.3};
  if (g >= 358 && g < 398) {
    rightArm = {angle: tween(g, [358, 366], [22, 150]), bend: 20};
    look = {x: -0.4, y: -0.8};
  }
  const yawning = g >= 405 && g < 429;
  if (yawning) {
    expression = 'sleeping';
    leftArm = {angle: 165, bend: 10};
    rightArm = {angle: 165, bend: 10};
  } else if (g >= 429 && g < 561) {
    expression = 'sleeping';
  } else if (g >= 561 && g < 600) {
    expression = 'shocked';
    rest = 'o';
    look = {x: 0.1, y: -0.6};
  } else if (g >= 600) {
    expression = 'irritated';
    rest = 'frown';
    look = {x: -0.5, y: -1};
    rightArm = {angle: 160 + Math.sin(g * 0.9) * 14, bend: 25};
  }
  const mouth = yawning ? 'yawn' : mouthAt('STOMACH', g, rest);
  const keyTurn = tween(g, [384, 390], [0, 1], Easing.out(Easing.back(2)));
  const capLift = g >= 561 ? Math.sin(Math.min(1, (g - 561) / 22) * Math.PI) : 0;
  const slices = g < 514 ? 0 : tween(g, [514, 522], [0.001, 1], Easing.in(Easing.quad));

  // ── The slice's trip down the pipe (F497–F516) ──
  const fall = tween(g, [497, 514], [0, 1], Easing.in(Easing.quad));
  const sliceX = PIPE_TOP.x + (STUB.x - PIPE_TOP.x) * fall;
  const sliceY = PIPE_TOP.y + (VALVE.y - PIPE_TOP.y) * fall;
  const sliceShrink = 1 - tween(g, [510, 516], [0, 1]);

  const valveScreen = screen(VALVE);
  const windowScreen = screen(WINDOW);
  const headScreen = screen({x: 1120, y: 380});
  const tagIn = pop(g, fps, 468);
  const tagAcid = pop(g, fps, 494);
  const tagsOut = 1 - tween(g, [512, 518], [0, 1]);

  return (
    <AbsoluteFill>
      <GutBackground />
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom}>
        <Esophagus bottom={{x: STUB.x, y: STUB.y + 8}} top={PIPE_TOP} squeeze={g >= 495 && g < 516 ? tween(g, [495, 516], [0, 1]) : 0} />
        {g >= 497 && g < 516 ? (
          <Place x={sliceX} y={sliceY} rotation={fall * 200} scale={sliceShrink}>
            <PizzaSlice size={130} mouth="o" wave={1} />
          </Place>
        ) : null}
        <Place x={STOMACH_SPOT.x} y={STOMACH_SPOT.y} squash={1 + Math.sin(g * 0.08) * 0.012 + impact(g, 520, 14) * 0.06}>
          <StomachCharacter
            size={STOMACH_SPOT.size}
            expression={expression}
            mouth={mouth}
            look={look}
            leftArm={leftArm}
            rightArm={rightArm}
            holding={g >= 360 && g < 398 ? <Key turn={keyTurn} /> : undefined}
            lockShow={pop(g, fps, 372)}
            lockClosed={tween(g, [386, 391], [0, 1], Easing.in(Easing.cubic))}
            valveShake={impacts(g, [480, 487, 493], 8)}
            valveGlow={tween(g, [436, 446], [0, 1]) * (1 - tween(g, [500, 510], [0, 1]))}
            valveOpen={tween(g, [507, 513], [0, 1]) - tween(g, [518, 526], [0, 1])}
            slices={slices}
            slosh={impact(g, 520, 30) * 0.9}
            sliceFace={g >= 521 && g <= 560 ? {mouth: mouthAt('PIZZA', g, 'grin'), wave: 1} : undefined}
            capLift={capLift}
          />
        </Place>
        <Zzz x={1150} y={360} start={local(429)} end={local(560)} size={64} />
      </Camera>

      {/* The lock snaps; the valve gets its name; the knock; the splash. */}
      <Sequence from={local(390)} durationInFrames={22} layout="none" name="CLICK!">
        <ComicBurst text="CLICK!" x={valveScreen.x - 150} y={valveScreen.y - 120} start={0} duration={22} size={95} />
      </Sequence>
      <Sequence from={local(440)} durationInFrames={75} layout="none" name="LES callout">
        <Callout x={screen({x: 520, y: 170}).x} y={screen({x: 520, y: 170}).y} toX={valveScreen.x - 40} toY={valveScreen.y - 20} label="LOWER ESOPHAGEAL SPHINCTER" sub="(the valve between food pipe and stomach)" start={0} />
      </Sequence>
      {g >= 468 && g < 518 ? (
        <>
          <RuleTag x={screen({x: 610, y: 330}).x} y={screen({x: 610, y: 330}).y} text="FOOD IN" arrow="down" ok s={tagIn * tagsOut} />
          {g >= 494 ? <RuleTag x={screen({x: 610, y: 470}).x} y={screen({x: 610, y: 470}).y} text="ACID OUT" arrow="up" ok={false} s={tagAcid * tagsOut} /> : null}
        </>
      ) : null}
      <Sequence from={local(480)} durationInFrames={24} layout="none" name="KNOCK KNOCK">
        <ComicBurst text="KNOCK KNOCK!" x={screen({x: 700, y: 150}).x} y={screen({x: 700, y: 150}).y} start={0} duration={24} size={130} rotation={6} />
      </Sequence>
      <Sequence from={local(520)} durationInFrames={20} layout="none" name="SPLOOSH">
        <ComicBurst text="SPLOOSH!" x={windowScreen.x + 330} y={windowScreen.y + 150} start={0} duration={20} size={120} fill={TONES.acidLight} textColor={PALETTE.white} />
      </Sequence>
      <Sequence from={local(523)} durationInFrames={38} layout="none" name="Hi! bubble">
        <SpeechBubble x={windowScreen.x + 420} y={windowScreen.y - 250} tailX={windowScreen.x - 30} tailY={windowScreen.y - 90} text="HI!" start={0} duration={38} fontSize={84} badge="1" />
      </Sequence>
      <Sequence from={local(561)} durationInFrames={20} layout="none" name="!!">
        <ComicBurst text="!!" x={headScreen.x + 60} y={headScreen.y - 140} start={0} duration={20} size={90} />
      </Sequence>

      {/* Upstairs, the Brain grins guiltily. */}
      <InsetPanel x={70} y={70} width={620} label="MEANWHILE, UPSTAIRS..." enter={local(604)} exit={local(691)} camera={{x: BRAIN_IN_BED.x + 110, y: BRAIN_IN_BED.y + 10, zoom: 2.6}}>
        <UpstairsSet brain={{expression: 'worried', mouth: 'grin', look: {x: -0.6, y: 0.5}, rightArm: {angle: -88, bend: -36}}} slice={{bite: 0.6}} slicesLeft={6} />
      </InsetPanel>
    </AbsoluteFill>
  );
};

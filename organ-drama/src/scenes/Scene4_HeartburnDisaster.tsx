import React from 'react';
import {AbsoluteFill, Easing, Sequence, spring} from 'remotion';
import {GutBackground} from '../components/backgrounds/GutBackground';
import {HeartCharacter} from '../components/characters/HeartCharacter';
import {STOMACH_ANCHORS, StomachCharacter, stomachPointToWorld} from '../components/characters/StomachCharacter';
import {Camera} from '../components/fx/Camera';
import {ComicBurst} from '../components/fx/ComicBurst';
import {Place} from '../components/fx/Place';
import {AcidRefluxMeter} from '../components/infographics/AcidRefluxMeter';
import {Esophagus} from '../components/props/Esophagus';
import {InsetPanel} from '../components/ui/InsetPanel';
import {SpeechBubble} from '../components/ui/SpeechBubble';
import {FONTS, INK, PALETTE, TONES} from '../theme';
import type {Expression, Point} from '../types/characters';
import {impact, pop, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {cameraAt, type CameraKey, rotateVec, useSceneClock, worldToScreen} from './shared';
import {UpstairsSet} from './UpstairsSet';

const STOMACH_SPOT = {x: 1010, y: 620, size: 600} as const;
const PIPE_TOP = {x: 560, y: -120};
const HEART_SPOT = {x: 300, y: 560};

const CAMERA: CameraKey[] = [
  {at: 1111, x: 960, y: 540, zoom: 1},
  {at: 1411, x: 820, y: 600, zoom: 1.3, duration: 20},
];

const cubicPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

/** A spinning alarm beacon for the siren. */
const Beacon: React.FC<{x: number; y: number; frame: number; side: -1 | 1}> = ({x, y, frame, side}) => {
  const a = (frame * 14 * side) % 360;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, zIndex: 35, pointerEvents: 'none'}} overflow="visible">
      <g transform={`translate(${x} ${y})`}>
        <path d="M0,0 L520,-90 L520,90 Z" fill={TONES.alarmRed} opacity={0.28} transform={`rotate(${a})`} />
        <path d="M-50,30 L-50,0 Q-50,-56 0,-56 Q50,-56 50,0 L50,30 Z" fill={TONES.alarmRed} stroke={PALETTE.ink} strokeWidth={INK.bold} />
        <rect x={-66} y={28} width={132} height={22} rx={6} fill="#475569" stroke={PALETTE.ink} strokeWidth={INK.medium} />
        <ellipse cx={-16} cy={-30} rx={10} ry={16} fill={PALETTE.white} opacity={0.6} />
      </g>
    </svg>
  );
};

/**
 * Scene 4 · The Heartburn Catastrophe (F1111–F1500). Upstairs the Brain finds
 * no letter, eats on, and flops flat: FLOMP! Downstairs the full Stomach tips
 * over 90°, acid sloshes against the valve, the padlock bursts and acid
 * shoots up the esophagus. The Heart panics; the Stomach apologises.
 */
export const Scene4HeartburnDisaster: React.FC = () => {
  const {fps, g, local} = useSceneClock(4);
  const cam = cameraAt(g, fps, CAMERA);
  const screen = (p: Point) => worldToScreen(cam, p);

  // ── The stomach tips over when the body lies down (after the FLOMP) ──
  const tilt = -90 * spring({frame: g - 1165, fps, config: {damping: 13, stiffness: 90}});
  const placed = {...STOMACH_SPOT, rotation: tilt};
  const stub = stomachPointToWorld(placed, STOMACH_ANCHORS.stubTop);
  const valve = stomachPointToWorld(placed, STOMACH_ANCHORS.valve);
  const dir = rotateVec({x: 0, y: -1}, tilt);
  const acid = tween(g, [1240, 1296], [0, 0.93], Easing.out(Easing.quad));
  const front = cubicPoint(stub, {x: stub.x + dir.x * 220, y: stub.y + dir.y * 220}, {x: PIPE_TOP.x, y: PIPE_TOP.y + 260}, PIPE_TOP, acid);

  let expression: Expression = 'sleepy';
  if (g >= 1165 && g < 1196) {
    expression = 'shocked';
  } else if (g >= 1196 && g < 1411) {
    expression = 'worried';
  } else if (g >= 1411) {
    expression = 'crying';
  }

  // ── Heart ──
  const heartIn = pop(g, fps, 1300, {damping: 12, stiffness: 140});
  const heartX = -260 + (HEART_SPOT.x + 260) * heartIn;
  const panic = g >= 1318 && g < 1411 ? 1 : 0;
  const alarm = g >= 1318 && g < 1412 ? 0.5 + 0.5 * Math.sin(g * 0.45) : 0;

  // ── Upstairs (inset): mailbox, one more bite, FLOMP ──
  const lieDown = spring({frame: g - 1157, fps, config: {damping: 9, stiffness: 260}});
  const flompSquash = 1 - impact(g, 1161, 14) * 0.3;
  const brainExpression: Expression = g < 1135 ? 'worried' : g < 1158 ? 'chewing' : g < 1168 ? 'shocked' : 'smug';

  const heartScreen = screen({x: heartX, y: HEART_SPOT.y});
  const valveScreen = screen(valve);
  const frontScreen = screen(front);
  const meter = pop(g, fps, 1242);

  return (
    <AbsoluteFill>
      <GutBackground alarm={alarm} pace={g >= 1240 ? 1.8 : 1} />
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom}>
        <Esophagus bottom={stub} top={PIPE_TOP} bottomDir={dir} acid={acid} />
        {acid > 0.05
          ? [0, 1, 2, 3, 4].map((i) => {
              const t = ((g * 0.09 + i / 5) % 1 + 1) % 1;
              return <circle key={i} cx={front.x + Math.sin(i * 2.1) * 24} cy={front.y - t * 50} r={6 + t * 8} fill="none" stroke={TONES.acidGlow} strokeWidth={4} opacity={1 - t} />;
            })
          : null}
        <Place x={STOMACH_SPOT.x} y={STOMACH_SPOT.y} rotation={tilt} squash={1 + Math.sin(g * 0.08) * 0.012}>
          <StomachCharacter
            size={STOMACH_SPOT.size}
            tilt={tilt}
            expression={expression}
            mouth={mouthAt('STOMACH', g, g < 1165 ? 'wobbly' : 'o')}
            look={g >= 1300 && g < 1411 ? {x: -1, y: 0.4} : {x: -0.6, y: -0.7}}
            bloat={0.85}
            slices={4}
            acidLevel={0.44 - acid * 0.1}
            slosh={tween(g, [1166, 1182], [0, 1]) * (1 - tween(g, [1320, 1420], [0, 0.6]))}
            valveOpen={tween(g, [1214, 1230], [0, 1])}
            lockShow={1}
            lockClosed={1}
            lockBroken={tween(g, [1222, 1230], [0, 1], Easing.out(Easing.back(2)))}
            rightArm={g >= 1411 ? {angle: 150, bend: 30} : {angle: 40, bend: 20}}
          />
        </Place>
        <Place x={heartX} y={HEART_SPOT.y} rotation={panic * Math.sin(g * 0.6) * 4}>
          <HeartCharacter
            size={320}
            expression={g >= 1411 ? 'grumpy' : 'irritated'}
            mouth={mouthAt('HEART', g, 'frown')}
            look={g >= 1411 ? {x: 1, y: 0.4} : {x: 0.8, y: -0.4}}
            panic={panic}
            armsCrossed={g >= 1411}
          />
        </Place>
      </Camera>

      {/* Gravity has left the chat. */}
      {g >= 1196 && g < 1312 ? (
        <div
          style={{
            position: 'absolute',
            left: 1270,
            top: 60,
            transform: `scale(${pop(g, fps, 1196) * (1 - tween(g, [1304, 1312], [0, 1]))}) rotate(${tilt * 0.15}deg)`,
            textAlign: 'center',
            zIndex: 42,
          }}
        >
          <div style={{fontFamily: FONTS.display, fontSize: 50, letterSpacing: 3, color: PALETTE.white, WebkitTextStroke: `10px ${PALETTE.ink}`, paintOrder: 'stroke fill'}}>GRAVITY</div>
          <svg width={120} height={170} viewBox="0 0 120 170">
            <path d="M60,8 L60,130 M18,92 L60,150 L102,92" fill="none" stroke={PALETTE.ink} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M60,8 L60,130 M18,92 L60,150 L102,92" fill="none" stroke={TONES.sky} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {g >= 1236 ? (
            <div style={{fontFamily: FONTS.display, fontSize: 40, color: PALETTE.ink, background: TONES.gold, border: `5px solid ${PALETTE.ink}`, borderRadius: 12, padding: '2px 14px 0', transform: `scale(${pop(g, fps, 1236)}) rotate(6deg)`}}>
              CAN&apos;T HELP!
            </div>
          ) : null}
        </div>
      ) : null}

      {g >= 1242 ? (
        <div style={{position: 'absolute', left: 1640, top: 360, transform: `scale(${meter * (1 - tween(g, [1490, 1500], [0, 1]))})`, transformOrigin: '50% 100%', zIndex: 41}}>
          <AcidRefluxMeter level={tween(g, [1246, 1300], [0.08, 0.88])} active={g >= 1246 ? 1 : 0} height={540} />
        </div>
      ) : null}
      {alarm > 0 ? (
        <>
          <Beacon x={120} y={70} frame={g} side={1} />
          <Beacon x={1800} y={70} frame={g} side={-1} />
        </>
      ) : null}

      <Sequence from={local(1224)} durationInFrames={18} layout="none" name="PING!">
        <ComicBurst text="PING!" x={valveScreen.x - 160} y={valveScreen.y + 120} start={0} duration={18} size={85} />
      </Sequence>
      <Sequence from={local(1262)} durationInFrames={26} layout="none" name="SSSSS!">
        <ComicBurst text="SSSSS!" x={frontScreen.x + 210} y={frontScreen.y + 40} start={0} duration={26} size={110} fill={PALETTE.acidGreen} textColor={PALETTE.white} />
      </Sequence>
      <Sequence from={local(1313)} durationInFrames={34} layout="none" name="HEARTBURN!">
        <ComicBurst text="HEARTBURN!" x={heartScreen.x + 60} y={heartScreen.y - 290} start={0} duration={34} size={150} fill={TONES.alarmRed} textColor={PALETTE.white} />
      </Sequence>

      {/* Upstairs: no letter, one more bite, FLOMP. */}
      <InsetPanel x={60} y={60} width={640} label="MEANWHILE, UPSTAIRS..." enter={0} exit={local(1218)} camera={{x: 1340, y: 620, zoom: 2}}>
        <UpstairsSet
          brain={{
            expression: brainExpression,
            mouth: mouthAt('BRAIN', g, g < 1158 ? 'chew' : g < 1168 ? 'o' : 'grin'),
            look: g < 1135 ? {x: 1, y: 0.3} : g < 1158 ? {x: 0.2, y: 0.5} : {x: -0.8, y: -0.2},
            rightArm: g >= 1135 && g < 1158 ? {angle: -88, bend: -36} : {angle: 30, bend: 10},
            leftArm: g < 1135 ? {angle: 100, bend: 20} : {angle: 18, bend: 10},
          }}
          slice={g >= 1135 && g < 1158 ? {bite: tween(g, [1135, 1156], [0.1, 0.8])} : null}
          slicesLeft={1}
          lieDown={lieDown}
          squash={flompSquash}
          mailbox={{open: tween(g, [1112, 1118], [0, 1]) - tween(g, [1130, 1136], [0, 1]), flag: 0}}
        />
      </InsetPanel>
      <Sequence from={local(1160)} durationInFrames={26} layout="none" name="FLOMP!">
        <ComicBurst text="FLOMP!" x={330} y={330} start={0} duration={26} size={150} rotation={-10} />
      </Sequence>
      <Sequence from={local(1170)} durationInFrames={44} layout="none" name="Nobody saw anything">
        <SpeechBubble x={600} y={470} tailX={300} tailY={280} text={'NOBODY SAW\nANYTHING...'} variant="whisper" start={0} duration={44} fontSize={44} />
      </Sequence>
    </AbsoluteFill>
  );
};

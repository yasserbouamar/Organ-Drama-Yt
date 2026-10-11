import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {buildDuckCurve, LoopedMusic, VoiceLines} from '../audio/AudioController';
import {NIGHT_LOOP_SECONDS, synthesizeNightLoop} from '../audio/nightMusic';
import {SFXPlayer} from '../audio/SFXPlayer';
import {PizzaSliceArt} from '../components/characters/PizzaSlice';
import {Camera} from '../components/fx/Camera';
import {Place} from '../components/fx/Place';
import type {SFXTrigger} from '../types/audio';
import type {Expression, MouthShape, Point} from '../types/characters';
import {impacts, tween} from '../utils/animation';
import {createLipSync} from '../utils/lipSync';
import {RemakeBrain} from './RemakeBrain';
import {REMAKE_DIALOGUE, REMAKE_FRAMES, SHOTS} from './remakeScript';
import {BedPizzaBox, RemakeBedroom, RemakeGut} from './RemakeSets';
import {RemakeStomach} from './RemakeStomach';
import {POP_FONT, R} from './remakeTheme';
import {VOICEOVER} from './voiceover.generated';

const SYNC = createLipSync(REMAKE_DIALOGUE, VOICEOVER);
const {mouthAt} = SYNC;

/**
 * Music: a soft music-box bed like the reference's, ducked under every line.
 * It cuts out dead for the knock gag (21.3 s → the gulp) and eases back in.
 */
const MUSIC_FILES = ['audio/remake/bgm.mp3', 'audio/remake/bgm.wav'] as const;
const MUSIC_CURVE = buildDuckCurve({
  dialogue: REMAKE_DIALOGUE,
  lineFrames: (line) => SYNC.getLineTrack(line).durationInFrames,
  totalFrames: REMAKE_FRAMES,
  levels: {dialogue: 0.14, transition: 0.3},
  mutes: [[640, 700]],
});
const musicAt = (frame: number) => MUSIC_CURVE[Math.max(0, Math.min(REMAKE_FRAMES - 1, Math.round(frame)))];
const synthNight = (sr: number) => synthesizeNightLoop(sr, false);

/** The reference's few sound effects, on the frames they land in its mix. */
const SFX: readonly SFXTrigger[] = [
  {id: 'lock_click', frame: 391, scene: 1, durationInFrames: 12, volume: 0.8, label: 'Padlock snaps on the gate'},
  {id: 'whoosh_soft', frame: 450, scene: 1, durationInFrames: 20, volume: 0.3, label: 'Push-in'},
  {id: 'heavy_knock', frame: 662, scene: 1, durationInFrames: 13, volume: 0.75, label: 'Knock knock'},
  {id: 'cartoon_gulp', frame: 680, scene: 1, durationInFrames: 14, volume: 0.5, label: 'Slice squeezes through'},
  {id: 'liquid_splash', frame: 692, scene: 1, durationInFrames: 20, volume: 0.35, label: 'Plop into the acid'},
  {id: 'bubble_pop', frame: 696, scene: 1, durationInFrames: 8, volume: 0.55, label: '"1" bubble'},
];

/** Piecewise-linear value over absolute frames. */
const keyed = (g: number, keys: readonly (readonly [number, number])[]): number =>
  interpolate(g, keys.map((k) => k[0]), keys.map((k) => k[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});

/** The absolute frame inside a shot's `<Sequence>`. */
const useShotFrame = (from: number): {g: number; fps: number} => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {g: frame + from, fps};
};

/** Comic lettering that springs in, as in the reference ("CLICK!", "KNOCK KNOCK!"). */
const PopText: React.FC<{text: string; x: number; y: number; start: number; end: number; g: number; fps: number; size?: number}> = ({text, x, y, start, end, g, fps, size = 92}) => {
  if (g < start || g > end) {
    return null;
  }
  const s = Math.min(spring({frame: g - start, fps, config: {damping: 9, stiffness: 240}}), tween(g, [end - 5, end], [1, 0]));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s}) rotate(-6deg)`,
        fontFamily: POP_FONT,
        fontSize: size,
        color: R.pop,
        WebkitTextStroke: `12px ${R.ink}`,
        paintOrder: 'stroke fill',
        textShadow: `5px 6px 0 ${R.ink}`,
        letterSpacing: 2,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

/** The yellow "1" speech-bubble icon counting slices. */
const CountBubble: React.FC<{x: number; y: number; start: number; g: number; fps: number}> = ({x, y, start, g, fps}) => {
  if (g < start) {
    return null;
  }
  const s = spring({frame: g - start, fps, config: {damping: 8, stiffness: 260}});
  return (
    <svg width={220} height={240} viewBox="0 0 220 240" style={{position: 'absolute', left: x - 110, top: y - 120, transform: `scale(${s}) rotate(-4deg)`}}>
      <path d="M40,20 L180,20 Q200,20 200,40 L200,150 Q200,170 180,170 L90,170 L44,214 L56,170 L40,170 Q20,170 20,150 L20,40 Q20,20 40,20 Z" fill={R.pop} stroke={R.ink} strokeWidth={9} strokeLinejoin="round" />
      <text x={110} y={140} textAnchor="middle" fontFamily={POP_FONT} fontSize={120} fill={R.popRed} stroke={R.ink} strokeWidth={10} paintOrder="stroke fill">
        1
      </text>
    </svg>
  );
};

// ── Shot 1: bedroom, the Brain tiptoes in and spots the pizza (F0–F314) ──

const ShotBedroomWide: React.FC = () => {
  const {g} = useShotFrame(SHOTS.bedroomWide.from);
  const x = keyed(g, [
    [0, -260],
    [60, 360],
    [90, 750],
    [120, 1034],
    [150, 1124],
  ]);
  const walking = g < 150;
  const dart = Math.sin(g * 0.3) > 0 ? 0.8 : -0.4;
  let expression: Expression = 'sneaky';
  let rest: MouthShape = 'idle';
  let look: Point = {x: dart, y: 0.1};
  let leftHand: Point | undefined = {x: 40 + Math.sin(g * 0.55) * 10, y: 330};
  let rightHand: Point | undefined = {x: 360 - Math.sin(g * 0.55) * 10, y: 330};
  if (g >= 122 && g < 180) {
    rest = 'grin';
    leftHand = {x: 104, y: 290};
  } else if (g >= 180 && g < 200) {
    leftHand = {x: 176, y: 278};
    look = {x: 0.6, y: 0};
  } else if (g >= 200 && g < 242) {
    expression = 'excited';
    look = {x: 1, y: 0.3};
    rightHand = {x: 470, y: 238};
    leftHand = {x: 60, y: 320};
  } else if (g >= 242) {
    expression = 'smug';
    rest = 'grin';
    look = {x: -0.2, y: 0.1};
    leftHand = {x: 100, y: 292};
    rightHand = {x: 452, y: 250};
  }
  const bob = walking ? Math.abs(Math.sin(g * 0.55)) * -14 : Math.sin(g * 0.08) * 3;
  return (
    <RemakeBedroom
      layout="wide"
      walker={
        <Place x={x} y={772 + bob}>
          <RemakeBrain size={600} expression={expression} mouth={mouthAt('BRAIN', g, rest)} look={look} leftHand={leftHand} rightHand={rightHand} walk={walking ? 1 : 0} />
        </Place>
      }
    />
  );
};

// ── Shot 2: inside the gut, the gate, the knock and slice #1 (F315–F838) ──

const STOMACH = {x: 811, y: 584, size: 795};
const HIPS = {left: {x: 196, y: 446}, right: {x: 480, y: 430}};
const BELLY = {left: {x: 262, y: 470}, right: {x: 362, y: 468}};

const gutCamera = (g: number, fps: number): {x: number; y: number; zoom: number} => {
  if (g < 450 || g >= 696) {
    return {x: 960, y: 540, zoom: 1};
  }
  const t = spring({frame: g - 450, fps, config: {damping: 200}, durationInFrames: 12});
  return {x: 960 + (830 - 960) * t, y: 540 + (419 - 540) * t, zoom: 1 + 0.31 * t};
};

const ShotGut: React.FC = () => {
  const {g, fps} = useShotFrame(SHOTS.gut.from);
  const cam = gutCamera(g, fps);
  let expression: Expression = 'sleepy';
  let rest: MouthShape = 'idle';
  let look: Point = {x: 0, y: 0.2};
  let leftHand: Point | undefined = HIPS.left;
  let rightHand: Point | undefined = HIPS.right;
  let leftBend = 0.45;
  let rightBend = -0.45;
  if (g < 377) {
    leftHand = {x: 120, y: 210};
    rightHand = {x: 540, y: 196};
    leftBend = -0.25;
    rightBend = 0.25;
  } else if (g < 415) {
    rightHand = {x: 546, y: 210};
    rightBend = 0.25;
    look = {x: -0.5, y: -0.6};
  } else if (g < 660) {
    expression = g < 432 ? 'sleepy' : 'sleeping';
    leftHand = BELLY.left;
    rightHand = BELLY.right;
    leftBend = 0.3;
    rightBend = -0.3;
  } else if (g < 694) {
    expression = 'irritated';
    look = {x: -0.8, y: -1};
    leftHand = BELLY.left;
    rightHand = BELLY.right;
  } else if (g < 719) {
    expression = 'shocked';
    rest = 'o';
    look = {x: 0, y: 1};
  } else if (g < 765) {
    expression = 'grumpy';
    look = {x: 0.2, y: 0};
  } else if (g < 792) {
    expression = 'sleeping';
  } else {
    expression = 'irritated';
    look = {x: -0.8, y: -0.8};
  }
  return (
    <AbsoluteFill>
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom}>
        <RemakeGut />
        <Place x={STOMACH.x} y={STOMACH.y} squash={1 + Math.sin(g * 0.07) * (expression === 'sleeping' ? 0.012 : 0.006)}>
          <RemakeStomach
            size={STOMACH.size}
            expression={expression}
            mouth={mouthAt('STOMACH', g, rest)}
            look={look}
            leftHand={leftHand}
            rightHand={rightHand}
            leftBend={leftBend}
            rightBend={rightBend}
            lockShow={spring({frame: g - 382, fps, config: {damping: 12, stiffness: 220}})}
            lockClosed={tween(g, [387, 391], [0, 1], Easing.in(Easing.cubic))}
            gateGlow={tween(g, [468, 480], [0, 1]) * (1 - tween(g, [636, 650], [0, 1]))}
            gateShake={impacts(g, [662, 674], 9)}
            gulp={tween(g, [680, 692], [0, 1])}
            sweat={tween(g, [664, 670], [0, 1]) * (1 - tween(g, [700, 706], [0, 1]))}
            slice={g >= 692}
            sliceMouth={mouthAt('PIZZA', g, 'grin')}
          />
        </Place>
      </Camera>
      <PopText text="CLICK!" x={1318} y={248} start={392} end={420} g={g} fps={fps} />
      <PopText text="KNOCK KNOCK!" x={1248} y={203} start={662} end={692} g={g} fps={fps} size={80} />
      <CountBubble x={1462} y={304} start={697} g={g} fps={fps} />
    </AbsoluteFill>
  );
};

// ── Shot 3: back in bed, the Brain bargains, slice in hand (F839–F1077) ──

const ShotBed: React.FC = () => {
  const {g} = useShotFrame(SHOTS.bedroomBed.from);
  let expression: Expression = 'excited';
  let rest: MouthShape = 'smile';
  let rightHand: Point = {x: 404 + Math.sin(g * 0.15) * 8, y: 24};
  let leftHand: Point = {x: 36, y: 118};
  if (g < 848) {
    rightHand = {x: 300, y: 250};
  } else if (g >= 893 && g < 962) {
    rightHand = {x: 404 + Math.sin(g * 0.5) * 18, y: 24};
  } else if (g >= 962 && g < 1057) {
    leftHand = g < 1010 ? {x: -60, y: 250} : {x: 36, y: 118};
    rightHand = g >= 1010 && g < 1035 ? {x: 300, y: 250} : {x: 404, y: 24};
    expression = 'happy';
  } else if (g >= 1057) {
    expression = 'smug';
    rest = 'grin';
    rightHand = {x: 440, y: 120};
  }
  return (
    <RemakeBedroom
      layout="bed"
      sleeper={
        <Place x={958} y={627 + Math.sin(g * 0.08) * 3}>
          <RemakeBrain
            size={812}
            expression={expression}
            mouth={mouthAt('BRAIN', g, rest)}
            look={{x: -0.1, y: 0.05}}
            leftHand={leftHand}
            rightHand={rightHand}
            leftBend={0.3}
            rightBend={-0.15}
            holding={
              <g transform="rotate(30) scale(0.34) translate(-120 -60)">
                <PizzaSliceArt face={false} />
              </g>
            }
          />
        </Place>
      }
    />
  );
};

// Draw the bed box in front of the blanket.
const ShotBedWithBox: React.FC = () => (
  <AbsoluteFill>
    <ShotBed />
    <BedPizzaBox />
  </AbsoluteFill>
);

// ── Shot 4: the Stomach, reluctantly: "Deal." (F1078–F1123) ──

const ShotStomachClose: React.FC = () => {
  const {g} = useShotFrame(SHOTS.stomachClose.from);
  return (
    <Camera x={853} y={511} zoom={1.93}>
      <RemakeGut />
      <Place x={STOMACH.x} y={STOMACH.y}>
        <RemakeStomach
          size={STOMACH.size}
          expression="worried"
          blink={0.42}
          mouth={mouthAt('STOMACH', g, 'frown')}
          look={{x: 0.1, y: 0.2}}
          leftHand={HIPS.left}
          rightHand={HIPS.right}
          leftBend={0.45}
          rightBend={-0.45}
          lockShow={1}
          lockClosed={1}
          slice
        />
      </Place>
    </Camera>
  );
};

const length = (s: {from: number; to: number}) => s.to - s.from + 1;

/**
 * Internal test: a shot-for-shot recreation of the 37.5 s reference clip in
 * its style (thin plum outlines, muted palette, static framing, hard cuts,
 * a quiet music-box bed, no captions), voiced by Kokoro at natural speed.
 */
export const RemakeTest: React.FC = () => (
  <AbsoluteFill style={{background: R.wallDeep}}>
    <Sequence from={SHOTS.bedroomWide.from} durationInFrames={length(SHOTS.bedroomWide)} name="Shot 1: bedroom">
      <ShotBedroomWide />
    </Sequence>
    <Sequence from={SHOTS.gut.from} durationInFrames={length(SHOTS.gut)} name="Shot 2: gut">
      <ShotGut />
    </Sequence>
    <Sequence from={SHOTS.bedroomBed.from} durationInFrames={length(SHOTS.bedroomBed)} name="Shot 3: bed">
      <ShotBedWithBox />
    </Sequence>
    <Sequence from={SHOTS.stomachClose.from} durationInFrames={length(SHOTS.stomachClose)} name="Shot 4: stomach close-up">
      <ShotStomachClose />
    </Sequence>
    <VoiceLines dialogue={REMAKE_DIALOGUE} sync={SYNC} totalFrames={REMAKE_FRAMES} />
    <LoopedMusic files={MUSIC_FILES} synth={synthNight} cacheKey="remake-night-loop" loopSeconds={NIGHT_LOOP_SECONDS} totalFrames={REMAKE_FRAMES} volumeAt={musicAt} />
    <SFXPlayer cues={SFX} />
  </AbsoluteFill>
);

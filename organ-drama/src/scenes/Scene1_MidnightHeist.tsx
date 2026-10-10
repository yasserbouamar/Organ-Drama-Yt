import React from 'react';
import {AbsoluteFill, Easing, Sequence} from 'remotion';
import {BedroomSet} from '../components/backgrounds/BedroomSet';
import {BrainCharacter} from '../components/characters/BrainCharacter';
import {PizzaSliceArt} from '../components/characters/PizzaSlice';
import {Camera} from '../components/fx/Camera';
import {Place} from '../components/fx/Place';
import {Zzz} from '../components/fx/Zzz';
import {TitleCard} from '../components/infographics/TitleCard';
import {PizzaBox} from '../components/props/PizzaBox';
import {SpeechBubble} from '../components/ui/SpeechBubble';
import type {Expression, LimbPose, MouthShape} from '../types/characters';
import {pop, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {cameraAt, type CameraKey, useSceneClock, worldToScreen} from './shared';

const BRAIN = {x: 1180, size: 360};
const BOX = {x: 1450, y: 650, size: 300};

const CAMERA: CameraKey[] = [
  {at: 0, x: 430, y: 330, zoom: 1.7},
  {at: 10, x: 760, y: 600, zoom: 2, duration: 30},
  {at: 42, x: 1160, y: 600, zoom: 1.45, duration: 26},
  {at: 92, x: 1290, y: 590, zoom: 1.7, duration: 18},
  {at: 182, x: 1220, y: 470, zoom: 1.25, duration: 30},
  {at: 298, x: 1180, y: 596, zoom: 6, duration: 32},
];

/** Bite frames while the Brain wolfs down its first slice. */
const BITES = [205, 232, 258] as const;

/**
 * Scene 1 · Midnight Pizza Heist (F0–F330). Midnight in the bedroom: the
 * camera drifts from the moon to the 12:00 clock to the bed, the Brain peeks
 * out from under the blanket, opens a glowing pizza box and starts eating.
 * The show title slams in, and the camera dives down the Brain's throat.
 */
export const Scene1MidnightHeist: React.FC = () => {
  const {fps, g, local} = useSceneClock(1);
  const cam = cameraAt(g, fps, CAMERA);

  // The Brain peeks over the blanket, then pops up on the rustle (F80).
  const peek = tween(g, [56, 66], [0, 1], Easing.out(Easing.back(1.6)));
  const up = pop(g, fps, 80, {damping: 10, stiffness: 170});
  // Hidden under a mound (y 720), eyes over the edge (600), sitting up (560).
  const brainY = 720 - peek * 120 - up * 40;
  const lump = 1 - peek * 0.5 - up * 0.42;
  const dart = Math.sin(g * 0.32) > 0 ? 0.9 : -0.9;

  let expression: Expression = 'sneaky';
  let rest: MouthShape = 'idle';
  if (g >= 100 && g < 128) {
    expression = 'excited';
  } else if (g >= 181 && g < 296) {
    const sinceBite = Math.min(...BITES.map((b) => (g >= b ? g - b : 999)));
    expression = sinceBite < 22 ? 'chewing' : 'happy';
    rest = sinceBite < 22 ? 'chew' : 'grin';
  } else if (g >= 296) {
    expression = 'excited';
    rest = 'open';
  }
  const look = g < 100 ? {x: dart, y: 0.2} : g < 128 ? {x: 0.7, y: 0.4} : g < 181 ? {x: dart * 0.6, y: 0} : {x: 0.4, y: 0.2};

  // Arms: surprise on the pop-up, lift the lid, celebrate, shush, then eat.
  let leftArm: LimbPose = {angle: 18, bend: 10};
  let rightArm: LimbPose = {angle: 18, bend: 10};
  if (g >= 82 && g < 95) {
    leftArm = {angle: 70, bend: 20};
    rightArm = {angle: 70, bend: 20};
  } else if (g >= 95 && g < 128) {
    leftArm = {angle: 150, bend: 25};
    rightArm = {angle: tween(g, [95, 104], [110, 145]), bend: 25};
  } else if (g >= 140 && g < 181) {
    leftArm = {angle: tween(g, [140, 148], [18, -80]), bend: -25};
  } else if (g >= 181) {
    const reach = tween(g, [182, 190], [18, 95]);
    const toMouth = tween(g, [192, 202], [0, 1]);
    const chomp = BITES.reduce((acc, b) => acc + tween(g, [b - 3, b], [0, 1]) - tween(g, [b + 2, b + 8], [0, 1]), 0);
    rightArm = {angle: reach + (-88 - reach) * toMouth - chomp * 10, bend: -36 * toMouth};
  }
  const bite = g < BITES[0] ? 0 : g < BITES[1] ? 0.35 : g < BITES[2] ? 0.62 : 0.85;
  const holding =
    g >= 186 && g < 296 ? (
      <g transform="rotate(62) scale(0.32) translate(-120 -60)">
        <PizzaSliceArt face={false} bite={bite} />
      </g>
    ) : undefined;

  const boxOpen = tween(g, [95, 110], [0, 1], Easing.out(Easing.back(1.3)));
  const glow = tween(g, [100, 116], [0, 1]) * (1 - tween(g, [200, 260], [0, 0.6]));
  const mouthPoint = worldToScreen(cam, {x: BRAIN.x, y: brainY + 36});

  return (
    <AbsoluteFill>
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom}>
        <BedroomSet
          morning={0}
          time="12:00"
          lump={lump + Math.sin(g * 1.3) * 0.08 * tween(g, [40, 56], [0, 1]) * (1 - up)}
          lumpX={BRAIN.x}
          sleeper={
            <Place x={BRAIN.x} y={brainY} squash={1 + Math.sin(g * 0.09) * 0.015}>
              <BrainCharacter
                size={BRAIN.size}
                expression={g < 56 ? 'sleeping' : expression}
                mouth={mouthAt('BRAIN', g, rest)}
                look={look}
                leftArm={leftArm}
                rightArm={rightArm}
                torso={false}
                holding={holding}
              />
            </Place>
          }
          front={
            <>
              <Place x={BOX.x} y={BOX.y}>
                <PizzaBox size={BOX.size} open={boxOpen} glow={glow} slicesLeft={g >= 186 ? 7 : 8} />
              </Place>
              <Zzz x={1230} y={600} start={12} end={58} />
            </>
          }
        />
      </Camera>

      <Sequence from={local(150)} durationInFrames={32} layout="none" name="Shhh bubble">
        <SpeechBubble x={mouthPoint.x - 330} y={mouthPoint.y - 210} tailX={mouthPoint.x - 120} tailY={mouthPoint.y - 40} text="SHHH..." variant="whisper" start={0} duration={32} fontSize={50} />
      </Sequence>
      <Sequence from={local(200)} durationInFrames={98} layout="none" name="Show title">
        <TitleCard text="ORGAN DRAMA" sub="MIDNIGHT PIZZA" variant="logo" durationInFrames={98} x={960} y={230} />
      </Sequence>
    </AbsoluteFill>
  );
};

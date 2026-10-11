import React from 'react';
import {AbsoluteFill} from 'remotion';
import {PALETTE} from '../../theme';
import type {Expression} from '../../types/characters';
import {armsFor} from '../gestures';
import {OrganPuppet} from '../OrganPuppet';
import {resolveShape, SHAPES} from '../shapes';
import type {Accessory, CustomShape, Gesture, ShapeName} from '../types';

/** The custom-shape example from the make-video skill's reference, drawn like a library shape. */
const CUSTOM_EXAMPLE: CustomShape = {
  viewBox: {width: 400, height: 420},
  body: 'M200,40 C300,40 350,140 340,240 C330,330 270,370 200,370 C130,370 70,330 60,240 C50,140 100,40 200,40 Z',
  details: [{d: 'M120,300 C160,320 240,320 280,300', stroke: 5, strokeColor: 'dark', opacity: 0.4}],
  behind: [{d: 'M200,40 L200,0', fill: 'light', stroke: 24, tube: true}],
  front: [{d: 'M190,20 C210,0 240,0 250,20 Z', fill: '#22C55E', stroke: 5}],
  face: {eyes: [{x: 160, y: 200}, {x: 240, y: 200}], eyeR: 40, mouth: {x: 200, y: 280}, mouthScale: 0.9},
  arms: {left: {x: 62, y: 230}, right: {x: 338, y: 230}, length: 100},
  legs: {left: {x: 160, y: 366}, right: {x: 240, y: 366}, length: 60},
  head: {x: 200, y: 44, width: 200},
  neck: {x: 200, y: 330},
};

const NAMES = Object.keys(SHAPES) as ShapeName[];
const EXPR: Expression[] = ['happy', 'excited', 'worried', 'grumpy', 'smug', 'shocked', 'sleepy', 'neutral'];
const GEST: Gesture[] = ['idle', 'wave', 'point', 'shrug', 'cheer', 'hips', 'think', 'present', 'stop', 'crossed', 'panic', 'facepalm'];
const ACC: Accessory[][] = [
  [{type: 'nightcap'}],
  [{type: 'tophat'}, {type: 'monocle'}],
  [{type: 'cap'}],
  [{type: 'crown'}],
  [{type: 'beanie'}, {type: 'scarf'}],
  [{type: 'chefHat'}, {type: 'mustache'}],
  [{type: 'partyHat'}],
  [{type: 'headband'}],
  [{type: 'bow'}],
  [{type: 'gradCap'}, {type: 'glasses'}],
  [{type: 'hardhat'}, {type: 'badge', label: 'ZZZ'}],
  [{type: 'shades'}, {type: 'bowtie'}],
  [{type: 'tie'}],
];

/** Every library shape with a different expression, gesture and accessory set. */
export const ShapeSheet: React.FC<{page?: number}> = ({page = 0}) => {
  const names: (ShapeName | 'custom')[] = [...NAMES, 'custom' as const].slice(page * 12, page * 12 + 12);
  return (
    <AbsoluteFill style={{background: '#FDF2F8'}}>
      {names.map((name, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const g = GEST[(i + page * 5) % GEST.length];
        const arms = armsFor(g, 1, 40);
        const shape = name === 'custom' ? resolveShape(CUSTOM_EXAMPLE) : SHAPES[name];
        return (
          <div key={name} style={{position: 'absolute', left: 20 + col * 316, top: 30 + row * 530, width: 300, height: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end'}}>
            <OrganPuppet
              shape={shape}
              size={Math.min(250, shape.size * 0.78)}
              expression={EXPR[i % EXPR.length]}
              mouth={i % 3 === 0 ? 'open' : i % 3 === 1 ? 'smile' : 'idle'}
              leftArm={arms.left}
              rightArm={arms.right}
              crossed={arms.crossed}
              reach={arms.reach}
              accessories={ACC[(i + page * 7) % ACC.length]}
              blink={0}
            />
            <div style={{fontFamily: 'sans-serif', fontWeight: 800, color: PALETTE.ink, fontSize: 22, marginTop: 14}}>
              {name} · {g}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

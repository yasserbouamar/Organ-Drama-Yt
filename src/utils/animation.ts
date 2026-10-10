import {Easing, interpolate, random, spring, type SpringConfig} from 'remotion';
import {POP_SPRING} from '../theme';

export const clamp = (v: number, min = 0, max = 1): number => Math.min(max, Math.max(min, v));

/** `interpolate` clamped at both ends, eased in-out by default. */
export const tween = (
  frame: number,
  [from, to]: readonly [number, number],
  [a, b]: readonly [number, number],
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
): number =>
  interpolate(frame, [from, to], [a, b], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** The house pop spring (damping 12, stiffness 200), starting at `start`. */
export const pop = (frame: number, fps: number, start = 0, config: Partial<SpringConfig> = POP_SPRING): number =>
  spring({frame: frame - start, fps, config});

/** A critically damped settle, for camera moves and slides that shouldn't bounce. */
export const settle = (frame: number, fps: number, start = 0, durationInFrames?: number): number =>
  spring({frame: frame - start, fps, config: {damping: 200}, durationInFrames});

/** Pop in at `start`, pop out over the last `outFrames` before `end`. */
export const popInOut = (frame: number, fps: number, start: number, end: number, outFrames = 8): number => {
  const enter = pop(frame, fps, start);
  const exit = tween(frame, [end - outFrames, end], [1, 0], Easing.in(Easing.back(2)));
  return frame >= end ? 0 : Math.min(enter, exit);
};

export const wobble = (frame: number, speed: number, amplitude: number, phase = 0): number =>
  Math.sin(frame * speed + phase) * amplitude;

/** Smooth 1D value noise in -1..1, deterministic per seed. */
export const noise1D = (seed: string, t: number): number => {
  const i = Math.floor(t);
  const f = t - i;
  const s = f * f * (3 - 2 * f);
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  return a + (b - a) * s;
};

/** Camera / prop shake offset that eases out with `intensity`. */
export const shake = (frame: number, intensity: number, seed = 'shake'): {x: number; y: number; r: number} => {
  if (intensity <= 0) {
    return {x: 0, y: 0, r: 0};
  }
  return {
    x: noise1D(`${seed}-x`, frame * 0.9) * intensity,
    y: noise1D(`${seed}-y`, frame * 0.9 + 50) * intensity,
    r: noise1D(`${seed}-r`, frame * 0.7 + 99) * intensity * 0.08,
  };
};

/** 1 on the frame of an impact, decaying to 0 over `length` frames. */
export const impact = (frame: number, at: number, length = 12): number => {
  if (frame < at) {
    return 0;
  }
  return Math.max(0, 1 - (frame - at) / length) ** 2;
};

/** Strongest decaying impact from a list of hit frames. */
export const impacts = (frame: number, hits: readonly number[], length = 12): number =>
  hits.reduce((acc, at) => Math.max(acc, impact(frame, at, length)), 0);

/** Automatic blinking: returns lid closure 0..1, blinking every ~3–4s. */
export const autoBlink = (frame: number, seed: string): number => {
  const period = 85 + Math.floor(random(`${seed}-period`) * 40);
  const offset = Math.floor(random(`${seed}-offset`) * period);
  const t = (frame + offset) % period;
  const length = 6;
  if (t >= length) {
    return 0;
  }
  return 1 - Math.abs(t - length / 2) / (length / 2);
};

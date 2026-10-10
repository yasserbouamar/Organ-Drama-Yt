import {Easing, interpolate, random, spring, type SpringConfig} from 'remotion';
import {POP_SPRING} from '../theme';

export const clamp = (v: number, min = 0, max = 1): number => Math.min(max, Math.max(min, v));

/** `interpolate` clamped at both ends, eased in-out by default. */
export const tween = (
  frame: number,
  [from, to]: readonly [number, number],
  [a, b]: readonly [number, number],
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
): number => {
  // Word-cued ranges can collapse after a re-record; step instead of throwing.
  if (to <= from) {
    return frame >= from ? b : a;
  }
  return interpolate(frame, [from, to], [a, b], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
};

/** The house pop spring (damping 12, stiffness 200), starting at `start`. */
export const pop = (frame: number, fps: number, start = 0, config: Partial<SpringConfig> = POP_SPRING): number =>
  spring({frame: frame - start, fps, config});

/** Pop in at `start`, pop out over the last `outFrames` before `end`. */
export const popInOut = (frame: number, fps: number, start: number, end: number, outFrames = 8): number => {
  const enter = pop(frame, fps, start);
  const exit = tween(frame, [end - outFrames, end], [1, 0], Easing.in(Easing.back(2)));
  return frame >= end ? 0 : Math.min(enter, exit);
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

/**
 * Automatic blinking: lid closure 0..1, every ~3–4.5 s. The lid snaps shut on
 * a stiff spring and eases back open on a softer one; about one blink in four
 * is a double blink.
 */
export const springBlink = (frame: number, fps: number, seed: string): number => {
  const period = 95 + Math.floor(random(`${seed}-period`) * 40);
  const offset = Math.floor(random(`${seed}-offset`) * period);
  const cycle = Math.floor((frame + offset) / period);
  const t = (frame + offset) % period;
  const blinkAt = (at: number): number => {
    const close = spring({frame: t - at, fps, config: {damping: 20, stiffness: 520}});
    const open = spring({frame: t - at - 3, fps, config: {damping: 18, stiffness: 260}});
    return close - open;
  };
  const double = random(`${seed}-double-${cycle}`) < 0.25;
  return clamp(Math.max(blinkAt(0), double ? blinkAt(8) : 0));
};

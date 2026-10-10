import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLine, getScene, lineWindow} from '../data/script60s';
import {VIDEO} from '../theme';
import type {Point} from '../types/characters';
import type {SceneId} from '../types/dialogue';
import {wordTiming} from '../utils/lipSync';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export interface CameraKey {
  /** Scene-local frame the move starts. */
  at: number;
  x: number;
  y: number;
  zoom: number;
  rotation?: number;
  /** Move length in frames (critically damped spring). */
  duration?: number;
  /** Jump instantly instead of easing (a hard cut). */
  cut?: boolean;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Camera from a list of keyframes. Each key eases from wherever the previous
 * moves left the camera, so overlapping moves blend instead of popping.
 * Zoom is interpolated in log space so push-ins feel linear.
 */
export const cameraAt = (frame: number, fps: number, keys: readonly CameraKey[]): CameraState => {
  const first = keys[0];
  let state: CameraState = {x: first.x, y: first.y, zoom: first.zoom, rotation: first.rotation ?? 0};
  for (const key of keys.slice(1)) {
    const t = key.cut
      ? frame >= key.at
        ? 1
        : 0
      : spring({frame: frame - key.at, fps, config: {damping: 200}, durationInFrames: key.duration ?? 24});
    if (t <= 0) {
      continue;
    }
    state = {
      x: lerp(state.x, key.x, t),
      y: lerp(state.y, key.y, t),
      zoom: Math.exp(lerp(Math.log(state.zoom), Math.log(key.zoom), t)),
      rotation: lerp(state.rotation, key.rotation ?? 0, t),
    };
  }
  return state;
};

/** Where a world point lands on screen under a camera (rotation ignored). */
export const worldToScreen = (cam: CameraState, p: Point): Point => ({
  x: (p.x - cam.x) * cam.zoom + VIDEO.width / 2,
  y: (p.y - cam.y) * cam.zoom + VIDEO.height / 2,
});

/**
 * Scene-local frame plus the absolute frame (for lip sync, which reads the
 * global script). Call it at the top of a scene, not inside nested Sequences.
 */
export const useSceneClock = (id: SceneId) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scene = getScene(id);
  return {frame, fps, global: frame + scene.startFrame, scene};
};

/** Maps a point in a puppet's local units to world px, given where the puppet is placed. */
export const localToWorld = (
  placed: {x: number; y: number; size: number},
  viewBox: {width: number; height: number},
  p: Point,
): Point => {
  const s = placed.size / viewBox.width;
  return {x: placed.x + (p.x - viewBox.width / 2) * s, y: placed.y + (p.y - viewBox.height / 2) * s};
};

/** Inverse of `localToWorld`. */
export const worldToLocal = (
  placed: {x: number; y: number; size: number},
  viewBox: {width: number; height: number},
  p: Point,
): Point => {
  const s = placed.size / viewBox.width;
  return {x: (p.x - placed.x) / s + viewBox.width / 2, y: (p.y - placed.y) / s + viewBox.height / 2};
};

export interface CueOptions {
  /** Which match of the word, if it appears more than once (0-based). */
  occurrence?: number;
  /** Frames to add (negative = anticipate the word). */
  offset?: number;
  /** Key off the word's start (default) or its end. */
  edge?: 'start' | 'end';
}

/**
 * Scene-local frame when `word` is spoken in a line, so a beat (a hammer hit,
 * a stamp, a badge) lands on the voice instead of on a hard-coded frame.
 */
export const cue = (lineId: string, word: string, {occurrence = 0, offset = 0, edge = 'start'}: CueOptions = {}): number => {
  const w = wordTiming(getLine(lineId), word, occurrence);
  return Math.round(lineWindow(lineId).from + (edge === 'start' ? w.startFrame : w.endFrame) + offset);
};

/** Like `cue`, but relative to the line's own start (for panels mounted in a line-length Sequence). */
export const lineCue = (lineId: string, word: string, options: CueOptions = {}): number =>
  cue(lineId, word, options) - lineWindow(lineId).from;

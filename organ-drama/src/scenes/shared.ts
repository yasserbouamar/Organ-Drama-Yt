import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {getScene} from '../data/scriptData';
import {VIDEO} from '../theme';
import type {Point} from '../types/characters';
import type {SceneId} from '../types/dialogue';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export interface CameraKey {
  /** Absolute (composition) frame the move starts, as in the shooting script. */
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
 * Spring camera from keyframes. Each key eases from wherever the previous
 * moves left the camera, so overlapping moves blend instead of popping. Zoom
 * is interpolated in log space so push-ins feel linear.
 */
export const cameraAt = (globalFrame: number, fps: number, keys: readonly CameraKey[]): CameraState => {
  const first = keys[0];
  let state: CameraState = {x: first.x, y: first.y, zoom: first.zoom, rotation: first.rotation ?? 0};
  for (const key of keys.slice(1)) {
    const t = key.cut
      ? globalFrame >= key.at
        ? 1
        : 0
      : spring({frame: globalFrame - key.at, fps, config: {damping: 200}, durationInFrames: key.duration ?? 24});
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
  return clampToWorld(state);
};

/** Keeps the view inside the 1920×1080 world so the edges never show. */
export const clampToWorld = (cam: CameraState): CameraState => {
  if (cam.zoom < 1) {
    return cam;
  }
  const hw = VIDEO.width / 2 / cam.zoom;
  const hh = VIDEO.height / 2 / cam.zoom;
  return {
    ...cam,
    x: Math.min(VIDEO.width - hw, Math.max(hw, cam.x)),
    y: Math.min(VIDEO.height - hh, Math.max(hh, cam.y)),
  };
};

/** Where a world point lands on screen under a camera (rotation ignored). */
export const worldToScreen = (cam: CameraState, p: Point): Point => ({
  x: (p.x - cam.x) * cam.zoom + VIDEO.width / 2,
  y: (p.y - cam.y) * cam.zoom + VIDEO.height / 2,
});

/**
 * The scene's clock. `g` is the absolute frame, so beats read exactly like
 * the shooting script (`tween(g, [386, 391], …)` = "F386–F391"); `local()`
 * converts a script frame to the scene's own timeline for `<Sequence from>`.
 */
export const useSceneClock = (id: SceneId) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scene = getScene(id);
  return {frame, fps, g: frame + scene.startFrame, scene, local: (scriptFrame: number) => scriptFrame - scene.startFrame};
};

/** Rotates a vector by `deg` degrees (clockwise in screen space, like CSS). */
export const rotateVec = (v: Point, deg: number): Point => {
  const a = (deg * Math.PI) / 180;
  return {x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a)};
};

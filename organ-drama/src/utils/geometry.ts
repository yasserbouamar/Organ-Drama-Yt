import type {Point} from '../types/characters';

const fmt = (n: number): string => (Math.round(n * 100) / 100).toString();

/** Closed, smooth path through `points` (Catmull-Rom converted to cubic Béziers). */
export const smoothClosedPath = (points: readonly Point[], tension = 1): string => {
  const n = points.length;
  if (n < 3) {
    return '';
  }
  let d = `M${fmt(points[0].x)},${fmt(points[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d += ` C${fmt(c1x)},${fmt(c1y)} ${fmt(c2x)},${fmt(c2y)} ${fmt(p2.x)},${fmt(p2.y)}`;
  }
  return `${d} Z`;
};

export const polar = (cx: number, cy: number, r: number, angleDeg: number): Point => {
  const a = (angleDeg * Math.PI) / 180;
  return {x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r};
};

/** A spiky comic "burst" star polygon. */
export const burstPath = (
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  spikes: number,
  jitter: (i: number) => number = () => 1,
): string => {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = (i % 2 === 0 ? outer : inner) * jitter(i);
    const p = polar(cx, cy, r, (i / (spikes * 2)) * 360 - 90);
    pts.push(`${fmt(p.x)},${fmt(p.y)}`);
  }
  return `M${pts.join(' L')} Z`;
};

/** Teardrop pointing up, tip at (x, y - size). */
export const dropPath = (x: number, y: number, size: number): string =>
  `M${fmt(x)},${fmt(y - size)} C${fmt(x + size * 0.55)},${fmt(y - size * 0.25)} ${fmt(x + size * 0.6)},${fmt(
    y + size * 0.55,
  )} ${fmt(x)},${fmt(y + size * 0.55)} C${fmt(x - size * 0.6)},${fmt(y + size * 0.55)} ${fmt(
    x - size * 0.55,
  )},${fmt(y - size * 0.25)} ${fmt(x)},${fmt(y - size)} Z`;

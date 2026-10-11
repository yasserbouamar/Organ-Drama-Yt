/** Tiny colour helpers so a puppet's whole palette can come from one base colour. */

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export const parseHex = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return Number.isNaN(n) ? [200, 200, 200] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = ([r, g, b]: readonly number[]) => `#${[r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('')}`;

/** Mix `a` toward `b` by `t` (0..1). */
export const mixHex = (a: string, b: string, t: number): string => {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};

export const lighten = (hex: string, t: number) => mixHex(hex, '#FFFFFF', t);
/** Darken toward a warm plum rather than black, so shading stays colourful. */
export const darken = (hex: string, t: number) => mixHex(hex, '#2A1540', t);

/** Perceived brightness 0..1. */
export const luminance = (hex: string): number => {
  const [r, g, b] = parseHex(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

/** Light, base and shade for a body, plus a limb colour and a cheek blush. */
export const bodyTones = (base: string) => {
  const pale = luminance(base) > 0.88;
  return {
    light: lighten(base, pale ? 0.6 : 0.38),
    base,
    dark: darken(base, pale ? 0.22 : 0.3),
    limb: darken(base, pale ? 0.35 : 0.22),
    blush: mixHex(base, '#FB7185', 0.6),
  };
};

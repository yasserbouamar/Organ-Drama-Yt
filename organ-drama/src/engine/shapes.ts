/**
 * The shape library: body silhouettes rigged for `OrganPuppet`. Every shape
 * says where the face, arms, legs, hat and tie go, so any of them can talk,
 * gesture and walk in the house style. Episodes can also pass a
 * `CustomShape` with the same fields to draw something new.
 */
import type {CustomShape, ShapeName, ShapeStroke} from './types';

export interface ShapeDef extends CustomShape {
  /** Default body colour. */
  color: string;
  /** Default rendered width in px. */
  size: number;
}

// ── Path helpers ─────────────────────────────────────────────────────────

const f = (n: number) => n.toFixed(1);

/** A closed circle as a path. */
export const circlePath = (cx: number, cy: number, r: number): string =>
  `M${f(cx - r)},${f(cy)} A${r},${r} 0 1 0 ${f(cx + r)},${f(cy)} A${r},${r} 0 1 0 ${f(cx - r)},${f(cy)} Z`;

export const ellipsePath = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${f(cx - rx)},${f(cy)} A${rx},${ry} 0 1 0 ${f(cx + rx)},${f(cy)} A${rx},${ry} 0 1 0 ${f(cx - rx)},${f(cy)} Z`;

/** A smooth closed curve through points (Catmull–Rom → cubic Béziers). */
export const smoothPath = (pts: readonly {x: number; y: number}[], tension = 1): string => {
  const n = pts.length;
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = {x: p1.x + ((p2.x - p0.x) / 6) * tension, y: p1.y + ((p2.y - p0.y) / 6) * tension};
    const c2 = {x: p2.x - ((p3.x - p1.x) / 6) * tension, y: p2.y - ((p3.y - p1.y) / 6) * tension};
    d += ` C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)}`;
  }
  return `${d} Z`;
};

/** A wobbly round blob: `bumps` lumps of size `amp` around an ellipse. */
export const blobPath = (cx: number, cy: number, rx: number, ry: number, bumps: number, amp: number, phase = 0): string => {
  const pts = Array.from({length: bumps * 2}, (_, i) => {
    const a = (i / (bumps * 2)) * Math.PI * 2 + phase;
    const k = 1 + (i % 2 === 0 ? amp : -amp * 0.4);
    return {x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k};
  });
  return smoothPath(pts);
};

/** A vertical capsule (stadium). */
export const capsulePath = (x: number, y: number, w: number, h: number): string => {
  const r = w / 2;
  return `M${f(x)},${f(y + r)} A${r},${r} 0 0 1 ${f(x + w)},${f(y + r)} L${f(x + w)},${f(y + h - r)} A${r},${r} 0 0 1 ${f(x)},${f(y + h - r)} Z`;
};

const tube = (d: string, width: number, fill = 'light'): ShapeStroke => ({d, fill, stroke: width, tube: true});
const line = (d: string, width = 5, opacity = 0.35, strokeColor = 'dark'): ShapeStroke => ({d, stroke: width, strokeColor, opacity});

// ── Library ──────────────────────────────────────────────────────────────

const spikes = (cx: number, cy: number, r: number, n: number, len: number): ShapeStroke[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.2;
    const x1 = cx + Math.cos(a) * (r - 6);
    const y1 = cy + Math.sin(a) * (r - 6);
    const x2 = cx + Math.cos(a) * (r + len);
    const y2 = cy + Math.sin(a) * (r + len);
    return [tube(`M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}`, 14, 'dark'), {d: circlePath(x2, y2, 17), fill: 'light', stroke: 5}];
  }).flat();

export const SHAPES: Record<ShapeName, ShapeDef> = {
  lungs: {
    viewBox: {width: 420, height: 440},
    color: '#F8A5C2',
    size: 340,
    body: 'M198,112 C160,74 96,92 70,170 C48,240 50,330 82,370 C106,402 160,402 190,372 L230,372 C260,402 314,402 338,370 C370,330 372,240 350,170 C324,92 260,74 222,112 C218,150 214,180 210,196 C206,180 202,150 198,112 Z',
    behind: [tube('M210,6 L210,118', 46), tube('M210,108 Q176,124 160,150 M210,108 Q244,124 260,150', 30)],
    details: [line('M86,262 C124,246 156,270 182,256'), line('M334,252 C296,238 266,262 240,250'), line('M210,206 L210,368', 4, 0.25)],
    face: {eyes: [{x: 146, y: 250}, {x: 274, y: 250}], eyeR: 40, mouth: {x: 210, y: 326}, mouthScale: 0.9, cheeks: true},
    arms: {left: {x: 62, y: 262}, right: {x: 358, y: 262}, length: 110},
    legs: {left: {x: 170, y: 386}, right: {x: 250, y: 386}, length: 70},
    head: {x: 210, y: 96, width: 170},
    neck: {x: 210, y: 360},
  },
  liver: {
    viewBox: {width: 460, height: 340},
    color: '#C8553D',
    size: 380,
    body: 'M38,150 C58,88 160,58 272,60 C372,62 434,100 434,172 C434,244 380,292 300,302 C220,312 140,272 88,232 C58,208 30,186 38,150 Z',
    details: [line('M252,64 C242,140 238,220 232,302', 5, 0.3), line('M300,260 C320,250 350,256 368,240', 4, 0.25)],
    face: {eyes: [{x: 236, y: 168}, {x: 328, y: 162}], eyeR: 38, mouth: {x: 286, y: 236}, mouthScale: 0.85, cheeks: true},
    arms: {left: {x: 62, y: 196}, right: {x: 426, y: 196}, length: 100},
    legs: {left: {x: 210, y: 300}, right: {x: 320, y: 300}, length: 70},
    head: {x: 300, y: 62, width: 190},
    neck: {x: 286, y: 290},
  },
  kidney: {
    viewBox: {width: 340, height: 430},
    color: '#B9475B',
    size: 280,
    body: 'M150,36 C240,26 300,96 296,170 C294,206 262,214 254,240 C246,268 284,290 280,330 C274,388 214,410 150,400 C80,390 40,320 40,220 C40,110 70,44 150,36 Z',
    behind: [tube('M258,246 C300,260 320,330 300,428', 30)],
    details: [line('M120,90 C90,150 92,300 130,360', 5, 0.25)],
    face: {eyes: [{x: 126, y: 176}, {x: 206, y: 170}], eyeR: 34, mouth: {x: 166, y: 248}, mouthScale: 0.8, cheeks: true},
    arms: {left: {x: 44, y: 226}, right: {x: 292, y: 168}, length: 96},
    legs: {left: {x: 120, y: 396}, right: {x: 200, y: 398}, length: 64},
    head: {x: 166, y: 38, width: 170},
    neck: {x: 166, y: 300},
  },
  intestine: {
    viewBox: {width: 420, height: 400},
    color: '#F4A6B7',
    size: 340,
    body: 'M80,60 C160,30 260,30 340,60 C390,80 400,150 396,220 C392,300 360,360 280,372 C200,384 120,380 72,350 C30,320 24,240 28,170 C32,110 40,76 80,60 Z',
    details: [
      line('M56,112 C100,86 140,140 186,112 C232,84 272,138 318,112 C340,100 360,104 372,116', 7, 0.28),
      line('M44,316 C92,290 130,344 178,318 C226,292 264,346 312,320 C338,306 360,310 378,322', 7, 0.28),
      line('M44,180 C40,220 48,250 56,270', 6, 0.22),
      line('M378,176 C384,216 380,248 370,272', 6, 0.22),
    ],
    face: {eyes: [{x: 160, y: 196}, {x: 260, y: 196}], eyeR: 42, mouth: {x: 210, y: 274}, mouthScale: 0.95, cheeks: true},
    arms: {left: {x: 30, y: 214}, right: {x: 392, y: 214}, length: 104},
    legs: {left: {x: 160, y: 372}, right: {x: 260, y: 372}, length: 64},
    head: {x: 210, y: 44, width: 230},
    neck: {x: 210, y: 336},
  },
  bladder: {
    viewBox: {width: 340, height: 400},
    color: '#F9D776',
    size: 270,
    body: 'M170,40 C250,40 300,120 300,210 C300,296 248,346 196,352 L190,378 L150,378 L144,352 C92,346 40,296 40,210 C40,120 90,40 170,40 Z',
    face: {eyes: [{x: 128, y: 192}, {x: 212, y: 192}], eyeR: 38, mouth: {x: 170, y: 270}, mouthScale: 0.85, cheeks: true},
    arms: {left: {x: 44, y: 222}, right: {x: 296, y: 222}, length: 96},
    legs: {left: {x: 136, y: 352}, right: {x: 204, y: 352}, length: 64},
    head: {x: 170, y: 42, width: 200},
    neck: {x: 170, y: 330},
  },
  tooth: {
    viewBox: {width: 340, height: 420},
    color: '#F8FAFC',
    size: 270,
    body: 'M70,60 C110,30 150,50 170,62 C190,50 230,30 270,60 C310,90 306,170 290,220 C280,250 278,300 266,360 C258,400 222,400 214,360 C206,320 196,290 170,290 C144,290 134,320 126,360 C118,400 82,400 74,360 C62,300 60,250 50,220 C34,170 30,90 70,60 Z',
    details: [line('M120,64 C140,84 150,84 170,70 C190,84 200,84 220,64', 5, 0.25)],
    face: {eyes: [{x: 126, y: 160}, {x: 214, y: 160}], eyeR: 38, mouth: {x: 170, y: 236}, mouthScale: 0.85, cheeks: true},
    arms: {left: {x: 46, y: 176}, right: {x: 294, y: 176}, length: 96},
    legs: {left: {x: 100, y: 384}, right: {x: 240, y: 384}, length: 34},
    head: {x: 170, y: 52, width: 210},
    neck: {x: 170, y: 280},
  },
  bone: {
    viewBox: {width: 300, height: 480},
    color: '#F5EFDF',
    size: 210,
    body: 'M80,40 C116,4 150,30 150,62 C150,30 184,4 220,40 C256,76 232,124 200,128 L200,352 C232,356 256,404 220,440 C184,476 150,450 150,418 C150,450 116,476 80,440 C44,404 68,356 100,352 L100,128 C68,124 44,76 80,40 Z',
    face: {eyes: [{x: 126, y: 206}, {x: 174, y: 206}], eyeR: 24, mouth: {x: 150, y: 262}, mouthScale: 0.6, cheeks: false},
    arms: {left: {x: 102, y: 248}, right: {x: 198, y: 248}, length: 94, width: 12},
    legs: {left: {x: 108, y: 452}, right: {x: 192, y: 452}, length: 30, width: 12},
    head: {x: 150, y: 28, width: 150},
    neck: {x: 150, y: 300},
  },
  redBloodCell: {
    viewBox: {width: 400, height: 300},
    color: '#E53935',
    size: 320,
    body: ellipsePath(200, 150, 182, 122),
    details: [{d: ellipsePath(200, 156, 118, 70), fill: 'dark', opacity: 0.22}],
    face: {eyes: [{x: 158, y: 136}, {x: 242, y: 136}], eyeR: 36, mouth: {x: 200, y: 206}, mouthScale: 0.85, cheeks: true},
    arms: {left: {x: 22, y: 160}, right: {x: 378, y: 160}, length: 92},
    legs: {left: {x: 160, y: 264}, right: {x: 240, y: 264}, length: 60},
    head: {x: 200, y: 32, width: 220},
    neck: {x: 200, y: 250},
  },
  whiteBloodCell: {
    viewBox: {width: 400, height: 400},
    color: '#EDE7F6',
    size: 320,
    body: blobPath(200, 200, 162, 158, 8, 0.07, 0.3),
    details: [
      {d: blobPath(118, 296, 42, 30, 5, 0.12), fill: '#B39DDB', opacity: 0.45},
      {d: blobPath(286, 300, 34, 26, 5, 0.12), fill: '#B39DDB', opacity: 0.45},
    ],
    face: {eyes: [{x: 158, y: 180}, {x: 242, y: 180}], eyeR: 42, mouth: {x: 200, y: 260}, mouthScale: 0.95, cheeks: true},
    arms: {left: {x: 44, y: 216}, right: {x: 356, y: 216}, length: 104},
    legs: {left: {x: 160, y: 352}, right: {x: 240, y: 352}, length: 64},
    head: {x: 200, y: 42, width: 230},
    neck: {x: 200, y: 330},
  },
  virus: {
    viewBox: {width: 400, height: 420},
    color: '#8BC34A',
    size: 320,
    body: circlePath(200, 214, 128),
    behind: spikes(200, 214, 128, 11, 42),
    details: [{d: circlePath(128, 290, 16), fill: 'dark', opacity: 0.25}, {d: circlePath(278, 300, 12), fill: 'dark', opacity: 0.25}],
    face: {eyes: [{x: 160, y: 200}, {x: 240, y: 200}], eyeR: 38, mouth: {x: 200, y: 268}, mouthScale: 0.9, cheeks: false},
    arms: {left: {x: 80, y: 250}, right: {x: 320, y: 250}, length: 100},
    legs: {left: {x: 166, y: 334}, right: {x: 234, y: 334}, length: 72},
    head: {x: 200, y: 88, width: 180},
    neck: {x: 200, y: 316},
  },
  bacteria: {
    viewBox: {width: 300, height: 440},
    color: '#A78BFA',
    size: 230,
    body: capsulePath(50, 40, 200, 340),
    behind: [
      line('M70,330 C30,350 50,390 14,410 C-10,424 0,440 -10,450', 7, 1, 'ink'),
      line('M230,330 C270,350 250,390 286,410 C310,424 300,440 310,450', 7, 1, 'ink'),
      line('M90,60 C60,30 90,10 60,-10', 7, 1, 'ink'),
      line('M210,60 C240,30 210,10 240,-10', 7, 1, 'ink'),
    ],
    details: [
      {d: circlePath(92, 300, 14), fill: 'dark', opacity: 0.25},
      {d: circlePath(206, 320, 10), fill: 'dark', opacity: 0.25},
      {d: circlePath(200, 100, 9), fill: 'dark', opacity: 0.25},
    ],
    face: {eyes: [{x: 114, y: 176}, {x: 186, y: 176}], eyeR: 34, mouth: {x: 150, y: 244}, mouthScale: 0.8, cheeks: true},
    arms: {left: {x: 54, y: 230}, right: {x: 246, y: 230}, length: 96},
    legs: {left: {x: 116, y: 376}, right: {x: 184, y: 376}, length: 60},
    head: {x: 150, y: 42, width: 170},
    neck: {x: 150, y: 300},
  },
  neuron: {
    viewBox: {width: 460, height: 460},
    color: '#C084FC',
    size: 340,
    body: blobPath(230, 222, 132, 124, 6, 0.06, 0.5),
    behind: [
      tube('M140,140 L70,70 M70,70 L30,80 M70,70 L64,26', 22),
      tube('M320,140 L392,72 M392,72 L436,84 M392,72 L398,28', 22),
      tube('M108,250 L30,262 M30,262 L6,232', 20),
      tube('M352,250 L430,262 M430,262 L456,232', 20),
    ],
    face: {eyes: [{x: 190, y: 206}, {x: 270, y: 206}], eyeR: 40, mouth: {x: 230, y: 280}, mouthScale: 0.9, cheeks: true},
    arms: {left: {x: 108, y: 262}, right: {x: 352, y: 262}, length: 100},
    legs: {left: {x: 196, y: 340}, right: {x: 264, y: 340}, length: 66},
    head: {x: 230, y: 96, width: 190},
    neck: {x: 230, y: 330},
  },
  cell: {
    viewBox: {width: 400, height: 400},
    color: '#FBCFE8',
    size: 310,
    body: circlePath(200, 206, 164),
    details: [
      {d: circlePath(292, 112, 34), fill: 'dark', opacity: 0.25},
      {d: ellipsePath(96, 298, 22, 12), fill: 'dark', opacity: 0.2},
      {d: ellipsePath(300, 310, 16, 10), fill: 'dark', opacity: 0.2},
    ],
    face: {eyes: [{x: 160, y: 196}, {x: 240, y: 196}], eyeR: 40, mouth: {x: 200, y: 276}, mouthScale: 0.95, cheeks: true},
    arms: {left: {x: 40, y: 230}, right: {x: 360, y: 230}, length: 104},
    legs: {left: {x: 162, y: 362}, right: {x: 238, y: 362}, length: 64},
    head: {x: 200, y: 44, width: 220},
    neck: {x: 200, y: 340},
  },
  molecule: {
    viewBox: {width: 460, height: 460},
    color: '#60A5FA',
    size: 340,
    body: circlePath(230, 244, 118),
    behind: [
      tube('M230,244 L84,104', 26, '#E5E7EB'),
      tube('M230,244 L392,112', 26, '#E5E7EB'),
      tube('M230,244 L420,330', 26, '#E5E7EB'),
      {d: circlePath(84, 104, 62), fill: 'light', stroke: 6},
      {d: circlePath(392, 112, 50), fill: '#F8FAFC', stroke: 6},
      {d: circlePath(420, 330, 40), fill: 'light', stroke: 6},
    ],
    face: {eyes: [{x: 192, y: 228}, {x: 268, y: 228}], eyeR: 36, mouth: {x: 230, y: 296}, mouthScale: 0.85, cheeks: true},
    arms: {left: {x: 116, y: 276}, right: {x: 344, y: 276}, length: 96},
    legs: {left: {x: 200, y: 354}, right: {x: 260, y: 354}, length: 64},
    head: {x: 230, y: 128, width: 170},
    neck: {x: 230, y: 340},
  },
  drop: {
    viewBox: {width: 400, height: 430},
    color: '#38BDF8',
    size: 290,
    body: 'M200,30 C250,110 330,190 330,270 C330,345 270,400 200,400 C130,400 70,345 70,270 C70,190 150,110 200,30 Z',
    face: {eyes: [{x: 164, y: 262}, {x: 236, y: 262}], eyeR: 36, mouth: {x: 200, y: 330}, mouthScale: 0.85, cheeks: true},
    arms: {left: {x: 76, y: 284}, right: {x: 324, y: 284}, length: 96},
    legs: {left: {x: 166, y: 396}, right: {x: 234, y: 396}, length: 60},
    head: {x: 200, y: 150, width: 150},
    neck: {x: 200, y: 380},
  },
  blob: {
    viewBox: {width: 400, height: 400},
    color: '#FDBA74',
    size: 300,
    body: smoothPath([
      {x: 200, y: 40},
      {x: 300, y: 70},
      {x: 352, y: 170},
      {x: 340, y: 290},
      {x: 270, y: 362},
      {x: 130, y: 362},
      {x: 60, y: 290},
      {x: 50, y: 170},
      {x: 100, y: 70},
    ]),
    face: {eyes: [{x: 160, y: 190}, {x: 240, y: 190}], eyeR: 40, mouth: {x: 200, y: 270}, mouthScale: 0.95, cheeks: true},
    arms: {left: {x: 52, y: 222}, right: {x: 348, y: 222}, length: 100},
    legs: {left: {x: 160, y: 360}, right: {x: 240, y: 360}, length: 62},
    head: {x: 200, y: 44, width: 220},
    neck: {x: 200, y: 340},
  },
  pill: {
    viewBox: {width: 260, height: 440},
    color: '#F43F5E',
    size: 200,
    body: capsulePath(40, 30, 180, 380),
    details: [{d: 'M0,224 L260,224 L260,440 L0,440 Z', fill: '#F8FAFC'}, line('M40,224 L220,224', 6, 0.5, 'ink')],
    face: {eyes: [{x: 100, y: 174}, {x: 160, y: 174}], eyeR: 30, mouth: {x: 130, y: 268}, mouthScale: 0.7, cheeks: true},
    arms: {left: {x: 44, y: 240}, right: {x: 216, y: 240}, length: 90},
    legs: {left: {x: 102, y: 404}, right: {x: 158, y: 404}, length: 58},
    head: {x: 130, y: 32, width: 150},
    neck: {x: 130, y: 330},
  },
  mug: {
    viewBox: {width: 440, height: 440},
    color: '#F8FAFC',
    size: 320,
    body: 'M60,80 L340,80 L322,360 C320,390 300,404 270,404 L130,404 C100,404 80,390 78,360 Z',
    behind: [{d: 'M326,140 C410,130 420,250 318,282 L320,250 C380,236 378,170 330,172 Z', fill: 'body', stroke: 6}],
    front: [{d: ellipsePath(200, 82, 140, 22), fill: '#6F4E37', stroke: 6}],
    face: {eyes: [{x: 160, y: 206}, {x: 240, y: 206}], eyeR: 38, mouth: {x: 200, y: 290}, mouthScale: 0.9, cheeks: true},
    arms: {left: {x: 70, y: 220}, right: {x: 330, y: 300}, length: 96},
    legs: {left: {x: 150, y: 400}, right: {x: 250, y: 400}, length: 52},
    head: {x: 200, y: 66, width: 270},
    neck: {x: 200, y: 360},
  },
  apple: {
    viewBox: {width: 400, height: 420},
    color: '#EF4444',
    size: 300,
    body: 'M200,110 C230,80 300,70 340,120 C380,170 370,280 320,350 C290,392 250,400 230,384 C215,374 185,374 170,384 C150,400 110,392 80,350 C30,280 20,170 60,120 C100,70 170,80 200,110 Z',
    front: [
      {d: 'M196,112 C194,80 200,56 214,36 L226,42 C214,60 210,82 212,112 Z', fill: '#78350F', stroke: 5},
      {d: 'M214,66 C240,30 290,34 308,50 C286,76 244,84 214,66 Z', fill: '#22C55E', stroke: 5},
    ],
    face: {eyes: [{x: 158, y: 214}, {x: 242, y: 214}], eyeR: 40, mouth: {x: 200, y: 296}, mouthScale: 0.95, cheeks: true},
    arms: {left: {x: 42, y: 232}, right: {x: 358, y: 232}, length: 98},
    legs: {left: {x: 160, y: 386}, right: {x: 240, y: 386}, length: 56},
    head: {x: 200, y: 98, width: 190},
    neck: {x: 200, y: 360},
  },
  sugarCube: {
    viewBox: {width: 400, height: 420},
    color: '#FFFFFF',
    size: 280,
    body: 'M80,60 L320,60 Q350,60 350,90 L350,350 Q350,380 320,380 L80,380 Q50,380 50,350 L50,90 Q50,60 80,60 Z',
    details: [
      {d: 'M50,90 Q50,60 80,60 L320,60 Q350,60 350,90 L330,110 L70,110 Z', fill: '#E2E8F0', opacity: 0.8},
      ...[
        [96, 150],
        [300, 160],
        [110, 320],
        [292, 330],
        [200, 140],
      ].map(([x, y]) => ({d: `M${x - 8},${y} L${x},${y - 8} L${x + 8},${y} L${x},${y + 8} Z`, fill: '#CBD5E1'})),
    ],
    face: {eyes: [{x: 158, y: 210}, {x: 242, y: 210}], eyeR: 40, mouth: {x: 200, y: 292}, mouthScale: 0.95, cheeks: true},
    arms: {left: {x: 52, y: 236}, right: {x: 348, y: 236}, length: 98},
    legs: {left: {x: 156, y: 378}, right: {x: 244, y: 378}, length: 56},
    head: {x: 200, y: 62, width: 260},
    neck: {x: 200, y: 360},
  },
  muscle: {
    viewBox: {width: 440, height: 360},
    color: '#E5484D',
    size: 340,
    body: 'M70,190 C60,104 150,56 236,60 C326,64 386,118 384,196 C382,266 322,302 236,304 C150,306 80,270 70,190 Z',
    behind: [tube('M84,190 L14,206', 30, '#F8FAFC'), tube('M370,186 L430,170', 30, '#F8FAFC')],
    details: [line('M120,110 C160,150 160,250 130,280'), line('M330,104 C300,150 300,250 330,284'), line('M236,66 C220,90 222,110 236,124', 4, 0.25)],
    face: {eyes: [{x: 188, y: 170}, {x: 270, y: 168}], eyeR: 38, mouth: {x: 230, y: 240}, mouthScale: 0.9, cheeks: true},
    arms: {left: {x: 82, y: 214}, right: {x: 380, y: 214}, length: 96},
    legs: {left: {x: 190, y: 302}, right: {x: 270, y: 302}, length: 64},
    head: {x: 236, y: 62, width: 200},
    neck: {x: 230, y: 296},
  },
  eyeball: {
    viewBox: {width: 400, height: 400},
    color: '#FFFFFF',
    size: 290,
    body: circlePath(200, 200, 160),
    behind: [tube('M300,300 C340,350 370,350 400,390', 26, '#F87171')],
    details: [line('M60,170 C90,160 96,190 120,184', 3, 0.5, '#EF4444'), line('M330,240 C310,250 312,270 290,272', 3, 0.5, '#EF4444')],
    face: {eyes: [{x: 158, y: 180}, {x: 242, y: 180}], eyeR: 30, mouth: {x: 200, y: 268}, mouthScale: 0.85, cheeks: true},
    arms: {left: {x: 44, y: 220}, right: {x: 356, y: 220}, length: 100},
    legs: {left: {x: 162, y: 352}, right: {x: 238, y: 352}, length: 64},
    head: {x: 200, y: 42, width: 220},
    neck: {x: 200, y: 340},
  },
};

/** The library entry, or a custom shape with library defaults filled in. */
export const resolveShape = (shape: ShapeName | CustomShape): ShapeDef =>
  typeof shape === 'string' ? SHAPES[shape] : {color: '#F9A8D4', size: 300, ...shape};

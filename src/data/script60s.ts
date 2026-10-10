import type {DialogueEvent, SceneDefinition, SceneId} from '../types/dialogue';

/**
 * "Cosmic Eviction (60s Pilot)" — the shooting script.
 *
 * Frame windows are conformed to the recorded voice track: the spec's windows
 * (F0, F46, F181, …) needed some lines spoken at nearly double speed while
 * others sat silent, so `npm run voiceover -- --apply-layout` lays the lines
 * end to end around the real clip lengths and shares the spare frames out as
 * gaps. Windows are half-open (`[startFrame, startFrame + durationInFrames)`)
 * and tile frames 0–1799 with no gaps, which `assertScriptIntegrity` checks.
 * Scene beats are keyed to spoken words (see `cue()`), not to these numbers.
 */
export const FPS = 30;
export const TOTAL_FRAMES = 1800;

export const SCENES: readonly SceneDefinition[] = [
  {id: 1, title: 'The Eviction Notice', startFrame: 0, durationInFrames: 347},
  {id: 2, title: 'The 10% Heat Limit', startFrame: 347, durationInFrames: 446},
  {id: 3, title: 'The Core Elevator', startFrame: 793, durationInFrames: 494},
  {id: 4, title: 'The Magnetic Shield Reveal', startFrame: 1287, durationInFrames: 513},
];

export const SCRIPT_60S: readonly DialogueEvent[] = [
  // ── Scene 1: The Eviction Notice ────────────────────────────────────────
  {
    id: 's1-nobody-home',
    scene: 1,
    speaker: 'ROCKET',
    text: "Nobody's home.",
    startFrame: 0,
    durationInFrames: 33,
    delivery: 'normal',
    pose: {character: 'ROCKET', expression: 'confused', mouth: 'open', action: 'peek'},
    visual: 'Rocket peeks out from behind Earth, one confused eye, mouth slightly open.',
  },
  {
    id: 's1-sun-landlord',
    scene: 1,
    speaker: 'HOST',
    text: "That's the Sun. It owns the whole street, and it wants you out.",
    startFrame: 33,
    durationInFrames: 95,
    delivery: 'normal',
    emphasis: ['Sun', 'street', 'out'],
    pose: {character: 'SUN', expression: 'grumpy', mouth: 'frown', action: 'hammer-notice'},
    visual: 'Sun in sunglasses with a key ring glares while hammering an eviction notice onto Earth\'s door.',
  },
  {
    id: 's1-evicted',
    scene: 1,
    speaker: 'LIL_SAT',
    text: "Evicted?! Where do we go? Where's the safest place in the whole universe?",
    startFrame: 128,
    durationInFrames: 113,
    delivery: 'shout',
    emphasis: ['Evicted', 'safest'],
    pose: {character: 'LIL_SAT', expression: 'scared', action: 'tremble'},
    visual: 'Lil Sat\'s solar panels tremble, eyes wide and shaking.',
  },
  {
    id: 's1-relax-sat',
    scene: 1,
    speaker: 'ROCKET',
    text: 'Relax, Sat! I can take you anywhere! Everybody moved by lunch!',
    startFrame: 241,
    durationInFrames: 106,
    delivery: 'shout',
    emphasis: ['anywhere', 'lunch'],
    pose: {character: 'ROCKET', expression: 'confident', mouth: 'smile', action: 'chest-puff'},
    visual: 'Rocket puffs out its chest with a flame booster burst, smiling.',
  },

  // ── Scene 2: The 10% Heat Limit ─────────────────────────────────────────
  {
    id: 's2-ten-percent',
    scene: 2,
    speaker: 'HOST',
    text: "Wait, the Sun won't swallow us for five billion years. But every billion years, it shines ten percent brighter.",
    startFrame: 347,
    durationInFrames: 171,
    delivery: 'normal',
    emphasis: ['five', 'billion', 'ten', 'percent', 'brighter'],
    pose: {character: 'SUN', expression: 'grumpy', action: 'heat-dial'},
    visual: 'Heat dial rotates on the Sun; a "+10% EVERY BILLION YRS" badge pops in.',
  },
  {
    id: 's2-just-a-tan',
    scene: 2,
    speaker: 'ROCKET',
    text: "Ten percent? That's just a tan!",
    startFrame: 518,
    durationInFrames: 51,
    delivery: 'normal',
    emphasis: ['tan'],
    pose: {character: 'ROCKET', expression: 'smug', mouth: 'smug', action: 'sunglasses'},
    visual: 'Rocket in sunglasses with a smug grin.',
  },
  {
    id: 's2-oceans-dry',
    scene: 2,
    speaker: 'HOST',
    text: "That's plenty. In roughly one billion years, extra sunlight boils the oceans dry. That's the real move-out date.",
    startFrame: 569,
    durationInFrames: 182,
    delivery: 'normal',
    emphasis: ['one', 'billion', 'boils', 'oceans', 'dry', 'move-out'],
    pose: {character: 'EARTH', expression: 'scared', action: 'oceans-boil'},
    visual: 'Oceans sizzle with steam bubbles; a red "OCEANS DRIED" stamp slams onto Earth.',
  },
  {
    id: 's2-where-hide',
    scene: 2,
    speaker: 'LIL_SAT',
    text: 'So where do we hide?!',
    startFrame: 751,
    durationInFrames: 42,
    delivery: 'shout',
    emphasis: ['hide'],
    pose: {character: 'LIL_SAT', expression: 'crying', mouth: 'screaming', action: 'spin'},
    visual: 'Lil Sat spins with tears streaming.',
  },

  // ── Scene 3: The Core Elevator ──────────────────────────────────────────
  {
    id: 's3-basement',
    scene: 3,
    speaker: 'ROCKET',
    text: "Easy! When it's too hot upstairs, you go to the basement! Hop in!",
    startFrame: 793,
    durationInFrames: 95,
    delivery: 'shout',
    emphasis: ['upstairs', 'basement'],
    pose: {character: 'ROCKET', expression: 'confident', mouth: 'smile', action: 'pull-crate'},
    visual: 'Rocket opens a cellar door on Earth and pulls a moving crate into an elevator shaft.',
  },
  {
    id: 's3-descent',
    scene: 3,
    speaker: 'HOST',
    text: 'Down through the crust, past the mantle. Eighteen hundred miles down, solid rock melts into churning liquid iron.',
    startFrame: 888,
    durationInFrames: 178,
    delivery: 'normal',
    emphasis: ['crust', 'mantle', 'eighteen', 'hundred', 'liquid', 'iron'],
    pose: {character: 'ROCKET', expression: 'awe', action: 'ride-elevator'},
    visual: 'Elevator drops past rock layers while a depth odometer ticks 0 MI → 1,800 MI.',
  },
  {
    id: 's3-iron-ball',
    scene: 3,
    speaker: 'HOST',
    text: 'And dead center sits a solid iron ball the size of Pluto, burning at ten thousand degrees!',
    startFrame: 1066,
    durationInFrames: 151,
    delivery: 'normal',
    emphasis: ['iron', 'ball', 'Pluto', 'ten', 'thousand'],
    pose: {character: 'ROCKET', expression: 'awe', action: 'ride-elevator'},
    visual: 'A glowing metallic sphere sits in the core; a thermometer reads 10,000°F.',
  },
  {
    id: 's3-another-sun',
    scene: 3,
    speaker: 'ROCKET',
    text: 'We ran from the Sun, and found another Sun?!',
    startFrame: 1217,
    durationInFrames: 70,
    delivery: 'shout',
    emphasis: ['another', 'Sun'],
    pose: {character: 'ROCKET', expression: 'panic', mouth: 'screaming', action: 'eye-bulge'},
    visual: 'Rocket\'s eyeball bulges; sweat and panic lines fly.',
  },

  // ── Scene 4: The Magnetic Shield Reveal ────────────────────────────────
  {
    id: 's4-hold-together',
    scene: 4,
    speaker: 'GRAVITY',
    text: 'Somebody has to hold it together.',
    startFrame: 1287,
    durationInFrames: 68,
    delivery: 'calm',
    emphasis: ['together'],
    pose: {character: 'GRAVITY', expression: 'calm', action: 'hold-cables'},
    visual: 'Purple Gravity blob holds the elevator cables with stretchy rubber arms.',
  },
  {
    id: 's4-giant-magnet',
    scene: 4,
    speaker: 'HOST',
    text: 'That churning iron core turns Earth into a giant magnet, deflecting the deadly solar wind right around us.',
    startFrame: 1355,
    durationInFrames: 168,
    delivery: 'normal',
    emphasis: ['giant', 'magnet', 'solar', 'wind'],
    pose: {character: 'EARTH', expression: 'happy', action: 'magnetosphere'},
    visual: 'Neon green magnetic field arcs bend the yellow solar wind around Earth.',
  },
  {
    id: 's4-green-lights',
    scene: 4,
    speaker: 'LIL_SAT',
    text: 'The green lights! Our shield is already on!',
    startFrame: 1523,
    durationInFrames: 68,
    delivery: 'shout',
    emphasis: ['green', 'lights', 'shield'],
    pose: {character: 'LIL_SAT', expression: 'awe', mouth: 'smile', action: 'clap'},
    visual: 'Lil Sat claps its solar wings inside a glowing aura.',
  },
  {
    id: 's4-staying-home',
    scene: 4,
    speaker: 'ROCKET',
    text: "The zero-bedroom magnet! Pack the bags, we're staying home!",
    startFrame: 1591,
    durationInFrames: 99,
    delivery: 'shout',
    emphasis: ['zero-bedroom', 'magnet', 'home'],
    pose: {character: 'ROCKET', expression: 'happy', mouth: 'smile', action: 'slam-crate'},
    visual: 'Rocket slams the crate shut, smiling.',
  },
  {
    id: 's4-home-sweet-home',
    scene: 4,
    speaker: 'HOST',
    text: 'The safest place in the universe... is where you already are.',
    startFrame: 1690,
    durationInFrames: 110,
    delivery: 'calm',
    emphasis: ['safest', 'already'],
    pose: {character: 'EARTH', expression: 'happy', action: 'splash-card'},
    visual: 'Comic splash card: "HOME SWEET HOME" on a sunburst, subscribe pill pops.',
  },
];

export const getLine = (id: string): DialogueEvent => {
  const line = SCRIPT_60S.find((l) => l.id === id);
  if (!line) {
    throw new Error(`Unknown dialogue line "${id}"`);
  }
  return line;
};

/** The line playing at an absolute composition frame, if any. */
export const getActiveLine = (frame: number): DialogueEvent | null =>
  SCRIPT_60S.find((l) => frame >= l.startFrame && frame < l.startFrame + l.durationInFrames) ??
  null;

export const getScene = (id: SceneId): SceneDefinition => {
  const scene = SCENES.find((s) => s.id === id);
  if (!scene) {
    throw new Error(`Unknown scene ${id}`);
  }
  return scene;
};

export interface LocalWindow {
  /** First frame of the line, relative to its scene's start. */
  from: number;
  /** First frame after the line, relative to its scene's start. */
  to: number;
  duration: number;
}

/** A line's window in scene-local frames (what `useCurrentFrame()` returns inside the scene). */
export const lineWindow = (id: string): LocalWindow => {
  const line = getLine(id);
  const scene = getScene(line.scene);
  const from = line.startFrame - scene.startFrame;
  return {from, to: from + line.durationInFrames, duration: line.durationInFrames};
};

/**
 * Throws if scenes or lines leave a gap, overlap, or fall outside the
 * composition. Called once at module load so a bad edit fails fast in the Studio.
 */
export const assertScriptIntegrity = (): void => {
  let cursor = 0;
  for (const scene of SCENES) {
    if (scene.startFrame !== cursor) {
      throw new Error(`Scene ${scene.id} starts at ${scene.startFrame}, expected ${cursor}`);
    }
    cursor += scene.durationInFrames;
  }
  if (cursor !== TOTAL_FRAMES) {
    throw new Error(`Scenes cover ${cursor} frames, expected ${TOTAL_FRAMES}`);
  }

  cursor = 0;
  for (const line of SCRIPT_60S) {
    if (line.startFrame !== cursor) {
      throw new Error(`Line ${line.id} starts at ${line.startFrame}, expected ${cursor}`);
    }
    const scene = getScene(line.scene);
    const end = line.startFrame + line.durationInFrames;
    if (line.startFrame < scene.startFrame || end > scene.startFrame + scene.durationInFrames) {
      throw new Error(`Line ${line.id} spills outside scene ${scene.id}`);
    }
    cursor = end;
  }
  if (cursor !== TOTAL_FRAMES) {
    throw new Error(`Lines cover ${cursor} frames, expected ${TOTAL_FRAMES}`);
  }
};

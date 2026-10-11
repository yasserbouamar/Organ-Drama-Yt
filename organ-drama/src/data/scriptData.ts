import type {SFXTrigger} from '../types/audio';
import type {DialogueLine, SceneDefinition, SceneId, SpeakerId} from '../types/dialogue';

/**
 * "Organ Drama: Midnight Pizza" — the shooting script.
 *
 * Every frame number is copied from the script and is inclusive at both ends
 * ("F76 - F180" → 76..180). Scene beats in `src/scenes/` are keyed to these
 * numbers. The subscribe outro (F1651–F1800) was cut: the video now ends on
 * the 3-hour rule, with a short hold after the last line.
 */
export const FPS = 30;
export const TOTAL_FRAMES = 1680;
export const LAST_FRAME = TOTAL_FRAMES - 1;

export const SCENES: readonly SceneDefinition[] = [
  {id: 1, title: 'Midnight Pizza Heist', startFrame: 0, endFrame: 330, environment: 'bedroom'},
  {id: 2, title: 'The Valve Closes', startFrame: 331, endFrame: 690, environment: 'gut'},
  {id: 3, title: 'The 20-Minute Delay', startFrame: 691, endFrame: 1110, environment: 'gut'},
  {id: 4, title: 'The Heartburn Catastrophe', startFrame: 1111, endFrame: 1500, environment: 'gut'},
  {id: 5, title: 'The 3-Hour Golden Rule', startFrame: 1501, endFrame: LAST_FRAME, environment: 'bedroom'},
];

export const DIALOGUE: readonly DialogueLine[] = [
  // ── Scene 1: Midnight Pizza Heist ───────────────────────────────────────
  {
    id: 's1-narrator-midnight',
    scene: 1,
    speakers: ['NARRATOR'],
    text: "It's midnight. The whole body is fast asleep. Well... almost.",
    startFrame: 0,
    endFrame: 75,
    delivery: 'whisper',
    emphasis: ['midnight', 'almost'],
    direction: 'Slow push across the dark bedroom to the bed. The clock reads 12:00; the blanket twitches.',
  },
  {
    id: 's1-brain-pizza',
    scene: 1,
    speakers: ['BRAIN'],
    text: 'A whole pizza?! Nobody tells the stomach!',
    startFrame: 76,
    endFrame: 180,
    delivery: 'shout',
    emphasis: ['pizza', 'Nobody'],
    direction: 'Brain peeks out from under the blanket, eyes darting, and opens a steaming, glowing pizza box.',
  },

  // ── Scene 2: The Valve Closes & Slice #1 Drops ─────────────────────────
  {
    id: 's2-stomach-closed',
    scene: 2,
    speakers: ['STOMACH'],
    text: 'Kitchen is closed! Valve is locked. Good night.',
    startFrame: 331,
    endFrame: 430,
    delivery: 'drowsy',
    emphasis: ['closed', 'locked'],
    direction: 'Inside the gut. Stomach yawns in its nightcap and snaps a padlock onto the valve.',
  },
  {
    id: 's2-narrator-sphincter',
    scene: 2,
    speakers: ['NARRATOR'],
    text: "That's the lower esophageal sphincter. It lets food in and keeps the acid down.",
    startFrame: 431,
    endFrame: 520,
    delivery: 'normal',
    emphasis: ['sphincter', 'food', 'acid'],
    sayAs: "That's the lower esophageal sphincter. It lets food in, and keeps the acid down.",
    direction: 'Push in on the valve: a label pops up, food arrow in, acid arrow blocked. Something knocks from above.',
  },
  {
    id: 's2-pizza-hi',
    scene: 2,
    speakers: ['PIZZA'],
    text: 'Hi!',
    startFrame: 521,
    endFrame: 560,
    delivery: 'normal',
    direction: 'A pizza slice in sunglasses splashes into the stomach and waves, with a "1" bubble.',
  },
  {
    id: 's2-stomach-promised',
    scene: 2,
    speakers: ['STOMACH'],
    text: 'A slice at midnight?! Brain, you promised!',
    startFrame: 561,
    endFrame: 690,
    delivery: 'shout',
    emphasis: ['midnight', 'promised'],
    direction: 'Stomach jolts awake, nightcap flying, and shakes a fist up the esophagus.',
  },

  // ── Scene 3: The 20-Minute Delay & Taxi Run ────────────────────────────
  {
    id: 's3-brain-one-more',
    scene: 3,
    speakers: ['BRAIN'],
    text: "Just one more! The second you're full, send the signal and I'll stop!",
    startFrame: 691,
    endFrame: 810,
    delivery: 'shout',
    emphasis: ['one', 'more', 'signal'],
    direction: 'Brain shouts down the esophagus from the head while slices 2, 3 and 4 drop in.',
  },
  {
    id: 's3-narrator-catch',
    scene: 3,
    speakers: ['NARRATOR'],
    text: "Here's the catch: your stomach's fullness hormone takes about twenty minutes to reach the brain.",
    startFrame: 811,
    endFrame: 960,
    delivery: 'normal',
    emphasis: ['catch', 'twenty', 'minutes'],
    sayAs: "Here's the catch. Your stomach's fullness hormone takes about twenty minutes to reach the brain.",
    direction: 'Stomach groans and releases the "I\'M FULL" letter. A stopwatch counts 0 → 20 MIN.',
  },
  {
    id: 's3-stomach-sending',
    scene: 3,
    speakers: ['STOMACH'],
    text: 'Sending the letter now! Rush delivery!',
    startFrame: 961,
    endFrame: 1050,
    delivery: 'shout',
    emphasis: ['letter', 'Rush'],
    direction: 'Stomach holds the letter up high and blows a whistle.',
  },
  {
    id: 's3-letter-taxi',
    scene: 3,
    speakers: ['LETTER'],
    text: 'To the brain! Step on it, taxi!',
    startFrame: 1051,
    endFrame: 1110,
    delivery: 'shout',
    emphasis: ['brain', 'taxi'],
    direction: 'A red-blood-cell taxi honks; the letter hops on and they zoom up the blood vessel.',
  },

  // ── Scene 4: The Heartburn Catastrophe ──────────────────────────────────
  {
    id: 's4-brain-lie-down',
    scene: 4,
    speakers: ['BRAIN'],
    text: 'No letter yet? Then keep eating! Now... time to lie down.',
    startFrame: 1111,
    endFrame: 1190,
    delivery: 'normal',
    emphasis: ['letter', 'lie', 'down'],
    direction: 'Brain checks an empty mailbox, mutters "Nobody saw anything" and flops flat: FLOMP!',
  },
  {
    id: 's4-narrator-gravity',
    scene: 4,
    speakers: ['NARRATOR'],
    text: 'Lie down on a full stomach, and gravity can no longer hold the acid down.',
    startFrame: 1191,
    endFrame: 1310,
    delivery: 'normal',
    emphasis: ['full', 'gravity', 'acid'],
    direction: 'The stomach tips 90°. Acid sloshes to the open valve and shoots up the esophagus.',
  },
  {
    id: 's4-heart-heartburn',
    scene: 4,
    speakers: ['HEART'],
    text: 'Heartburn! Why is acid invading my neighborhood?!',
    startFrame: 1311,
    endFrame: 1410,
    delivery: 'shout',
    emphasis: ['Heartburn', 'acid'],
    direction: 'Heart in a top hat waves both hands in panic as sirens flash.',
  },
  {
    id: 's4-stomach-sorry',
    scene: 4,
    speakers: ['STOMACH'],
    text: 'Sorry! The gate leaked!',
    startFrame: 1411,
    endFrame: 1500,
    delivery: 'normal',
    emphasis: ['leaked'],
    direction: 'Stomach, lying on its side, cries next to the broken padlock.',
  },

  // ── Scene 5: The 3-Hour Golden Rule ────────────────────────────────────
  {
    id: 's5-narrator-rule',
    scene: 5,
    speakers: ['NARRATOR'],
    text: 'Wait three hours after a heavy meal before lying down. Give the letter time to arrive!',
    startFrame: 1501,
    endFrame: 1650,
    delivery: 'normal',
    emphasis: ['three', 'hours', 'letter'],
    direction: 'Next morning. The letter holds a stopwatch that ratchets round to 3 HOURS.',
  },
];

export const SFX_CUES: readonly SFXTrigger[] = [
  {id: 'clock_tick', frame: 0, scene: 1, durationInFrames: 60, volume: 0.45, label: 'Digital clock hum'},
  {id: 'whoosh_soft', frame: 80, scene: 1, durationInFrames: 22, volume: 0.6, label: 'Blanket rustle'},
  {id: 'box_creak', frame: 95, scene: 1, durationInFrames: 24, volume: 0.6, label: 'Box lid open creak'},
  {id: 'chime_sparkle', frame: 100, scene: 1, durationInFrames: 54, volume: 0.5, label: 'Magical golden chime'},
  {id: 'lock_click', frame: 390, scene: 2, durationInFrames: 12, volume: 0.85, label: 'Padlock snap'},
  {id: 'heavy_knock', frame: 480, scene: 2, durationInFrames: 30, volume: 0.85, label: 'Heavy door knock'},
  {id: 'liquid_splash', frame: 520, scene: 2, durationInFrames: 26, volume: 0.75, label: 'Liquid splash / squish'},
  {id: 'bubble_pop', frame: 530, scene: 2, durationInFrames: 8, volume: 0.7, label: 'Pop bubble'},
  {id: 'cartoon_gulp', frame: 700, scene: 3, durationInFrames: 14, volume: 0.85, label: 'Cartoon gulp (slice 2)'},
  {id: 'cartoon_gulp', frame: 740, scene: 3, durationInFrames: 14, volume: 0.85, label: 'Cartoon gulp (slice 3)'},
  {id: 'cartoon_gulp', frame: 780, scene: 3, durationInFrames: 14, volume: 0.85, label: 'Cartoon gulp (slice 4)'},
  {id: 'stopwatch_tick', frame: 840, scene: 3, durationInFrames: 80, volume: 0.55, label: 'Clock ticking loop'},
  {id: 'bell_ding', frame: 920, scene: 3, durationInFrames: 45, volume: 0.6, label: 'Bell ding at 20 MIN'},
  {id: 'horn_beep', frame: 1060, scene: 3, durationInFrames: 20, volume: 0.6, label: 'Comic car horn'},
  {id: 'flomp_bounce', frame: 1160, scene: 4, durationInFrames: 26, volume: 1, label: 'Mattress bounce "FLOMP!"'},
  {id: 'liquid_slosh', frame: 1210, scene: 4, durationInFrames: 36, volume: 0.75, label: 'Liquid sloshing'},
  {id: 'acid_sizzle', frame: 1240, scene: 4, durationInFrames: 60, volume: 0.5, label: 'Sizzling acid'},
  {id: 'cartoon_alarm', frame: 1320, scene: 4, durationInFrames: 60, volume: 0.35, label: 'Cartoon siren'},
  {id: 'morning_chime', frame: 1500, scene: 4, durationInFrames: 55, volume: 0.55, label: 'Morning chime on the cut to morning'},
  {id: 'gear_ratchet', frame: 1560, scene: 5, durationInFrames: 20, volume: 0.6, label: 'Ratchet gear turn'},
];

// ── Helpers ───────────────────────────────────────────────────────────────

export const sceneLength = (s: SceneDefinition): number => s.endFrame - s.startFrame + 1;
export const lineLength = (l: {startFrame: number; endFrame: number}): number => l.endFrame - l.startFrame + 1;

export const getScene = (id: SceneId): SceneDefinition => {
  const scene = SCENES.find((s) => s.id === id);
  if (!scene) {
    throw new Error(`Unknown scene ${id}`);
  }
  return scene;
};

/** The line being spoken at an absolute frame, if any. */
export const getActiveLine = (frame: number): DialogueLine | undefined =>
  DIALOGUE.find((l) => frame >= l.startFrame && frame <= l.endFrame);

export const speakerLabel = (speakers: readonly SpeakerId[]): string =>
  speakers.map((s) => SPEAKER_NAMES[s]).join(' & ');

export const SPEAKER_NAMES: Record<SpeakerId, string> = {
  NARRATOR: 'NARRATOR',
  BRAIN: 'BRAIN',
  STOMACH: 'STOMACH',
  LETTER: 'LETTER',
  HEART: 'HEART',
  PIZZA: 'PIZZA SLICE',
};

/**
 * Throws if the script stops adding up: scenes must tile 0..LAST_FRAME,
 * lines must sit inside their scene without overlapping, and cues must land
 * inside the timeline. Called at startup so a bad edit fails loudly.
 */
export const assertScriptIntegrity = (): void => {
  const problems: string[] = [];
  SCENES.forEach((scene, i) => {
    const expected = i === 0 ? 0 : SCENES[i - 1].endFrame + 1;
    if (scene.startFrame !== expected) {
      problems.push(`Scene ${scene.id} starts at ${scene.startFrame}, expected ${expected}`);
    }
  });
  if (SCENES[SCENES.length - 1].endFrame !== LAST_FRAME) {
    problems.push(`The last scene must end on frame ${LAST_FRAME}`);
  }
  DIALOGUE.forEach((line, i) => {
    const scene = getScene(line.scene);
    if (line.endFrame < line.startFrame) {
      problems.push(`${line.id} ends before it starts`);
    }
    if (line.startFrame < scene.startFrame || line.endFrame > scene.endFrame) {
      problems.push(`${line.id} spills outside scene ${scene.id}`);
    }
    const prev = DIALOGUE[i - 1];
    if (prev && line.startFrame <= prev.endFrame) {
      problems.push(`${line.id} overlaps ${prev.id}`);
    }
  });
  SFX_CUES.forEach((cue) => {
    if (cue.frame < 0 || cue.frame + cue.durationInFrames > TOTAL_FRAMES) {
      problems.push(`SFX ${cue.id}@${cue.frame} runs outside the timeline`);
    }
  });
  if (problems.length > 0) {
    throw new Error(`scriptData.ts is inconsistent:\n  ${problems.join('\n  ')}`);
  }
};

import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BGM_FILES, buildDuckCurve, LoopedMusic, VoiceLines} from '../audio/AudioController';
import {NIGHT_LOOP_SECONDS, synthesizeNightLoop} from '../audio/nightMusic';
import {BGM_LOOP_SECONDS, synthesizeBgmLoop} from '../audio/proceduralMusic';
import {SFXPlayer} from '../audio/SFXPlayer';
import {PizzaSliceArt} from '../components/characters/PizzaSlice';
import {Camera} from '../components/fx/Camera';
import {ComicBurst} from '../components/fx/ComicBurst';
import {Zzz} from '../components/fx/Zzz';
import {TitleCard} from '../components/infographics/TitleCard';
import {Callout} from '../components/props/StageProps';
import {SpeechBubble} from '../components/ui/SpeechBubble';
import {cameraAt, type CameraKey, worldToScreen} from '../scenes/shared';
import {PALETTE} from '../theme';
import type {VoiceoverManifest} from '../types/audio';
import type {Expression, MouthShape, Point} from '../types/characters';
import {clamp} from '../utils/animation';
import {createLipSync, type LipSync} from '../utils/lipSync';
import {CastPuppet, type PuppetMetrics, puppetMetrics} from './CastPuppet';
import {armsFor, blendArms} from './gestures';
import {OrganPuppet} from './OrganPuppet';
import {AlarmFX, Dial, FlashFX, FloatFX, ListPanel, Meter, SweatFX} from './overlays';
import {SetBackdrop, setFloor} from './sets';
import {resolveShape} from './shapes';
import {beatAt, buildTimeline, type EpisodeTimeline, type SceneTiming} from './timeline';
import type {Act, CameraShot, Episode, Gesture, Placement, PropSpec, PuppetSpec} from './types';
import {babbleVoice} from './voices';

export interface EpisodeEntry {
  slug: string;
  episode: Episode;
  voiceover: VoiceoverManifest;
}

/** The mouth a character rests on between words, by mood. */
const REST_MOUTH: Record<Expression, MouthShape> = {
  neutral: 'idle',
  sneaky: 'smile',
  excited: 'grin',
  chewing: 'chew',
  sleeping: 'idle',
  sleepy: 'idle',
  happy: 'smile',
  smug: 'smile',
  worried: 'wobbly',
  shocked: 'o',
  grumpy: 'frown',
  irritated: 'frown',
  crying: 'wobbly',
  cool: 'smile',
};

// ── Acting ────────────────────────────────────────────────────────────────

interface CharacterFrame {
  id: string;
  spec: PuppetSpec;
  metrics: PuppetMetrics;
  /** Feet position in the world. */
  x: number;
  y: number;
  /** 0..1 visibility (pop in/out scale); 0 = not drawn. */
  shown: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  squash: number;
  facing: 1 | -1;
  expression: Expression;
  gesture: Gesture;
  prevGesture: Gesture;
  gestureT: number;
  look: string | undefined;
  holding: PropSpec | null;
  walk: number;
  hatLift: number;
  speaking: boolean;
}

/** World point of a character's eyes. */
const eyesOf = (c: CharacterFrame): Point => ({x: c.x, y: c.y - c.metrics.feet + c.metrics.eyes});
/** World point just above a character's head. */
const headTopOf = (c: CharacterFrame): Point => ({x: c.x, y: c.y - c.metrics.feet + c.metrics.top});

const moveFrames = (dist: number) => Math.round(clamp(dist / 20, 12, 42));

/** Replays a character's acting up to frame `g`. */
const characterAt = (episode: Episode, scene: SceneTiming, p: Placement, order: number, g: number, fps: number, floorY: number, sync: LipSync): CharacterFrame => {
  const spec = episode.cast[p.id].puppet;
  const metrics = puppetMetrics(spec, p.size);
  const enterAt = scene.start + 6 + order * 5;
  let visible = !p.hidden;
  let visAt = p.enter && p.enter !== 'none' && visible ? enterAt : -1e6;
  let enterStyle: NonNullable<Placement['enter']> = p.enter ?? 'none';
  let target = {x: p.x, y: p.y ?? floorY};
  let from = target;
  let moveAt = -1e6;
  let moveLen = 1;
  let facing: 1 | -1 = p.face === 'left' ? -1 : 1;
  let expression: Expression = p.act?.expression ?? 'neutral';
  let gesture: Gesture = p.act?.gesture ?? 'idle';
  let prevGesture: Gesture = gesture;
  let gestureAt = -1e6;
  let look = p.act?.look;
  let motion: {type: NonNullable<Act['motion']>; at: number} | null = p.act?.motion ? {type: p.act.motion, at: enterAt} : null;
  let holding: PropSpec | null = p.act?.holding ?? null;

  const posAt = (t: number) => {
    const k = Easing.inOut(Easing.cubic)(clamp((t - moveAt) / moveLen));
    return {x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k};
  };

  for (const b of scene.beats) {
    if (b.start > g) {
      break;
    }
    const a = b.beat.act?.[p.id];
    if (!a) {
      continue;
    }
    if (a.expression) {
      expression = a.expression;
    }
    if (a.gesture && a.gesture !== gesture) {
      prevGesture = gesture;
      gesture = a.gesture;
      gestureAt = b.start;
    }
    if (a.look) {
      look = a.look === 'auto' ? undefined : a.look;
    }
    if (a.face) {
      facing = a.face === 'left' ? -1 : 1;
    }
    if (a.moveTo) {
      from = posAt(b.start);
      target = {x: a.moveTo.x, y: a.moveTo.y ?? target.y};
      moveAt = b.start;
      moveLen = moveFrames(Math.hypot(target.x - from.x, target.y - from.y));
      if (Math.abs(target.x - from.x) > 4) {
        facing = target.x > from.x ? 1 : -1;
      }
    }
    if (a.motion) {
      motion = {type: a.motion, at: b.start};
    }
    if (a.holding !== undefined) {
      holding = a.holding;
    }
    if (a.take) {
      holding = scene.scene.props?.find((prop) => prop.id === a.take) ?? holding;
    }
    if (a.visible !== undefined && a.visible !== visible) {
      visible = a.visible;
      visAt = b.start;
      enterStyle = 'pop';
    }
  }

  let {x, y} = posAt(g);
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;
  let squash = 1 + Math.sin(g * 0.09 + order * 1.7) * 0.012;
  let walk = g >= moveAt && g < moveAt + moveLen ? 1 : 0;
  let hatLift = 0;

  // Entrances and exits.
  let shown = 1;
  const since = g - visAt;
  if (!visible) {
    shown = since >= 0 ? 1 - spring({frame: since, fps, config: {damping: 14, stiffness: 220}}) : 0;
    if (since > 14 || visAt < -1e5) {
      shown = 0;
    }
  } else if (since < 60) {
    if (since < 0) {
      shown = 0;
    } else if (enterStyle === 'pop') {
      shown = spring({frame: since, fps, config: {damping: 11, stiffness: 190}});
    } else if (enterStyle === 'walk') {
      const k = Easing.out(Easing.cubic)(clamp(since / 30));
      const edge = x < 960 ? -metrics.width : 1920 + metrics.width;
      x = edge + (x - edge) * k;
      walk = k < 1 ? 1 : walk;
    } else if (enterStyle === 'drop') {
      const k = spring({frame: since, fps, config: {damping: 9, stiffness: 140}});
      offsetY -= (1 - k) * 900;
      if (since > 8 && since < 18) {
        squash *= 1 - 0.18 * Math.sin(((since - 8) / 10) * Math.PI);
      }
    }
  }

  // One-off motions.
  if (motion) {
    const t = g - motion.at;
    switch (motion.type) {
      case 'jump':
        if (t >= 0 && t < 20) {
          offsetY -= Math.sin((t / 20) * Math.PI) * 120;
          hatLift = Math.sin((t / 20) * Math.PI);
        }
        if (t >= 20 && t < 28) {
          squash *= 1 - 0.15 * Math.sin(((t - 20) / 8) * Math.PI);
        }
        break;
      case 'shake':
        if (t >= 0 && t < 18) {
          offsetX += Math.sin(t * 2.3) * 16 * (1 - t / 18);
        }
        break;
      case 'shiver':
        if (t >= 0 && t < 45) {
          offsetX += Math.sin(t * 3.1) * 5;
        }
        break;
      case 'bounce':
        if (t >= 0) {
          squash *= 1 + 0.22 * Math.sin(t * 0.7) * Math.exp(-t / 9);
        }
        break;
      case 'spin':
        if (t >= 0 && t < 24) {
          rotation += 360 * Easing.out(Easing.cubic)(t / 24);
        }
        break;
      case 'faint':
        if (t >= 0) {
          rotation += -facing * 82 * Easing.in(Easing.cubic)(clamp(t / 14));
          offsetY += metrics.width * 0.1 * clamp(t / 14);
        }
        break;
    }
  }

  const speaking = sync.mouthAt(p.id, g, 'idle') !== 'idle';
  if (speaking) {
    offsetY -= Math.abs(Math.sin(g * 0.32)) * 5;
    rotation += Math.sin(g * 0.18) * 1.4;
  }
  if (walk > 0) {
    offsetY -= Math.abs(Math.sin(g * 0.5)) * 10;
  }

  return {
    id: p.id,
    spec,
    metrics,
    x,
    y,
    shown,
    offsetX,
    offsetY,
    rotation,
    squash,
    facing,
    expression,
    gesture,
    prevGesture,
    gestureT: Easing.inOut(Easing.cubic)(clamp((g - gestureAt) / 8)),
    look,
    holding,
    walk,
    hatLift,
    speaking,
  };
};

/** Pupil direction from a look instruction (or automatic: at whoever is talking). */
const lookVector = (me: CharacterFrame, all: CharacterFrame[], speakers: readonly string[]): Point => {
  const at = (other: CharacterFrame): Point => {
    const a = eyesOf(me);
    const b = eyesOf(other);
    return {x: clamp((b.x - a.x) / 260, -1, 1) * 0.85, y: clamp((b.y - a.y) / 400, -1, 1) * 0.4};
  };
  const others = all.filter((c) => c.id !== me.id && c.shown > 0.5);
  if (me.look) {
    const named = all.find((c) => c.id === me.look);
    if (named) {
      return at(named);
    }
    return {camera: {x: 0, y: 0}, up: {x: 0.1, y: -1}, down: {x: 0, y: 0.8}, left: {x: -1, y: 0}, right: {x: 1, y: 0}}[me.look] ?? {x: 0, y: 0};
  }
  const talker = others.find((c) => speakers.includes(c.id));
  if (talker) {
    return at(talker);
  }
  if (others.length === 0) {
    return {x: 0, y: 0};
  }
  const nearest = [...others].sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x))[0];
  return at(nearest);
};

// ── Camera ────────────────────────────────────────────────────────────────

const WIDE = {x: 960, y: 540, zoom: 1};

type Shot = {x: number; y: number; zoom: number};

/** Frames everyone on screen, hats included, as tight as the set allows. */
const groupShot = (all: CharacterFrame[]): Shot => {
  const vis = all.filter((c) => c.shown > 0.5);
  if (vis.length === 0) {
    return WIDE;
  }
  const left = Math.min(...vis.map((c) => c.x - c.metrics.width / 2));
  const right = Math.max(...vis.map((c) => c.x + c.metrics.width / 2));
  const top = Math.min(...vis.map((c) => c.y - c.metrics.feet + c.metrics.top)) - 130;
  const bottom = Math.max(...vis.map((c) => c.y)) + 50;
  const zoom = clamp(Math.min(1920 / (right - left + 420), 1080 / (bottom - top + 120)), 1, 1.7);
  return {x: (left + right) / 2, y: (top + bottom) / 2 - 10, zoom};
};

const shotFor = (shot: CameraShot, speaker: CharacterFrame | undefined, all: CharacterFrame[]): Shot => {
  if (typeof shot === 'object') {
    return shot;
  }
  const group = groupShot(all);
  if (shot === 'wide') {
    return WIDE;
  }
  if (shot === 'group') {
    return group;
  }
  if (!speaker) {
    return group;
  }
  const eyes = eyesOf(speaker);
  switch (shot) {
    case 'close':
      return {x: speaker.x, y: eyes.y + speaker.metrics.height * 0.12, zoom: Math.max(1.6, group.zoom * 1.35)};
    case 'push': {
      const x = group.x + (speaker.x - group.x) * 0.3;
      // Lean in, but never crop anyone who is on screen.
      const reach = Math.max(...all.filter((c) => c.shown > 0.5).map((c) => Math.abs(c.x - x) + c.metrics.width / 2 + 40));
      return {x, y: group.y + (eyes.y - group.y) * 0.2, zoom: clamp(Math.min(group.zoom * 1.12, 960 / reach), 1, 1.9)};
    }
    case 'two-shot': {
      const other = all.filter((c) => c.id !== speaker.id && c.shown > 0.5).sort((a, b) => Math.abs(a.x - speaker.x) - Math.abs(b.x - speaker.x))[0];
      return other ? groupShot([speaker, other]) : groupShot([speaker]);
    }
  }
};

// ── Scene ─────────────────────────────────────────────────────────────────

const SceneView: React.FC<{episode: Episode; scene: SceneTiming; sync: LipSync}> = ({episode, scene, sync}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const g = frame + scene.start;
  const {floorY, shadow} = setFloor(scene.scene.set);
  const cast = scene.scene.cast;
  const now = beatAt(scene, g);
  const speakers = now?.line && g <= now.line.endFrame ? now.line.speakers : [];
  const chars = cast.map((p, i) => characterAt(episode, scene, p, i, g, fps, floorY, sync));
  const byId = (id: string) => chars.find((c) => c.id === id);

  const keys = useMemo<CameraKey[]>(() => {
    const opening = cast.map((p, i) => characterAt(episode, scene, p, i, scene.start + 60, fps, floorY, sync));
    const out: CameraKey[] = [{at: scene.start, ...(scene.scene.camera === 'static' ? WIDE : groupShot(opening.map((c) => ({...c, shown: cast.find((p) => p.id === c.id)?.hidden ? 0 : 1}))))}];
    for (const b of scene.beats) {
      const explicit = b.beat.camera;
      const follow = scene.scene.camera !== 'static';
      const who = b.line?.speakers.find((s) => s !== 'NARRATOR');
      if (!explicit && !follow) {
        continue;
      }
      const at = b.start;
      // Frame where they'll stand once this beat's entrances and moves settle.
      const settled = Math.min(b.end, at + 45);
      const all = cast.map((p, i) => characterAt(episode, scene, p, i, settled, fps, floorY, sync));
      const speaker = who ? all.find((c) => c.id === who) : undefined;
      const shot: CameraShot = explicit ?? (who && all.filter((c) => c.shown > 0.5).length > 1 ? 'push' : 'group');
      out.push({at: Math.max(scene.start, at - 3), duration: 20, ...shotFor(shot, speaker, all)});
    }
    return out;
  }, [episode, scene, cast, fps, floorY, sync]);
  const cam = cameraAt(g, fps, keys);
  const takenProps = new Set(scene.beats.filter((b) => b.start <= g).flatMap((b) => Object.values(b.beat.act ?? {}).flatMap((a) => (a.take ? [a.take] : []))));
  // Screen spot with the most room for a dial or meter: the one farthest from anyone's body.
  const spans = chars
    .filter((c) => c.shown > 0.5)
    .map((c) => [worldToScreen(cam, {x: c.x - c.metrics.width / 2, y: 0}).x, worldToScreen(cam, {x: c.x + c.metrics.width / 2, y: 0}).x]);
  const clearance = (x: number) => Math.min(9999, ...spans.map(([l, r]) => (x < l ? l - x : x > r ? x - r : -Math.min(x - l, r - x))));
  const freeSpot = (): {x: number; scale: number} => {
    const best = [300, 960, 1620].map((x) => ({x, room: clearance(x)})).sort((a, b) => b.room - a.room)[0];
    return {x: best.x, scale: clamp((best.room + 60) / 260, 0.7, 1)};
  };

  // Camera shake from `shake` effects.
  let shake = 0;
  for (const b of scene.beats) {
    if ((b.beat.effects ?? []).some((e) => e.type === 'shake') && g >= b.start && g < b.start + 18) {
      const t = g - b.start;
      shake = Math.sin(t * 2.1) * 18 * (1 - t / 18);
    }
  }

  const beatLocal = (b: {start: number}) => b.start - scene.start;
  const beatLen = (b: {start: number; end: number}) => b.end - b.start + 1;
  const sideOf = (x: number) => (x < 960 ? 1 : -1);

  return (
    <AbsoluteFill style={{background: PALETTE.midnight}}>
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom} offset={{x: shake, y: shake * 0.4}}>
        <SetBackdrop set={scene.scene.set} />
        {(scene.scene.props ?? []).map((prop, i) =>
          prop.id && takenProps.has(prop.id) ? null : <PropView key={i} prop={prop} floorY={floorY} />,
        )}
        {shadow
          ? chars
              .filter((c) => c.shown > 0.01)
              .map((c) => (
                <div
                  key={`shadow-${c.id}`}
                  style={{
                    position: 'absolute',
                    left: c.x + c.offsetX - c.metrics.width * 0.36,
                    top: c.y - 14,
                    width: c.metrics.width * 0.72,
                    height: 28,
                    borderRadius: '50%',
                    background: '#000',
                    opacity: 0.18 * c.shown * clamp(1 + c.offsetY / 300),
                  }}
                />
              ))
          : null}
        {[...chars]
          .filter((c) => c.shown > 0.01)
          .sort((a, b) => a.y - b.y)
          .map((c) => (
            <CharacterView key={c.id} c={c} all={chars} speakers={speakers} g={g} sync={sync} />
          ))}
        {/* World-space pop-ups. */}
        {scene.beats.map((b) => {
          const items: React.ReactNode[] = [];
          const len = beatLen(b);
          if (b.beat.bubble) {
            const c = byId(b.beat.bubble.from);
            if (c) {
              const top = headTopOf(c);
              const s = sideOf(c.x);
              items.push(
                <SpeechBubble
                  key="bubble"
                  x={clamp(c.x + s * (c.metrics.width * 0.5 + 200), 260, 1660)}
                  y={clamp(top.y - 90, 140, 900)}
                  tailX={c.x + s * c.metrics.width * 0.2}
                  tailY={top.y + c.metrics.height * 0.12}
                  text={b.beat.bubble.text}
                  variant={b.beat.bubble.variant ?? 'speech'}
                  badge={b.beat.bubble.badge}
                  start={0}
                  duration={Math.max(30, len)}
                  fontSize={b.beat.bubble.text.length > 14 ? 46 : 62}
                />,
              );
            }
          }
          if (b.beat.burst) {
            const at = b.beat.burst.at;
            const c = typeof at === 'string' ? byId(at) : undefined;
            const pt = typeof at === 'object' ? at : c ? {x: c.x + sideOf(c.x) * c.metrics.width * 0.85, y: headTopOf(c).y + 20} : {x: 960, y: 360};
            items.push(
              <ComicBurst
                key="burst"
                text={b.beat.burst.text}
                x={pt.x}
                y={pt.y}
                start={0}
                duration={Math.min(40, Math.max(24, len))}
                size={b.beat.burst.size ?? 170}
                fill={b.beat.burst.color}
                rotation={-8}
                fontSize={b.beat.burst.text.length > 7 ? 48 : 62}
              />,
            );
          }
          if (b.beat.callout) {
            const t = b.beat.callout.target;
            const c = typeof t === 'string' ? byId(t) : undefined;
            const tip = typeof t === 'object' ? t : c ? {x: c.x, y: c.y - c.metrics.feet + c.metrics.height * 0.45} : {x: 960, y: 540};
            const s = sideOf(tip.x);
            items.push(
              <Callout
                key="callout"
                x={clamp(tip.x + s * 420, 300, 1620)}
                y={clamp(tip.y - 260, 130, 880)}
                toX={tip.x + s * (c ? c.metrics.width * 0.3 : 0)}
                toY={tip.y}
                label={b.beat.callout.label}
                sub={b.beat.callout.sub}
                start={0}
                color={b.beat.callout.color}
              />,
            );
          }
          for (const e of b.beat.effects ?? []) {
            const c = e.on ? byId(e.on) : undefined;
            if (!c) {
              continue;
            }
            const top = headTopOf(c);
            if (e.type === 'zzz') {
              items.push(<Zzz key="zzz" x={c.x + c.metrics.width * 0.3} y={top.y + 40} start={0} end={len} />);
            } else if (e.type === 'sweat') {
              items.push(<EffectWindow key="sweat" len={len} render={(l) => <SweatFX x={c.x + c.metrics.width * 0.28} y={top.y + 30} local={l} />} />);
            } else if (e.type === 'hearts' || e.type === 'sparkle' || e.type === 'steam') {
              const type = e.type;
              items.push(<EffectWindow key={type} len={len} render={(l) => <FloatFX x={c.x} y={top.y + 20} local={l} kind={type} />} />);
            }
          }
          return items.length ? (
            <Sequence key={`w${b.index}`} from={beatLocal(b)} durationInFrames={Math.max(30, len + 6)} layout="none" name={`Beat ${b.index + 1} pop-ups`}>
              {items}
            </Sequence>
          ) : null;
        })}
      </Camera>

      {/* Screen-space pop-ups. */}
      {scene.beats.map((b) => {
        const items: React.ReactNode[] = [];
        const len = beatLen(b);
        const spot = freeSpot();
        const away = spot.x;
        if (b.beat.card) {
          items.push(<TitleCard key="card" text={b.beat.card.text} sub={b.beat.card.sub} durationInFrames={len + 6} x={960} y={150} color={b.beat.card.color} rotation={-3} />);
        }
        if (b.beat.dial) {
          items.push(
            <EffectWindow key="dial" len={len + 6} render={(l) => <Dial {...b.beat.dial!} local={l} duration={len + 6} x={away} y={480} scale={spot.scale} />} />,
          );
        }
        if (b.beat.meter) {
          const x = b.beat.meter.side === 'left' ? 240 : b.beat.meter.side === 'right' ? 1680 : away > 960 ? 1680 : 240;
          items.push(<EffectWindow key="meter" len={len + 6} render={(l) => <Meter {...b.beat.meter!} local={l} duration={len + 6} x={x} y={540} />} />);
        }
        if (b.beat.list) {
          items.push(<EffectWindow key="list" len={len + 10} render={(l) => <ListPanel {...b.beat.list!} local={l} duration={len + 10} />} />);
        }
        for (const e of b.beat.effects ?? []) {
          if (e.type === 'flash') {
            items.push(<EffectWindow key="flash" len={12} render={(l) => <FlashFX local={l} />} />);
          } else if (e.type === 'alarm') {
            items.push(<EffectWindow key="alarm" len={len} render={(l) => <AlarmFX local={l} />} />);
          }
        }
        return items.length ? (
          <Sequence key={`s${b.index}`} from={beatLocal(b)} durationInFrames={Math.max(12, len + 10)} layout="none" name={`Beat ${b.index + 1} graphics`}>
            {items}
          </Sequence>
        ) : null;
      })}
    </AbsoluteFill>
  );
};

/** Renders `render(localFrame)` for `len` frames of the parent sequence. */
const EffectWindow: React.FC<{len: number; render: (local: number) => React.ReactNode}> = ({len, render}) => {
  const frame = useCurrentFrame();
  return frame < len ? <>{render(frame)}</> : null;
};

const PropView: React.FC<{prop: PropSpec; floorY: number}> = ({prop, floorY}) => {
  const m = puppetMetrics(prop.puppet);
  return (
    <div style={{position: 'absolute', left: (prop.x ?? 960) - m.width / 2, top: (prop.y ?? floorY) - m.feet, transform: `rotate(${prop.rotation ?? 0}deg)`}}>
      <CastPuppet spec={prop.puppet} expression="happy" mouth="smile" look={{x: 0, y: 0}} arms={armsFor('idle', 1, 0)} walk={0} hatLift={0} seed="prop" />
    </div>
  );
};

/** A small prop drawn inside a holder's hand (in the holder's SVG units). */
const HeldProp: React.FC<{prop: PropSpec; unitsPerPx: number}> = ({prop, unitsPerPx}) => {
  const spec = prop.puppet;
  if (spec.kind === 'pizza') {
    return (
      <g transform={`scale(${0.5 * unitsPerPx}) translate(-120 -230)`}>
        <PizzaSliceArt face={false} />
      </g>
    );
  }
  if (spec.kind !== 'organ') {
    return null;
  }
  const shape = resolveShape(spec.shape);
  const px = Math.min(spec.size ?? shape.size * 0.42, 150);
  const w = px * unitsPerPx;
  const h = (w * shape.viewBox.height) / shape.viewBox.width;
  return (
    <OrganPuppet
      shape={shape}
      size={w}
      color={spec.color}
      accessories={spec.accessories}
      face={spec.face !== false}
      expression="happy"
      mouth="smile"
      blink={0}
      asSvg={{x: -w / 2, y: -h * 0.8}}
      seed="held"
    />
  );
};

const unitsPerPx = (spec: PuppetSpec, width: number): number => {
  const vw = spec.kind === 'organ' ? resolveShape(spec.shape).viewBox.width : {brain: 400, stomach: 560, heart: 380, letter: 300, pizza: 240}[spec.kind];
  return vw / width;
};

const CharacterView: React.FC<{c: CharacterFrame; all: CharacterFrame[]; speakers: readonly string[]; g: number; sync: LipSync}> = ({c, all, speakers, g, sync}) => {
  const arms = blendArms(armsFor(c.prevGesture, c.facing, g), armsFor(c.gesture, c.facing, g), c.gestureT);
  const look = lookVector(c, all, speakers);
  const mouth = sync.mouthAt(c.id, g, REST_MOUTH[c.expression]);
  const held = c.holding ? <HeldProp prop={c.holding} unitsPerPx={unitsPerPx(c.spec, c.metrics.width)} /> : undefined;
  const sx = c.shown / Math.sqrt(c.squash);
  const sy = c.shown * Math.sqrt(c.squash);
  return (
    <div
      style={{
        position: 'absolute',
        left: c.x + c.offsetX - c.metrics.width / 2,
        top: c.y + c.offsetY - c.metrics.feet,
        width: c.metrics.width,
        height: c.metrics.height,
        transformOrigin: `50% ${c.metrics.feet}px`,
        transform: `rotate(${c.rotation}deg) scale(${sx}, ${sy})`,
      }}
    >
      <CastPuppet
        spec={c.spec}
        size={c.metrics.width}
        expression={c.expression}
        mouth={mouth}
        look={look}
        arms={arms}
        holding={held}
        walk={c.walk}
        hatLift={c.hatLift}
        seed={c.id}
      />
    </div>
  );
};

// ── Audio ─────────────────────────────────────────────────────────────────

/** Babble stand-in per speaker, until lines are voiced. */
const babbleFor = (episode: Episode) => (speaker: string) => babbleVoice(speaker === 'NARRATOR' ? episode.narrator : episode.cast[speaker]?.voice);

const synthPizzicato = (sr: number) => synthesizeBgmLoop(sr, false);
const synthNight = (sr: number) => synthesizeNightLoop(sr, false);

const EpisodeAudio: React.FC<{episode: Episode; timeline: EpisodeTimeline; sync: LipSync}> = ({episode, timeline, sync}) => {
  const mv = episode.musicVolume ?? 1;
  const curve = useMemo(
    () =>
      buildDuckCurve({
        dialogue: timeline.lines,
        lineFrames: (line) => sync.getLineTrack(line).durationInFrames,
        totalFrames: timeline.total,
        levels: {dialogue: 0.14 * mv, transition: 0.3 * mv},
      }),
    [timeline, sync, mv],
  );
  const babble = useMemo(() => babbleFor(episode), [episode]);
  const volumeAt = (f: number) => curve[Math.max(0, Math.min(timeline.total - 1, Math.round(f)))];
  const music = episode.music ?? 'pizzicato';
  return (
    <>
      <VoiceLines dialogue={timeline.lines} sync={sync} totalFrames={timeline.total} babbleFor={babble} />
      {music === 'pizzicato' ? (
        <LoopedMusic files={BGM_FILES} synth={synthPizzicato} cacheKey="bgm-loop" loopSeconds={BGM_LOOP_SECONDS} totalFrames={timeline.total} volumeAt={volumeAt} />
      ) : music === 'nightbox' ? (
        <LoopedMusic
          files={['audio/remake/bgm.mp3', 'audio/remake/bgm.wav']}
          synth={synthNight}
          cacheKey="remake-night-loop"
          loopSeconds={NIGHT_LOOP_SECONDS}
          totalFrames={timeline.total}
          volumeAt={volumeAt}
        />
      ) : null}
      <SFXPlayer cues={timeline.sfx} />
    </>
  );
};

// ── Episode ───────────────────────────────────────────────────────────────

/** Renders one episode: its scenes on hard cuts, plus voice, ducked music and SFX. No captions, logo or outro. */
export const EpisodeVideo: React.FC<{entry: EpisodeEntry}> = ({entry}) => {
  const timeline = useMemo(() => buildTimeline(entry.episode, entry.voiceover), [entry]);
  const sync = useMemo(() => createLipSync(timeline.lines, entry.voiceover), [timeline, entry]);
  return (
    <AbsoluteFill style={{background: PALETTE.midnight}}>
      {timeline.scenes.map((scene) => (
        <Sequence key={scene.index} from={scene.start} durationInFrames={scene.end - scene.start + 1} name={`Scene ${scene.index + 1}: ${scene.scene.set.name}`}>
          <SceneView episode={entry.episode} scene={scene} sync={sync} />
        </Sequence>
      ))}
      <EpisodeAudio episode={entry.episode} timeline={timeline} sync={sync} />
    </AbsoluteFill>
  );
};

/** Frame count of an episode (for registering its composition). */
export const episodeFrames = (entry: EpisodeEntry): number => buildTimeline(entry.episode, entry.voiceover).total;


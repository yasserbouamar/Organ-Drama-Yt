import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Camera} from '../components/comic/Camera';
import {ComicBurst} from '../components/comic/ComicBurst';
import {HalftoneBackground} from '../components/comic/HalftoneBackground';
import {Place} from '../components/comic/Place';
import {LineBadge} from '../components/comic/SpeakerBadge';
import {SpeedLines} from '../components/comic/SpeedLines';
import {Starfield} from '../components/comic/Starfield';
import {SunburstRays} from '../components/comic/SunburstRays';
import {EARTH_DOOR, EARTH_VIEWBOX, EarthCharacter} from '../components/characters/EarthCharacter';
import {ROCKET_VIEWBOX, RocketCharacter} from '../components/characters/RocketCharacter';
import {SatelliteCharacter} from '../components/characters/SatelliteCharacter';
import {SUN_VIEWBOX, SunCharacter} from '../components/characters/SunCharacter';
import {StreetSign} from '../components/props/StreetSign';
import {lineWindow} from '../data/script60s';
import {PALETTE} from '../theme';
import type {Point} from '../types/characters';
import {impacts, pop, settle, shake, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {cameraAt, localToWorld, useSceneClock, worldToLocal, worldToScreen} from './shared';

const W = {
  home: lineWindow('s1-nobody-home'),
  sun: lineWindow('s1-sun-landlord'),
  evicted: lineWindow('s1-evicted'),
  relax: lineWindow('s1-relax-sat'),
};

const EARTH = {x: 1180, y: 540, size: 560};
const SUN = {x: 470, y: 470, size: 640};
const ROCKET_SIZE = 230;
/** Hammer impacts, scene-local frames. */
const HITS = [66, 80, 94, 108];
const STRIKE_ANGLE = 100;
const RAISED_ANGLE = 18;
/** Grip-to-striking-face distance of the hammer, in the Sun's local units. */
const HAMMER_REACH = 150;

const hammerAngle = (f: number): number => {
  for (const h of HITS) {
    if (f <= h) {
      if (f < h - 11) {
        return STRIKE_ANGLE;
      }
      if (f < h - 3) {
        return interpolate(f, [h - 11, h - 3], [STRIKE_ANGLE, RAISED_ANGLE], {easing: Easing.out(Easing.cubic)});
      }
      return interpolate(f, [h - 3, h], [RAISED_ANGLE, STRIKE_ANGLE], {easing: Easing.in(Easing.quad)});
    }
  }
  return STRIKE_ANGLE;
};

export const Scene1EvictionNotice: React.FC = () => {
  const {frame, fps, global} = useSceneClock(1);

  const cam = cameraAt(frame, fps, [
    {at: 0, x: 1320, y: 520, zoom: 1.7},
    {at: W.sun.from, x: 960, y: 520, zoom: 1.0, duration: 26},
    {at: 136, x: 780, y: 480, zoom: 1.16, duration: 18},
    {at: W.evicted.from, x: 1290, y: 450, zoom: 1.22, duration: 20},
    {at: W.relax.from, x: 1360, y: 520, zoom: 1.12, duration: 14},
  ]);
  const hit = impacts(frame, HITS, 10);
  const camShake = shake(frame, hit * 16 + impacts(frame, [W.relax.from + 2], 14) * 18, 's1');

  // ── Sun: slides in, hammers the notice, then lowers its shades to glare ──
  const sunIn = settle(frame, fps, W.sun.from, 22);
  const sunPos = {x: interpolate(sunIn, [0, 1], [-520, SUN.x]), y: SUN.y, size: SUN.size};
  const nail = localToWorld(EARTH, EARTH_VIEWBOX, {x: EARTH_DOOR.x, y: EARTH_DOOR.y - 34});
  const angle = frame < HITS[HITS.length - 1] + 14 ? hammerAngle(frame) : RAISED_ANGLE;
  const strikeHandWorld: Point = {
    x: nail.x - Math.sin((STRIKE_ANGLE * Math.PI) / 180) * HAMMER_REACH * (SUN.size / SUN_VIEWBOX.width),
    y: nail.y + Math.cos((STRIKE_ANGLE * Math.PI) / 180) * HAMMER_REACH * (SUN.size / SUN_VIEWBOX.width),
  };
  const strikeHand = worldToLocal({...SUN}, SUN_VIEWBOX, strikeHandWorld);
  const restHand = {x: 690, y: 300};
  const reach = settle(frame, fps, W.sun.from + 8, 14) * (1 - settle(frame, fps, 124, 16));
  const hand = {x: interpolate(reach, [0, 1], [restHand.x, strikeHand.x]), y: interpolate(reach, [0, 1], [restHand.y, strikeHand.y])};
  const glare = settle(frame, fps, 140, 12);
  const notice = pop(frame, fps, HITS[0]);

  // ── Rocket: peeks from behind Earth, then blasts out front for the hero beat ──
  const heroIn = settle(frame, fps, W.relax.from, 16);
  const peekOut = settle(frame, fps, 2, 18);
  const rocketPos = {
    x: interpolate(heroIn, [0, 1], [interpolate(peekOut, [0, 1], [1300, 1420]), 1510]),
    y: interpolate(heroIn, [0, 1], [470, 600]) - Math.sin(frame * 0.12) * 6,
  };
  const rocketRot = interpolate(heroIn, [0, 1], [-22, 4]);
  const rocketInFront = frame >= W.relax.from;
  const flinch = hit * (frame < W.evicted.from ? 1 : 0);
  const rocketExpression =
    frame < W.sun.from ? 'confused' : frame < W.evicted.from ? 'scared' : frame < W.relax.from ? 'neutral' : 'confident';
  const rocketRest = frame < W.relax.from ? (frame < W.sun.from ? 'open' : 'frown') : 'smile';
  const rocketLook =
    frame < W.sun.from ? {x: -0.9, y: 0.5} : frame < W.evicted.from ? {x: -1, y: 0} : frame < W.relax.from ? {x: 0.6, y: -0.8} : {x: 0.4, y: -0.2};
  const puff = pop(frame, fps, W.relax.from + 8);
  const thumbs = pop(frame, fps, W.relax.from + 34);

  // ── Lil Sat: zips in, trembling ──
  const satIn = settle(frame, fps, W.evicted.from - 4, 18);
  const satDodge = settle(frame, fps, W.relax.from, 18);
  const satPos = {
    x: interpolate(satIn, [0, 1], [2150, 1600]) + satDodge * 170,
    y: interpolate(satIn, [0, 1], [-220, 320]) - satDodge * 40 + Math.sin(frame * 0.1) * 8,
  };
  const satExpression = frame < W.relax.from ? 'scared' : 'awe';

  const earthExpression = frame < HITS[0] ? 'neutral' : frame < W.relax.from ? 'scared' : 'confused';

  const rocketScreen = worldToScreen(cam, rocketPos);
  const rocketTop = worldToScreen(cam, {x: rocketPos.x, y: rocketPos.y - (ROCKET_SIZE * ROCKET_VIEWBOX.height) / ROCKET_VIEWBOX.width / 2 - 20});
  const satTop = worldToScreen(cam, {x: satPos.x + 10, y: satPos.y - 120});
  const sunburst = tween(frame, [W.relax.from, W.relax.from + 8], [0, 1]);

  return (
    <AbsoluteFill>
      <HalftoneBackground accent={{color: '#000', spacing: 22, radius: 6, opacity: 0.4}} />
      <Starfield drift={{x: -0.4, y: 0}} />
      {sunburst > 0 ? (
        <SunburstRays center={rocketScreen} opacity={sunburst} colors={[PALETTE.hazardYellow, '#FFC400']} speed={0.6} />
      ) : null}
      {frame >= W.relax.from && frame < W.relax.from + 24 ? (
        <SpeedLines variant="radial" center={rocketScreen} innerRadius={300} color={PALETTE.white} opacity={tween(frame, [W.relax.from + 10, W.relax.from + 24], [1, 0])} seed="s1-hero" />
      ) : null}

      <Camera x={cam.x} y={cam.y} zoom={cam.zoom} offset={camShake}>
        {frame >= 92 ? (
          <Place x={880} y={180} scale={pop(frame, fps, 92)} rotation={-6} zIndex={0}>
            <StreetSign street="SOLAR SYSTEM ST." plaque="OWNER: THE SUN" size={360} />
          </Place>
        ) : null}

        <Place x={rocketPos.x} y={rocketPos.y} rotation={rocketRot} squash={1 - flinch * 0.12} zIndex={rocketInFront ? 6 : 1}>
          <RocketCharacter
            size={ROCKET_SIZE}
            expression={rocketExpression}
            mouth={mouthAt('ROCKET', global, rocketRest)}
            look={rocketLook}
            thrust={rocketInFront ? 1 + 1.2 * (1 - tween(frame, [W.relax.from, W.relax.from + 40], [0, 1])) : 0.6}
            puff={rocketInFront ? puff : 0}
            sweat={frame >= HITS[0] && frame < W.relax.from ? 0.5 : 0}
            leftArm={rocketInFront ? {angle: 20 + 140 * thumbs, glove: thumbs > 0.5 ? 'thumbsUp' : 'fist'} : {angle: 20}}
            rightArm={rocketInFront ? {angle: 40, bend: 0.5} : {angle: 20}}
          />
        </Place>

        <Place x={EARTH.x} y={EARTH.y + Math.sin(frame * 0.05) * 4} zIndex={3} rotation={hit * 1.5}>
          <EarthCharacter size={EARTH.size} expression={earthExpression} notice={notice} noticeShake={hit} look={frame < W.sun.from ? {x: 0.8, y: 0} : frame < W.relax.from ? {x: -1, y: -0.2} : {x: 0.8, y: 0.2}} />
        </Place>

        <Place x={sunPos.x} y={sunPos.y + Math.sin(frame * 0.07) * 6} zIndex={4} rotation={hit * -2}>
          <SunCharacter
            size={SUN.size}
            expression="grumpy"
            mouth={glare > 0.5 ? 'frown' : 'smug'}
            glassesDrop={glare}
            hammer={{hand, angle}}
            jingle={Math.max(hit, impacts(frame, [100], 30))}
          />
        </Place>

        <Place x={satPos.x} y={satPos.y} rotation={Math.sin(frame * 0.3) * 4} zIndex={5}>
          <SatelliteCharacter
            size={360}
            expression={satExpression}
            mouth={mouthAt('LIL_SAT', global, 'idle')}
            tremble={frame < W.relax.from ? 1 : 0.2}
            wingAngle={frame < W.relax.from ? 12 : 30}
            look={frame < W.relax.from ? {x: -0.6, y: 0.4} : {x: -0.8, y: 0.6}}
          />
        </Place>

        <ComicBurst text="BAM!" x={nail.x + 120} y={nail.y - 120} start={HITS[0]} duration={14} size={110} rotation={-10} />
        <ComicBurst text="BANG!" x={nail.x + 150} y={nail.y + 40} start={HITS[2]} duration={14} size={120} rotation={8} fill={PALETTE.electricCyan} />
      </Camera>

      <LineBadge lineId="s1-nobody-home" x={rocketTop.x} y={rocketTop.y} />
      <LineBadge lineId="s1-evicted" x={satTop.x} y={satTop.y} />
      <LineBadge lineId="s1-relax-sat" x={rocketTop.x} y={rocketTop.y} />
    </AbsoluteFill>
  );
};

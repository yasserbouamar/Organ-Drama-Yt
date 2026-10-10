import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {ComicBurst} from '../components/comic/ComicBurst';
import {HalftoneBackground} from '../components/comic/HalftoneBackground';
import {Place} from '../components/comic/Place';
import {LineBadge} from '../components/comic/SpeakerBadge';
import {SpeedLines} from '../components/comic/SpeedLines';
import {Stamp, STAMP_LAND_FRAMES} from '../components/comic/Stamp';
import {Starfield} from '../components/comic/Starfield';
import {SunburstRays} from '../components/comic/SunburstRays';
import {EarthCharacter} from '../components/characters/EarthCharacter';
import {RocketCharacter} from '../components/characters/RocketCharacter';
import {SatelliteCharacter} from '../components/characters/SatelliteCharacter';
import {SunCharacter} from '../components/characters/SunCharacter';
import {HeatDialGauge} from '../components/infographics/HeatDialGauge';
import {getScene, lineWindow} from '../data/script60s';
import {FONTS, PALETTE, TONES} from '../theme';
import {impact, pop, popInOut, settle, shake, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {lineCue} from './shared';

const SCENE = getScene(2);
const W = {
  tenPercent: lineWindow('s2-ten-percent'),
  tan: lineWindow('s2-just-a-tan'),
  oceans: lineWindow('s2-oceans-dry'),
  hide: lineWindow('s2-where-hide'),
};

/** Quick comic "punch-in" at the start of each panel. */
const usePanelPunch = (): number => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return 1 + 0.07 * (1 - settle(frame, fps, 0, 9));
};

/** Local frame → absolute frame for a panel mounted at scene-local `from`. */
const useGlobal = (from: number): number => useCurrentFrame() + SCENE.startFrame + from;

const Chip: React.FC<{text: string; sub?: string; x: number; y: number; scale: number; color?: string; rotation?: number}> = ({
  text,
  sub,
  x,
  y,
  scale,
  color = PALETTE.white,
  rotation = -3,
}) =>
  scale > 0.001 ? (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        background: color,
        border: `5px solid ${PALETTE.ink}`,
        boxShadow: `0 0 0 8px ${PALETTE.white}, 9px 11px 0 8px ${PALETTE.ink}`,
        borderRadius: 16,
        padding: '10px 26px 6px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        zIndex: 30,
      }}
    >
      <div style={{fontFamily: FONTS.display, fontSize: 52, letterSpacing: 2, color: PALETTE.ink, lineHeight: 1}}>{text}</div>
      {sub ? <div style={{fontFamily: FONTS.body, fontWeight: 900, fontSize: 24, letterSpacing: 2, color: TONES.stampRed, marginTop: 4}}>{sub}</div> : null}
    </div>
  ) : null;

// ── Panel A: the Sun won't swallow us yet, but it brightens 10% per billion years ──
const A = {
  ghostIn: lineCue('s2-ten-percent', 'swallow', {offset: -14}),
  chipIn: lineCue('s2-ten-percent', 'five', {offset: -4}),
  dialIn: lineCue('s2-ten-percent', 'But', {offset: -6}),
  needleFrom: lineCue('s2-ten-percent', 'every'),
  badge: lineCue('s2-ten-percent', 'ten', {offset: -2}),
  needleTo: lineCue('s2-ten-percent', 'brighter', {edge: 'end'}),
  worried: lineCue('s2-ten-percent', 'shines'),
};

const SunDialPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const punch = usePanelPunch();
  const ghost = tween(frame, [A.ghostIn, A.ghostIn + 36], [0, 1]) * (1 - tween(frame, [A.dialIn - 16, A.dialIn + 4], [0, 1]));
  const ghostR = 250 + ghost * 820;
  const needle = tween(frame, [A.needleFrom, A.needleTo], [0, 1]);
  const dialIn = pop(frame, fps, A.dialIn);
  const badge = pop(frame, fps, A.badge);
  const earthWorried = frame > A.worried;

  return (
    <AbsoluteFill style={{transform: `scale(${punch})`}}>
      <HalftoneBackground
        background={`radial-gradient(circle at 30% 52%, #5A1E3A 0%, #2A1240 38%, ${PALETTE.comicNavy} 75%)`}
        accent={{color: '#000', spacing: 22, radius: 6, opacity: 0.35}}
      />
      <Starfield seed="s2-stars" drift={{x: -0.2, y: 0}} opacity={0.7} />
      {ghost > 0.01 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <circle cx={600} cy={560} r={ghostR} fill={TONES.stampRed} opacity={0.12 * ghost} />
          <circle cx={600} cy={560} r={ghostR} fill="none" stroke={TONES.stampRed} strokeWidth={10} strokeDasharray="34 22" opacity={ghost} strokeDashoffset={-frame * 3} />
        </svg>
      ) : null}
      <Chip
        text="RED GIANT? NOT YET."
        sub="~5 BILLION YEARS AWAY"
        x={1000}
        y={170}
        scale={popInOut(frame, fps, A.chipIn, A.dialIn - 2, 8)}
        color={PALETTE.hazardYellow}
      />
      <Place x={600} y={560}>
        <SunCharacter size={760} heat={needle} expression="grumpy" mouth="frown" />
      </Place>
      <Place x={1560} y={720} rotation={Math.sin(frame * 0.05) * 3}>
        <EarthCharacter size={280} expression={earthWorried ? 'scared' : 'neutral'} look={{x: -1, y: 0}} ripples={false} />
      </Place>
      <Place x={1300} y={360} scale={dialIn} rotation={3}>
        <HeatDialGauge value={needle} size={540} badge={badge} />
      </Place>
    </AbsoluteFill>
  );
};

// ── Panel B: "That's just a tan!" ──
const TanPanel: React.FC<{from: number}> = ({from}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const global = useGlobal(from);
  const punch = usePanelPunch();
  const slide = settle(frame, fps, 0, 14);
  const tan = tween(frame, [lineCue('s2-just-a-tan', 'Ten'), lineCue('s2-just-a-tan', 'tan', {edge: 'end'})], [0, 0.85]);
  return (
    <AbsoluteFill style={{transform: `scale(${punch})`}}>
      <SunburstRays colors={[PALETTE.hazardYellow, '#FFC400']} center={{x: 140, y: 120}} speed={0.4} />
      <HalftoneBackground background="transparent" dotColor={PALETTE.solarOrange} spacing={4} opacity={0.25} />
      <Place x={150} y={130}>
        <SunCharacter size={620} heat={0.9} mouth="frown" />
      </Place>
      <Place x={1080 + (1 - slide) * 900} y={560} rotation={-10 + Math.sin(frame * 0.15) * 2}>
        <RocketCharacter
          size={330}
          expression="smug"
          mouth={mouthAt('ROCKET', global, 'smug')}
          sunglasses
          tan={tan}
          thrust={0}
          leftArm={{angle: 165, bend: 0.5, glove: 'open'}}
          rightArm={{angle: 35, bend: 0.3}}
        />
      </Place>
      <ComicBurst text="SIZZLE" x={1450} y={300} start={lineCue('s2-just-a-tan', 'tan')} duration={30} size={120} rotation={10} fill={PALETTE.white} textColor={PALETTE.solarOrange} />
    </AbsoluteFill>
  );
};

// ── Panel C: oceans boil dry → the real move-out date ──
const C = {
  heat: lineCue('s2-oceans-dry', 'extra'),
  steam: lineCue('s2-oceans-dry', 'sunlight'),
  boils: lineCue('s2-oceans-dry', 'boils'),
  oceans: lineCue('s2-oceans-dry', 'oceans'),
  dry: lineCue('s2-oceans-dry', 'dry'),
  dryEnd: lineCue('s2-oceans-dry', 'dry', {edge: 'end'}),
  moveOut: lineCue('s2-oceans-dry', 'real', {offset: -4}),
};

const OceansPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const punch = usePanelPunch();
  const boil = tween(frame, [C.heat, C.boils + 6], [0, 1]);
  const steam = tween(frame, [C.steam, C.oceans + 6], [0, 1]);
  const dryness = tween(frame, [C.boils, C.dryEnd + 4], [0, 1]);
  // The stamp lands on "dry".
  const stampAt = C.dry - STAMP_LAND_FRAMES;
  const stampHit = impact(frame, stampAt + STAMP_LAND_FRAMES, 14);
  const camShake = shake(frame, stampHit * 22, 's2-stamp');
  const tag = pop(frame, fps, C.moveOut);
  return (
    <AbsoluteFill style={{transform: `translate(${camShake.x}px, ${camShake.y}px) scale(${punch})`}}>
      <HalftoneBackground
        background={`radial-gradient(circle at 0% 45%, #FF7A1A 0%, #A3243A 28%, #2A1240 55%, ${PALETTE.comicNavy} 80%)`}
        accent={{color: '#000', spacing: 22, radius: 6, opacity: 0.35}}
      />
      <SpeedLines variant="horizontal" color={PALETTE.hazardYellow} count={26} opacity={0.55} speed={38} thickness={10} seed="sunlight" />
      <Place x={960} y={500} rotation={Math.sin(frame * 0.6) * boil * 1.5}>
        <EarthCharacter
          size={640}
          expression={frame < C.boils ? 'scared' : 'panic'}
          look={{x: -0.8, y: -0.3}}
          boil={boil * (1 - dryness * 0.7)}
          steam={steam}
          dryness={dryness}
        />
      </Place>
      <ComicBurst text="SSSSS!" x={1430} y={260} start={C.boils} duration={34} size={130} rotation={12} fill={PALETTE.white} textColor={PALETTE.electricCyan} />
      <Stamp text="OCEANS DRIED" subtext="EST. +1 BILLION YRS" x={960} y={520} start={stampAt} width={660} rotation={-12} />
      <Chip text="REAL MOVE-OUT DATE" sub="~1 BILLION YEARS FROM NOW" x={960} y={110} scale={tag} color={PALETTE.electricCyan} rotation={2} />
    </AbsoluteFill>
  );
};

// ── Panel D: Lil Sat spins out ──
const HidePanel: React.FC<{from: number}> = ({from}) => {
  const frame = useCurrentFrame();
  const global = useGlobal(from);
  const punch = usePanelPunch();
  return (
    <AbsoluteFill style={{transform: `scale(${punch})`}}>
      <HalftoneBackground
        background={`radial-gradient(circle at 50% 45%, ${PALETTE.vividMagenta} 0%, #7A0A55 45%, ${PALETTE.comicNavy} 85%)`}
        dotColor={PALETTE.ink}
        opacity={0.3}
      />
      <SpeedLines variant="radial" color={PALETTE.white} count={56} innerRadius={330} opacity={0.75} seed="s2-spin" />
      <Place x={960} y={500} rotation={frame * 13} scale={1 + 0.05 * Math.sin(frame * 0.5)}>
        <SatelliteCharacter
          size={520}
          expression="crying"
          mouth={mouthAt('LIL_SAT', global, 'screaming')}
          wingAngle={18 + Math.sin(frame * 0.9) * 22}
        />
      </Place>
    </AbsoluteFill>
  );
};

export const Scene2HeatLimit: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={W.tenPercent.duration} name="Sun + heat dial">
        <SunDialPanel />
      </Sequence>
      <Sequence from={W.tan.from} durationInFrames={W.tan.duration} name="Just a tan">
        <TanPanel from={W.tan.from} />
      </Sequence>
      <Sequence from={W.oceans.from} durationInFrames={W.oceans.duration} name="Oceans boil">
        <OceansPanel />
      </Sequence>
      <Sequence from={W.hide.from} durationInFrames={W.hide.duration} name="Where do we hide">
        <HidePanel from={W.hide.from} />
      </Sequence>
      {/* Badges use scene-local windows, so they live outside the panel Sequences. */}
      <LineBadge lineId="s2-just-a-tan" x={1060} y={250} />
      <LineBadge lineId="s2-where-hide" x={960} y={250} />
    </AbsoluteFill>
  );
};

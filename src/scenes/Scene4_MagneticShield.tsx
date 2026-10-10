import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../components/comic/Camera';
import {ComicBurst} from '../components/comic/ComicBurst';
import {HalftoneBackground} from '../components/comic/HalftoneBackground';
import {Place} from '../components/comic/Place';
import {LineBadge} from '../components/comic/SpeakerBadge';
import {SpeedLines} from '../components/comic/SpeedLines';
import {Starfield} from '../components/comic/Starfield';
import {SunburstRays} from '../components/comic/SunburstRays';
import {EarthCharacter} from '../components/characters/EarthCharacter';
import {GRAVITY_VIEWBOX, GravityCharacter} from '../components/characters/GravityCharacter';
import {RocketCharacter} from '../components/characters/RocketCharacter';
import {SatelliteCharacter} from '../components/characters/SatelliteCharacter';
import {SunCharacter} from '../components/characters/SunCharacter';
import {MagneticShieldArcs} from '../components/infographics/MagneticShieldArcs';
import {AuroraCurtains} from '../components/props/AuroraCurtains';
import {CAGE_CABLES, CAGE_SIZE, ElevatorCage} from '../components/props/ElevatorCage';
import {MovingCrate} from '../components/props/MovingCrate';
import {SubscribePill} from '../components/props/SubscribePill';
import {getScene, lineWindow} from '../data/script60s';
import {FONTS, PALETTE, TONES} from '../theme';
import {impact, pop, popInOut, settle, shake, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {cameraAt, useSceneClock, worldToLocal, worldToScreen} from './shared';

const SCENE = getScene(4);
const W = {
  hold: lineWindow('s4-hold-together'),
  magnet: lineWindow('s4-giant-magnet'),
  lights: lineWindow('s4-green-lights'),
  staying: lineWindow('s4-staying-home'),
  home: lineWindow('s4-home-sweet-home'),
};

const useGlobal = (from: number): number => useCurrentFrame() + SCENE.startFrame + from;

const Tag: React.FC<{text: string; x: number; y: number; scale: number; color: string; rotation?: number; size?: number}> = ({
  text,
  x,
  y,
  scale,
  color,
  rotation = -3,
  size = 46,
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
        boxShadow: `0 0 0 7px ${PALETTE.white}, 8px 10px 0 7px ${PALETTE.ink}`,
        borderRadius: 12,
        padding: '6px 20px 2px',
        fontFamily: FONTS.display,
        fontSize: size,
        letterSpacing: 2,
        color: PALETTE.ink,
        whiteSpace: 'nowrap',
        zIndex: 20,
      }}
    >
      {text}
    </div>
  ) : null;

// ── Panel A: Gravity catches the elevator ─────────────────────────────────
const GRAVITY = {x: 960, y: 280, size: 460};
const CAGE = {x: 960, y: 760, size: 330};

const GravityPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const global = useGlobal(0);
  const fall = interpolate(frame, [0, 12], [-760, 70], {extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  const bounce = frame < 12 ? fall : 70 * Math.cos((frame - 12) * 0.32) * Math.exp(-(frame - 12) * 0.07);
  const cageY = CAGE.y + bounce + Math.sin(frame * 0.08) * 6;
  const s = CAGE.size / CAGE_SIZE.width;
  const cableTopY = 560;
  const anchors = CAGE_CABLES.map((c) => ({
    x: CAGE.x - CAGE.size / 2 + c.x * s,
    y: cageY - (CAGE_SIZE.height * s) / 2 + c.y * s,
  }));
  const hands = anchors.map((a) => worldToLocal(GRAVITY, GRAVITY_VIEWBOX, {x: a.x, y: Math.min(a.y - 20, cableTopY + Math.max(0, bounce) * 0.6)}));
  const stretch = 1 + Math.max(0, bounce) / 400;
  const falling = frame < 12;

  return (
    <AbsoluteFill>
      <HalftoneBackground
        background={`radial-gradient(circle at 50% 35%, #5B1FC4 0%, ${TONES.gravityDeep} 40%, ${PALETTE.comicNavy} 85%)`}
        accent={{color: '#000', spacing: 22, radius: 6, opacity: 0.4}}
      />
      <Starfield seed="s4-stars" drift={{x: 0, y: falling ? -30 : -0.3}} />
      {falling ? <SpeedLines variant="vertical" color={PALETTE.white} speed={-60} count={34} opacity={0.8} seed="s4-fall" /> : null}
      <Place x={CAGE.x} y={cageY} rotation={Math.sin(frame * 0.12) * 2 * Math.exp(-frame * 0.01)}>
        <ElevatorCage size={CAGE.size} cableLength={(cageY - (CAGE_SIZE.height * s) / 2 - cableTopY) / s + 40}>
          <div style={{position: 'absolute', left: 40, top: 80}}>
            <RocketCharacter size={150} expression={frame < 30 ? 'scared' : 'happy'} mouth={frame < 30 ? 'screaming' : 'smile'} thrust={0} look={{x: 0.4, y: -1}} />
          </div>
          <div style={{position: 'absolute', left: 180, top: 140}}>
            <SatelliteCharacter size={220} expression={frame < 30 ? 'scared' : 'awe'} look={{x: 0, y: -1}} wingAngle={frame < 30 ? -30 : 20} />
          </div>
        </ElevatorCage>
      </Place>
      <Place x={GRAVITY.x} y={GRAVITY.y}>
        <GravityCharacter
          size={GRAVITY.size}
          expression="calm"
          mouth={mouthAt('GRAVITY', global, 'idle')}
          look={{x: 0, y: 0.8}}
          arms={{left: hands[0], right: hands[1]}}
          stretch={stretch}
        />
      </Place>
      <ComicBurst text="BOING!" x={1330} y={620} start={12} duration={18} size={110} rotation={10} fill={PALETTE.electricCyan} />
    </AbsoluteFill>
  );
};

// ── Panels B + C: the magnetosphere, then the aurora ─────────────────────
const EARTH = {x: 1180, y: 540, size: 400};
const EARTH_R = (230 * EARTH.size) / 600;

const ShieldWorld: React.FC<{from: number}> = ({from}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const global = useGlobal(from);
  const lightsAt = W.lights.from - W.magnet.from;

  const cam = cameraAt(frame, fps, [
    {at: 0, x: EARTH.x, y: EARTH.y, zoom: 1.9},
    {at: 26, x: 960, y: 540, zoom: 1.0, duration: 30},
    {at: lightsAt, x: 1060, y: 420, zoom: 1.45, duration: 22},
  ]);
  const cutaway = settle(frame, fps, 2, 16) * (1 - settle(frame, fps, lightsAt - 10, 12));
  const fieldDraw = tween(frame, [34, 92], [0, 1], Easing.inOut(Easing.cubic));
  const wind = tween(frame, [10, 30], [0, 1]);
  const deflection = tween(frame, [112, 165], [0, 1], Easing.inOut(Easing.cubic));
  const poles = pop(frame, fps, 56);
  const windTag = popInOut(frame, fps, 96, lightsAt, 8);
  const shieldTag = popInOut(frame, fps, 140, lightsAt, 8);
  const aurora = tween(frame, [lightsAt - 4, lightsAt + 16], [0, 1]);
  const earthExpression = frame < 120 ? 'scared' : 'happy';

  // Lil Sat (screen space) for the aurora beat.
  const satIn = settle(frame, fps, lightsAt, 14);
  const clap = Math.abs(Math.sin((frame - lightsAt) * 0.42));
  const clapHits = Array.from({length: 8}, (_, i) => lightsAt + 8 + Math.round((i * Math.PI) / 0.42));
  const npole = worldToScreen(cam, {x: EARTH.x, y: EARTH.y - EARTH_R});
  const spole = worldToScreen(cam, {x: EARTH.x, y: EARTH.y + EARTH_R});

  return (
    <AbsoluteFill>
      <HalftoneBackground accent={{color: '#000', spacing: 22, radius: 6, opacity: 0.4}} />
      <Starfield seed="s4-space" drift={{x: -0.3, y: 0}} />
      <Camera x={cam.x} y={cam.y} zoom={cam.zoom}>
        <Place x={-40} y={540}>
          <SunCharacter size={720} heat={0.5} expression="grumpy" mouth="frown" />
        </Place>
        <MagneticShieldArcs earth={{x: EARTH.x, y: EARTH.y, r: EARTH_R}} progress={fieldDraw} deflection={deflection} wind={wind} windFrom={260} windTo={2100} />
        {aurora > 0 ? (
          <div style={{position: 'absolute', left: EARTH.x - 300, top: EARTH.y - EARTH_R - 250, opacity: aurora}}>
            <AuroraCurtains width={600} height={300} intensity={aurora} />
          </div>
        ) : null}
        <Place x={EARTH.x} y={EARTH.y}>
          <EarthCharacter size={EARTH.size} expression={earthExpression} cutaway={cutaway} look={frame < 120 ? {x: -1, y: 0} : {x: -0.4, y: 0.3}} ripples={false} />
        </Place>
      </Camera>
      <Tag text="N" x={npole.x} y={npole.y - 34} scale={poles * (1 - aurora)} color={TONES.stampRed} size={40} rotation={0} />
      <Tag text="S" x={spole.x} y={spole.y + 34} scale={poles * (1 - aurora)} color={PALETTE.electricCyan} size={40} rotation={0} />
      <Tag text="DEADLY SOLAR WIND" x={430} y={170} scale={windTag} color={PALETTE.hazardYellow} rotation={-4} />
      <Tag text="MAGNETIC SHIELD" x={1500} y={150} scale={shieldTag} color={TONES.shieldGreen} rotation={3} />
      <Tag text="CHURNING IRON CORE" x={1180} y={130} scale={popInOut(frame, fps, 6, 34, 6)} color={PALETTE.hazardYellow} rotation={-2} />
      {satIn > 0.01 ? (
        <Place x={interpolate(satIn, [0, 1], [-300, 480])} y={600 + Math.sin(frame * 0.12) * 10}>
          <SatelliteCharacter
            size={430}
            expression="awe"
            mouth={mouthAt('LIL_SAT', global, 'smile')}
            wingAngle={30 + clap * 55}
            aura={satIn}
            look={{x: 1, y: -0.4}}
          />
        </Place>
      ) : null}
      {clapHits.map((at, i) => (
        <ComicBurst key={at} text="CLAP!" x={480 + (i % 2 ? 120 : -120)} y={330} start={at} duration={10} size={70} rotation={i % 2 ? 12 : -12} fill={PALETTE.white} textColor={TONES.landShade} />
      ))}
    </AbsoluteFill>
  );
};

// ── Panel D: "Pack the bags, we're staying home!" ─────────────────────────
const SLAM_AT = 34;

const StayingPanel: React.FC<{from: number}> = ({from}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const global = useGlobal(from);
  const lid = frame < SLAM_AT - 6 ? 1 : tween(frame, [SLAM_AT - 6, SLAM_AT], [1, 0], Easing.in(Easing.cubic));
  const hit = impact(frame, SLAM_AT, 14);
  const jolt = shake(frame, hit * 22, 's4-slam');
  const punch = 1 + 0.06 * (1 - settle(frame, fps, 0, 9));
  return (
    <AbsoluteFill style={{transform: `translate(${jolt.x}px, ${jolt.y}px) scale(${punch})`}}>
      <SunburstRays colors={[PALETTE.vividMagenta, '#FF4FA0']} center={{x: 900, y: 640}} speed={0.5} />
      <HalftoneBackground background="transparent" dotColor={PALETTE.ink} opacity={0.22} />
      <Place x={1480} y={560} rotation={Math.sin(frame * 0.06) * 2}>
        <EarthCharacter size={600} expression="happy" doorOpen={1} look={{x: -0.8, y: 0.4}} />
      </Place>
      <Place x={980} y={760} squash={1 - hit * 0.15} anchor="center">
        <MovingCrate size={340} lidOpen={lid} />
      </Place>
      <Place x={560} y={560 - hit * 20} rotation={8 - hit * 6}>
        <RocketCharacter
          size={300}
          expression="happy"
          mouth={mouthAt('ROCKET', global, 'smile')}
          look={{x: 1, y: 0.6}}
          thrust={0.8}
          puff={pop(frame, fps, SLAM_AT)}
          leftArm={{angle: frame > SLAM_AT + 6 ? 160 : 40, glove: frame > SLAM_AT + 6 ? 'thumbsUp' : 'fist'}}
          rightArm={{angle: frame < SLAM_AT ? 120 : 80, length: 140, glove: 'open', bend: 0.1}}
        />
      </Place>
      <ComicBurst text="SLAM!" x={1000} y={560} start={SLAM_AT} duration={22} size={150} rotation={-8} />
    </AbsoluteFill>
  );
};

// ── Panel E: splash card ──────────────────────────────────────────────────
const TITLE = 'HOME SWEET HOME';

const SplashPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const earthIn = pop(frame, fps, 0);
  return (
    <AbsoluteFill>
      <SunburstRays colors={[PALETTE.hazardYellow, '#FFB800']} rays={24} speed={1.1} center={{x: 960, y: 560}} />
      <HalftoneBackground background="transparent" dotColor={PALETTE.solarOrange} opacity={0.3} accent={{color: PALETTE.solarOrange, spacing: 22, radius: 7, opacity: 0.4}} />
      <Place x={150} y={170} scale={pop(frame, fps, 10)} rotation={-8}>
        <SunCharacter size={250} expression="grumpy" mouth="smug" />
      </Place>
      <Place x={960} y={600} scale={0.6 + 0.4 * earthIn}>
        <EarthCharacter size={540} expression="happy" doorOpen={1} look={{x: 0, y: 0.3}} />
      </Place>
      <Place x={450} y={640} scale={pop(frame, fps, 6)} rotation={-6}>
        <RocketCharacter size={230} expression="happy" mouth="smile" thrust={1.2} leftArm={{angle: 160, glove: 'thumbsUp'}} rightArm={{angle: 30}} />
      </Place>
      <Place x={1490} y={470} scale={pop(frame, fps, 8)} rotation={6}>
        <SatelliteCharacter size={360} expression="happy" mouth="smile" wingAngle={40 + Math.sin(frame * 0.5) * 20} aura={0.6} />
      </Place>
      <div style={{position: 'absolute', left: 0, right: 0, top: 50, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 30}}>
        {TITLE.split('').map((ch, i) => {
          const s = pop(frame, fps, 2 + i * 1.2);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: ch === ' ' ? 40 : undefined,
                transform: `translateY(${(1 - s) * -60 + Math.sin(frame * 0.2 + i * 0.6) * 5}px) scale(${s}) rotate(${(i % 2 ? 4 : -4) * (1 - s * 0.6)}deg)`,
                fontFamily: FONTS.display,
                fontSize: 150,
                lineHeight: 1,
                color: PALETTE.white,
                WebkitTextStroke: `14px ${PALETTE.ink}`,
                paintOrder: 'stroke fill',
                textShadow: `6px 6px 0 ${PALETTE.vividMagenta}, 12px 12px 0 ${PALETTE.vividMagenta}, 18px 18px 0 ${PALETTE.ink}`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <SubscribePill x={1620} y={790} start={22} />
    </AbsoluteFill>
  );
};

export const Scene4MagneticShield: React.FC = () => {
  const {frame} = useSceneClock(4);
  const flash = tween(frame, [W.home.from, W.home.from + 6], [1, 0]);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={W.hold.duration} name="Gravity holds on">
        <GravityPanel />
      </Sequence>
      <Sequence from={W.magnet.from} durationInFrames={W.magnet.duration + W.lights.duration} name="Magnetosphere + aurora">
        <ShieldWorld from={W.magnet.from} />
      </Sequence>
      <Sequence from={W.staying.from} durationInFrames={W.staying.duration} name="Staying home">
        <StayingPanel from={W.staying.from} />
      </Sequence>
      <Sequence from={W.home.from} durationInFrames={W.home.duration} name="Home sweet home">
        <SplashPanel />
      </Sequence>
      {frame >= W.home.from && flash > 0 ? <AbsoluteFill style={{background: PALETTE.white, opacity: flash, zIndex: 40}} /> : null}
      <LineBadge lineId="s4-hold-together" x={1330} y={200} rotation={4} />
      <LineBadge lineId="s4-green-lights" x={500} y={330} />
      <LineBadge lineId="s4-staying-home" x={560} y={250} />
    </AbsoluteFill>
  );
};

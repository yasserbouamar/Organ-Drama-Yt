import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {ComicBurst} from '../components/comic/ComicBurst';
import {HalftoneBackground} from '../components/comic/HalftoneBackground';
import {Place} from '../components/comic/Place';
import {LineBadge} from '../components/comic/SpeakerBadge';
import {SpeedLines} from '../components/comic/SpeedLines';
import {Starfield} from '../components/comic/Starfield';
import {Sticker} from '../components/comic/Sticker';
import {SunburstRays} from '../components/comic/SunburstRays';
import {RocketCharacter} from '../components/characters/RocketCharacter';
import {SatelliteCharacter} from '../components/characters/SatelliteCharacter';
import {DepthOdometer} from '../components/infographics/DepthOdometer';
import {Thermometer} from '../components/infographics/Thermometer';
import {ElevatorCage} from '../components/props/ElevatorCage';
import {IronCore} from '../components/props/IronCore';
import {MovingCrate} from '../components/props/MovingCrate';
import {Pluto} from '../components/props/Pluto';
import {getScene, lineWindow} from '../data/script60s';
import {FONTS, INK, PALETTE, TONES} from '../theme';
import {impact, pop, popInOut, settle, shake, tween} from '../utils/animation';
import {mouthAt} from '../utils/lipSync';
import {lineCue} from './shared';

const SCENE = getScene(3);
const W = {
  basement: lineWindow('s3-basement'),
  descent: lineWindow('s3-descent'),
  ironBall: lineWindow('s3-iron-ball'),
  anotherSun: lineWindow('s3-another-sun'),
};

const useGlobal = (from: number): number => useCurrentFrame() + SCENE.startFrame + from;

const Label: React.FC<{text: string; sub?: string; color: string; style?: React.CSSProperties}> = ({text, sub, color, style}) => (
  <div
    style={{
      position: 'absolute',
      background: color,
      border: `5px solid ${PALETTE.ink}`,
      boxShadow: `0 0 0 8px ${PALETTE.white}, 9px 11px 0 8px ${PALETTE.ink}`,
      borderRadius: 14,
      padding: '8px 24px 4px',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      transform: 'translate(-50%, -50%) rotate(-4deg)',
      ...style,
    }}
  >
    <div style={{fontFamily: FONTS.display, fontSize: 60, letterSpacing: 3, color: PALETTE.ink, lineHeight: 1}}>{text}</div>
    {sub ? <div style={{fontFamily: FONTS.body, fontWeight: 900, fontSize: 24, letterSpacing: 2, color: PALETTE.ink}}>{sub}</div> : null}
  </div>
);

// ── Panel A: the cellar door ──────────────────────────────────────────────
const HATCH = {x: 1190, y: 770, rx: 200, ry: 56};

/**
 * Cellar lid hinged on the hatch's back edge. A 2D flip cheat: scaleY 1 = lying
 * shut over the hole, 0 = edge-on, negative = standing up behind the hole.
 */
const CellarHatch: React.FC<{open: number; glow: number}> = ({open, glow}) => {
  const sy = 1 - 2.5 * open;
  const hingeY = HATCH.y - HATCH.ry;
  const underside = sy < 0;
  const ns = {vectorEffect: 'non-scaling-stroke' as const};
  return (
    <svg width={1920} height={1080} overflow="visible" style={{position: 'absolute', inset: 0, zIndex: 3}}>
      <ellipse cx={HATCH.x} cy={HATCH.y} rx={HATCH.rx + 22} ry={HATCH.ry + 14} fill={TONES.steelDark} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <ellipse cx={HATCH.x} cy={HATCH.y} rx={HATCH.rx} ry={HATCH.ry} fill="#140F24" />
      <ellipse cx={HATCH.x} cy={HATCH.y + 14} rx={HATCH.rx * 0.7} ry={HATCH.ry * 0.55} fill={PALETTE.hazardYellow} opacity={0.5 * glow} />
      <rect x={HATCH.x - 90} y={HATCH.y - 10} width={180} height={22} rx={6} fill={TONES.steel} stroke={PALETTE.ink} strokeWidth={INK.medium} opacity={glow} />
      <g transform={`translate(0 ${hingeY}) scale(1 ${sy}) translate(0 ${-hingeY})`}>
        <ellipse cx={HATCH.x} cy={HATCH.y} rx={HATCH.rx} ry={HATCH.ry} fill={underside ? TONES.woodDark : TONES.wood} stroke={PALETTE.ink} strokeWidth={INK.bold} {...ns} />
        {[-110, -36, 36, 110].map((dx) => {
          const h = HATCH.ry * Math.sqrt(1 - (dx / HATCH.rx) ** 2);
          return <path key={dx} d={`M${HATCH.x + dx},${HATCH.y - h + 4} L${HATCH.x + dx},${HATCH.y + h - 4}`} stroke={underside ? '#5E3410' : TONES.woodDark} strokeWidth={5} {...ns} />;
        })}
        <path d={`M${HATCH.x - HATCH.rx + 20},${HATCH.y} L${HATCH.x + HATCH.rx - 20},${HATCH.y}`} stroke={PALETTE.ink} strokeWidth={4} opacity={0.5} {...ns} />
        <circle cx={HATCH.x} cy={HATCH.y + HATCH.ry * 0.55} r={11} fill="none" stroke={TONES.steel} strokeWidth={6} {...ns} />
      </g>
    </svg>
  );
};

// "Easy! When it's too hot upstairs, you go to the basement! Hop in!"
const CELLAR = {
  open: lineCue('s3-basement', 'Easy', {edge: 'end'}),
  sign: lineCue('s3-basement', 'basement', {offset: -4}),
  dragFrom: lineCue('s3-basement', 'Hop', {offset: -16}),
  dragTo: lineCue('s3-basement', 'in', {edge: 'end'}),
  end: W.basement.duration,
};

const CellarPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const global = useGlobal(0);
  const open = settle(frame, fps, CELLAR.open, 12);
  const drag = tween(frame, [CELLAR.dragFrom, CELLAR.dragTo], [0, 1]);
  const drop = tween(frame, [CELLAR.dragTo - 2, CELLAR.end - 4], [0, 1], Easing.in(Easing.quad));
  const satHop = tween(frame, [CELLAR.dragFrom + 8, CELLAR.end - 2], [0, 1]);
  const dive = tween(frame, [CELLAR.end - 10, CELLAR.end], [0, 1], Easing.in(Easing.cubic));
  const signIn = pop(frame, fps, CELLAR.sign);
  const reaching = frame < CELLAR.open + 12;
  const crateX = interpolate(drag, [0, 1], [880, HATCH.x]);
  const rocketX = interpolate(drag, [0, 1], [610, HATCH.x - 250]);
  const zoom = 1 + dive * 2.4;

  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${HATCH.x}px ${HATCH.y}px`,
        transform: `scale(${zoom})`,
      }}
    >
      <HalftoneBackground accent={{color: '#000', spacing: 22, radius: 6, opacity: 0.4}} />
      <Starfield seed="s3-stars" />
      {/* Earth's surface, seen up close */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <circle cx={960} cy={2660} r={1980} fill={TONES.landGreen} stroke={PALETTE.ink} strokeWidth={10} />
        <circle cx={960} cy={2700} r={1960} fill={TONES.landShade} opacity={0.4} />
        {Array.from({length: 26}, (_, i) => {
          const x = 40 + i * 72 + random(`tuft-${i}`) * 30;
          const y = 2660 - Math.sqrt(1980 ** 2 - (x - 960) ** 2);
          return <path key={i} d={`M${x - 12},${y + 4} L${x - 4},${y - 22} L${x + 2},${y + 2} L${x + 10},${y - 16} L${x + 14},${y + 4}`} fill={TONES.landGreen} stroke={PALETTE.ink} strokeWidth={4} strokeLinejoin="round" />;
        })}
      </svg>
      <CellarHatch open={open} glow={open} />
      {signIn > 0.01 ? (
        <div style={{position: 'absolute', left: HATCH.x + 40, top: 520, transform: `translate(-50%, -50%) scale(${signIn}) rotate(6deg)`, zIndex: 5}}>
          <Sticker bleed={0.25}>
            <div style={{background: PALETTE.ink, border: `5px solid ${PALETTE.electricCyan}`, borderRadius: 14, padding: '8px 24px 2px', fontFamily: FONTS.display, fontSize: 58, letterSpacing: 4, color: PALETTE.electricCyan, textShadow: `0 0 18px ${PALETTE.electricCyan}`}}>
              BASEMENT ▼
            </div>
          </Sticker>
        </div>
      ) : null}
      <Place x={crateX} y={700 + drop * 120} scale={1 - drop * 0.7} opacity={1 - drop} zIndex={6} rotation={drag * 8}>
        <MovingCrate size={230} />
      </Place>
      <Place x={rocketX} y={560 - Math.sin(frame * 0.14) * 8} zIndex={7} rotation={-6 + drag * 12}>
        <RocketCharacter
          size={270}
          expression="confident"
          mouth={mouthAt('ROCKET', global, 'smile')}
          look={{x: 1, y: 0.4}}
          thrust={1}
          leftArm={{angle: reaching ? 120 : 30}}
          rightArm={{angle: reaching ? 70 : drag > 0 ? 80 : 50, glove: reaching ? 'fist' : 'open'}}
        />
      </Place>
      <Place
        x={interpolate(satHop, [0, 1], [1560, HATCH.x + 40])}
        y={interpolate(satHop, [0, 1], [330, 780]) - Math.sin(satHop * Math.PI) * 180}
        scale={1 - satHop * 0.6}
        rotation={satHop * 180}
        zIndex={6}
      >
        <SatelliteCharacter size={300} expression={frame < CELLAR.sign ? 'scared' : 'confused'} tremble={0.6} wingAngle={14} look={{x: -0.8, y: 0.8}} />
      </Place>
      <ComicBurst text="KA-CHUNK!" x={HATCH.x + 160} y={600} start={CELLAR.open + 4} duration={16} size={120} rotation={8} />
    </AbsoluteFill>
  );
};

// ── Panel B: the descent ──────────────────────────────────────────────────
const STRATA = {crustEnd: 900, mantleEnd: 3100, coreEnd: 5200};
// "Down through the crust, past the mantle. Eighteen hundred miles down, solid rock melts into churning liquid iron."
// Layer boundaries cross the cage as their words are spoken; 1,800 MI lands on "melts".
const DESCENT = {
  mantle: lineCue('s3-descent', 'mantle'),
  melts: lineCue('s3-descent', 'melts'),
  end: W.descent.duration,
};
const SCROLL_KEYS = {frames: [0, DESCENT.mantle, DESCENT.melts, DESCENT.end], px: [0, 420, 2620, 3420]};
const MILES_KEYS = {frames: [0, DESCENT.mantle, DESCENT.melts], miles: [0, 25, 1800]};

const scrollAt = (f: number): number =>
  interpolate(f, SCROLL_KEYS.frames, SCROLL_KEYS.px, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});

const wavyEdge = (y: number, amp: number, seed: string): string => {
  const pts: string[] = [];
  for (let x = -40; x <= 1960; x += 80) {
    pts.push(`${x},${(y + (random(`${seed}-${x}`) - 0.5) * amp * 2).toFixed(1)}`);
  }
  return pts.join(' L');
};

const StrataColumn: React.FC<{scroll: number}> = ({scroll}) => {
  const frame = useCurrentFrame();
  const top = -scroll;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${top})`}>
        {/* Crust */}
        <rect x={0} y={-200} width={1920} height={STRATA.crustEnd + 400} fill={TONES.crust} />
        {Array.from({length: 7}, (_, i) => (
          <path key={i} d={`M${wavyEdge(80 + i * 120, 14, `strata-${i}`)}`} fill="none" stroke={TONES.crustDark} strokeWidth={6} opacity={0.6} />
        ))}
        {Array.from({length: 26}, (_, i) => {
          const x = random(`rock-x-${i}`) * 1920;
          const y = random(`rock-y-${i}`) * (STRATA.crustEnd - 60);
          const r = 16 + random(`rock-r-${i}`) * 34;
          return (
            <polygon
              key={i}
              points={`${x - r},${y} ${x - r * 0.4},${y - r * 0.8} ${x + r * 0.6},${y - r * 0.6} ${x + r},${y + r * 0.2} ${x + r * 0.2},${y + r * 0.8} ${x - r * 0.7},${y + r * 0.6}`}
              fill={i % 5 === 0 ? PALETTE.electricCyan : TONES.crustDark}
              stroke={PALETTE.ink}
              strokeWidth={4}
              strokeLinejoin="round"
            />
          );
        })}
        <g transform="translate(1500 640) rotate(-20)">
          <path d="M-70,0 L70,0" stroke={PALETTE.white} strokeWidth={18} strokeLinecap="round" />
          {[-70, 70].map((x) => (
            <g key={x}>
              <circle cx={x} cy={-10} r={14} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={4} />
              <circle cx={x} cy={10} r={14} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={4} />
            </g>
          ))}
          <path d="M-70,0 L70,0" stroke={PALETTE.white} strokeWidth={10} strokeLinecap="round" />
        </g>
        {/* Mantle */}
        <path d={`M${wavyEdge(STRATA.crustEnd, 26, 'crust-edge')} L1960,${STRATA.mantleEnd + 200} L-40,${STRATA.mantleEnd + 200} Z`} fill={TONES.mantle} stroke={PALETTE.ink} strokeWidth={10} />
        {Array.from({length: 14}, (_, i) => {
          const x = random(`blob-x-${i}`) * 1920;
          const baseY = STRATA.crustEnd + 200 + random(`blob-y-${i}`) * (STRATA.mantleEnd - STRATA.crustEnd - 300);
          const y = baseY - ((frame * (0.6 + random(`blob-v-${i}`))) % 200);
          const r = 50 + random(`blob-r-${i}`) * 90;
          return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.75} fill={i % 2 ? TONES.mantleDark : '#FF7A3A'} opacity={0.55} />;
        })}
        {/* Outer core: liquid iron */}
        <path d={`M${wavyEdge(STRATA.mantleEnd, 30, 'mantle-edge')} L1960,${STRATA.coreEnd} L-40,${STRATA.coreEnd} Z`} fill={TONES.outerCore} stroke={PALETTE.ink} strokeWidth={10} />
        {Array.from({length: 18}, (_, i) => {
          const y = STRATA.mantleEnd + 120 + i * 110;
          const phase = frame * 0.12 + i;
          const pts: string[] = [];
          for (let x = -40; x <= 1960; x += 60) {
            pts.push(`${x},${(y + Math.sin(x * 0.008 + phase) * 26).toFixed(1)}`);
          }
          return <path key={i} d={`M${pts.join(' L')}`} fill="none" stroke={i % 2 ? PALETTE.hazardYellow : '#FFD27A'} strokeWidth={8} strokeLinecap="round" opacity={0.75} />;
        })}
      </g>
    </svg>
  );
};

const DescentPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scroll = scrollAt(frame);
  const velocity = Math.abs(scrollAt(frame + 1) - scroll);
  const miles = interpolate(frame, MILES_KEYS.frames, MILES_KEYS.miles, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  const heat = tween(frame, [DESCENT.mantle - 10, DESCENT.melts], [0, 1]);
  const sway = Math.sin(frame * 0.15) * 2.5;
  const labelY = (stripY: number) => stripY - scroll;
  const odoIn = pop(frame, fps, 4);
  return (
    <AbsoluteFill>
      <StrataColumn scroll={scroll} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(255,120,0,0) 40%, rgba(255,80,0,${0.35 * heat}) 100%)`}} />
      <HalftoneBackground background="transparent" opacity={0.2} />
      <SpeedLines variant="vertical" color={PALETTE.white} count={30} speed={-Math.max(8, velocity * 1.4)} opacity={Math.min(0.8, velocity / 40)} thickness={8} seed="s3-drop" />
      <Label text="CRUST" sub="0–25 MI" color={TONES.desertTan} style={{left: 300, top: labelY(420)}} />
      <Label text="MANTLE" sub="SOLID ROCK · 25–1,800 MI" color="#FF8A5C" style={{left: 310, top: labelY(1900)}} />
      <Label text="OUTER CORE" sub="CHURNING LIQUID IRON" color={PALETTE.hazardYellow} style={{left: 330, top: labelY(STRATA.mantleEnd + 160)}} />
      <Place x={960} y={500} rotation={sway} anchor="center">
        <ElevatorCage size={440} cableLength={900}>
          <div style={{position: 'absolute', left: 30, top: 70}}>
            <RocketCharacter size={150} expression="awe" mouth="open" look={{x: 0.3, y: 1}} thrust={0} leftArm={{angle: 30}} rightArm={{angle: 30}} />
          </div>
          <div style={{position: 'absolute', left: 170, top: 120}}>
            <SatelliteCharacter size={230} expression="scared" tremble={0.8} wingAngle={-30} look={{x: -0.5, y: 1}} />
          </div>
          <div style={{position: 'absolute', left: 250, top: 300}}>
            <MovingCrate size={150} sticker={false} />
          </div>
        </ElevatorCage>
      </Place>
      <div style={{position: 'absolute', left: 1400, top: 170, transform: `scale(${odoIn}) rotate(2deg)`, transformOrigin: '50% 0%'}}>
        <DepthOdometer miles={Math.round(miles)} width={460} />
      </div>
    </AbsoluteFill>
  );
};

// ── Panel C: the inner core ───────────────────────────────────────────────
// "And dead center sits a solid iron ball the size of Pluto, burning at ten thousand degrees!"
const CORE = {
  solid: lineCue('s3-iron-ball', 'solid'),
  pluto: lineCue('s3-iron-ball', 'size', {offset: -4}),
  thermo: lineCue('s3-iron-ball', 'burning', {offset: -6}),
  mercuryFrom: lineCue('s3-iron-ball', 'burning'),
  mercuryTo: lineCue('s3-iron-ball', 'degrees', {edge: 'end'}),
};

const CorePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = settle(frame, fps, 0, 26);
  const plutoIn = pop(frame, fps, CORE.pluto);
  const thermoIn = pop(frame, fps, CORE.thermo);
  const mercury = tween(frame, [CORE.mercuryFrom, CORE.mercuryTo], [0.08, 1], Easing.out(Easing.cubic));
  return (
    <AbsoluteFill>
      <HalftoneBackground
        background={`radial-gradient(circle at 43% 60%, #FF9A2E 0%, #D0420F 30%, #7A1A08 65%, #3A0A06 100%)`}
        dotColor={PALETTE.ink}
        opacity={0.3}
        accent={{color: PALETTE.ink, spacing: 24, radius: 7, opacity: 0.4}}
      />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: 9}, (_, i) => {
          const y = 80 + i * 120;
          const pts: string[] = [];
          for (let x = -40; x <= 1960; x += 60) {
            pts.push(`${x},${(y + Math.sin(x * 0.007 + frame * 0.1 + i) * 30).toFixed(1)}`);
          }
          return <path key={i} d={`M${pts.join(' L')}`} fill="none" stroke={i % 2 ? PALETTE.solarOrange : '#FFB347'} strokeWidth={7} opacity={0.55} strokeLinecap="round" />;
        })}
      </svg>
      <Place x={820} y={interpolate(rise, [0, 1], [1350, 640])}>
        <IronCore size={660} />
      </Place>
      <Place x={300} y={230 + Math.sin(frame * 0.1) * 6} rotation={-4}>
        <ElevatorCage size={300} cableLength={400}>
          <div style={{position: 'absolute', left: 40, top: 80}}>
            <RocketCharacter size={150} expression="awe" mouth="open" look={{x: 1, y: 1}} thrust={0} />
          </div>
          <div style={{position: 'absolute', left: 180, top: 140}}>
            <SatelliteCharacter size={220} expression="awe" mouth="open" look={{x: 1, y: 1}} />
          </div>
        </ElevatorCage>
      </Place>
      {plutoIn > 0.01 ? (
        <div style={{position: 'absolute', left: 1330, top: 190, transform: `translate(-50%, -50%) scale(${plutoIn}) rotate(-3deg)`}}>
          <Sticker bleed={0.2}>
            <div style={{background: PALETTE.white, border: `5px solid ${PALETTE.ink}`, borderRadius: 20, padding: '14px 26px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <svg width={110} height={110} viewBox="0 0 200 200">
                  <circle cx={100} cy={100} r={92} fill={TONES.innerCore} stroke={PALETTE.ink} strokeWidth={8} />
                  <ellipse cx={70} cy={66} rx={26} ry={12} fill={PALETTE.white} transform="rotate(-35 70 66)" />
                </svg>
                <div style={{fontFamily: FONTS.display, fontSize: 80, color: PALETTE.ink, lineHeight: 1}}>≈</div>
                <Pluto size={110} />
              </div>
              <div style={{fontFamily: FONTS.display, fontSize: 40, letterSpacing: 2, color: PALETTE.ink}}>SIZE OF PLUTO</div>
              <div style={{fontFamily: FONTS.body, fontWeight: 900, fontSize: 20, letterSpacing: 2, color: TONES.stampRed}}>~1,500 MI ACROSS</div>
            </div>
          </Sticker>
        </div>
      ) : null}
      <Place x={1600} y={640} scale={thermoIn}>
        <Thermometer value={mercury} reading={mercury * 10000} height={520} />
      </Place>
      <ComicBurst text="SOLID IRON" x={830} y={640} start={CORE.solid} duration={34} size={130} rotation={-6} fill={PALETTE.white} textColor={PALETTE.ink} fontSize={58} />
    </AbsoluteFill>
  );
};

// ── Panel D: "…and found another Sun?!" ───────────────────────────────────
const PanicPanel: React.FC<{from: number}> = ({from}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const global = useGlobal(from);
  const bulge = pop(frame, fps, 6);
  const jolt = shake(frame, 7 + impact(frame, 0, 12) * 20, 's3-panic');
  return (
    <AbsoluteFill style={{transform: `translate(${jolt.x}px, ${jolt.y}px)`}}>
      <SunburstRays colors={[PALETTE.solarOrange, PALETTE.hazardYellow]} rays={26} speed={1.6} center={{x: 960, y: 1100}} />
      <HalftoneBackground background="transparent" dotColor={TONES.mantleDark} opacity={0.25} />
      <Place x={960} y={1180} scale={1 + frame * 0.002}>
        <IronCore size={1100} />
      </Place>
      <SpeedLines variant="radial" color={PALETTE.white} count={50} innerRadius={380} center={{x: 960, y: 440}} opacity={0.8} seed="s3-panic-lines" />
      <Place x={960} y={460} rotation={Math.sin(frame * 1.7) * 3}>
        <RocketCharacter
          size={360}
          expression="panic"
          mouth={mouthAt('ROCKET', global, 'screaming')}
          bulge={bulge}
          sweat={1}
          thrust={0.4}
          look={{x: 0, y: 0.6}}
          leftArm={{angle: 160 + Math.sin(frame * 1.3) * 10, glove: 'open'}}
          rightArm={{angle: 160 + Math.cos(frame * 1.3) * 10, glove: 'open'}}
        />
      </Place>
    </AbsoluteFill>
  );
};

export const Scene3CoreElevator: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ding = popInOut(frame, fps, W.ironBall.from, W.ironBall.from + 20, 6);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={W.basement.duration} name="Cellar door">
        <CellarPanel />
      </Sequence>
      <Sequence from={W.descent.from} durationInFrames={W.descent.duration} name="Descent">
        <DescentPanel />
      </Sequence>
      <Sequence from={W.ironBall.from} durationInFrames={W.ironBall.duration} name="Inner core">
        <CorePanel />
      </Sequence>
      <Sequence from={W.anotherSun.from} durationInFrames={W.anotherSun.duration} name="Another Sun">
        <PanicPanel from={W.anotherSun.from} />
      </Sequence>
      {ding > 0 ? (
        <div style={{position: 'absolute', left: 560, top: 120, transform: `scale(${ding}) rotate(-8deg)`, fontFamily: FONTS.display, fontSize: 90, color: PALETTE.hazardYellow, WebkitTextStroke: `10px ${PALETTE.ink}`, paintOrder: 'stroke fill', zIndex: 20}}>
          DING!
        </div>
      ) : null}
      <LineBadge lineId="s3-basement" x={Math.min(1700, 610 + tween(frame, [CELLAR.dragFrom, CELLAR.dragTo], [0, 1]) * 330)} y={300} />
      <LineBadge lineId="s3-another-sun" x={960} y={150} />
    </AbsoluteFill>
  );
};

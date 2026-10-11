import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {Bed, BedroomRoom, Nightstand} from '../components/backgrounds/BedroomBackground';
import {GutBackground} from '../components/backgrounds/GutBackground';
import {FONTS, INK, PALETTE, TONES} from '../theme';
import {useSvgId} from '../utils/useSvgId';
import {darken, lighten} from './color';
import type {SetSpec} from './types';

const W = 1920;
const H = 1080;
const ink = {stroke: PALETTE.ink, strokeWidth: INK.bold, strokeLinejoin: 'round' as const};

/** Where feet land, and whether characters cast a floor shadow. */
export const setFloor = (set: SetSpec): {floorY: number; shadow: boolean} => {
  switch (set.name) {
    case 'gut':
      return {floorY: 960, shadow: false};
    case 'body':
      return {floorY: 950, shadow: true};
    case 'bedroom':
      return {floorY: 985, shadow: true};
    case 'kitchen':
      return {floorY: 990, shadow: true};
    case 'outdoors':
      return {floorY: 975, shadow: true};
    case 'stage':
      return {floorY: 960, shadow: true};
    case 'classroom':
      return {floorY: 990, shadow: true};
    case 'plain':
      return {floorY: 960, shadow: true};
  }
};

// ── Body interior ────────────────────────────────────────────────────────

const BodySet: React.FC<{tint: string; particles: NonNullable<SetSpec['particles']>}> = ({tint, particles}) => {
  const frame = useCurrentFrame();
  const grad = useSvgId('body-grad');
  const vig = useSvgId('body-vig');
  const bands = [0, 1, 2, 3, 4];
  const floaters = Array.from({length: 18}, (_, i) => {
    const speed = 0.4 + random(`bf-s-${i}`) * 0.8;
    const x = ((random(`bf-x-${i}`) * (W + 300) + frame * speed) % (W + 300)) - 150;
    const y = 80 + random(`bf-y-${i}`) * 720 + Math.sin(frame * 0.03 + i) * 16;
    const r = 14 + random(`bf-r-${i}`) * 26;
    return {x, y, r, rot: frame * (0.5 + i * 0.1)};
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={grad} cx="50%" cy="45%" r="75%">
          <stop offset="0" stopColor={lighten(tint, 0.25)} />
          <stop offset="0.6" stopColor={tint} />
          <stop offset="1" stopColor={darken(tint, 0.35)} />
        </radialGradient>
        <radialGradient id={vig} cx="50%" cy="50%" r="75%">
          <stop offset="0.6" stopColor="#2A0A1E" stopOpacity={0} />
          <stop offset="1" stopColor="#2A0A1E" stopOpacity={0.5} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${grad})`} />
      {bands.map((i) => {
        const y0 = 120 + i * 170;
        const amp = 18 + i * 3;
        const d = `M-20,${y0} ${Array.from({length: 12}, (_, k) => {
          const x = k * 180;
          return `Q${x + 90},${y0 + Math.sin(frame * 0.04 + k + i) * amp - amp} ${x + 180},${y0}`;
        }).join(' ')}`;
        return <path key={i} d={d} fill="none" stroke={lighten(tint, 0.35)} strokeWidth={10} strokeLinecap="round" opacity={0.35} />;
      })}
      {particles !== 'none'
        ? floaters.map((p, i) =>
            particles === 'cells' ? (
              <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`} opacity={0.75}>
                <ellipse rx={p.r * 1.3} ry={p.r} fill="#E53935" stroke={PALETTE.ink} strokeWidth={3} />
                <ellipse rx={p.r * 0.7} ry={p.r * 0.45} fill="#B71C1C" opacity={0.5} />
              </g>
            ) : particles === 'bubbles' ? (
              <g key={i} transform={`translate(${p.x} ${p.y})`} opacity={0.55}>
                <circle r={p.r} fill={lighten(tint, 0.5)} fillOpacity={0.35} stroke={PALETTE.white} strokeWidth={4} />
                <circle cx={-p.r * 0.35} cy={-p.r * 0.35} r={p.r * 0.2} fill={PALETTE.white} />
              </g>
            ) : (
              <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${0.5 + 0.5 * Math.abs(Math.sin(frame * 0.1 + i))})`} opacity={0.8}>
                <path d="M0,-22 L6,-6 L22,0 L6,6 L0,22 L-6,6 L-22,0 L-6,-6 Z" fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={2.5} />
              </g>
            ),
          )
        : null}
      <path d={`M0,880 C420,840 760,900 960,880 C1180,858 1500,836 1920,880 L1920,1080 L0,1080 Z`} fill={darken(tint, 0.18)} {...ink} />
      <path d={`M0,930 C420,900 760,950 960,930 C1180,910 1500,895 1920,930`} fill="none" stroke={lighten(tint, 0.3)} strokeWidth={8} opacity={0.5} />
      <rect width={W} height={H} fill={`url(#${vig})`} />
    </svg>
  );
};

// ── Kitchen ───────────────────────────────────────────────────────────────

const KitchenSet: React.FC<{night: boolean}> = ({night}) => {
  const frame = useCurrentFrame();
  const wall = night ? '#3B3486' : '#FEF3C7';
  const tile = night ? '#4C45A0' : '#FDE68A';
  const sky = night ? '#1E3A8A' : '#7DD3FC';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <rect width={W} height={H} fill={wall} />
      {Array.from({length: 10}, (_, r) =>
        Array.from({length: 17}, (_, c) => (
          <rect key={`${r}-${c}`} x={c * 120 + (r % 2) * 60 - 60} y={r * 70} width={112} height={62} rx={6} fill={tile} opacity={0.45} />
        )),
      )}
      {/* Window */}
      <rect x={180} y={150} width={420} height={330} rx={10} fill={sky} {...ink} />
      {night ? <circle cx={480} cy={240} r={44} fill={TONES.moon} /> : <circle cx={480} cy={240} r={54} fill={TONES.sun} />}
      {!night ? <ellipse cx={300 + Math.sin(frame * 0.01) * 30} cy={320} rx={90} ry={32} fill={PALETTE.white} opacity={0.9} /> : null}
      <path d="M390,150 L390,480 M180,315 L600,315" stroke={PALETTE.white} strokeWidth={18} />
      <rect x={180} y={150} width={420} height={330} rx={10} fill="none" {...ink} />
      {/* Cabinets */}
      {[700, 960, 1220].map((x) => (
        <g key={x}>
          <rect x={x} y={120} width={240} height={250} rx={12} fill={night ? '#6D28D9' : '#F9A8D4'} {...ink} />
          <circle cx={x + 200} cy={250} r={10} fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={3} />
        </g>
      ))}
      {/* Counter */}
      <rect x={0} y={640} width={1500} height={300} fill={night ? '#5B21B6' : '#F472B6'} {...ink} />
      <rect x={-10} y={610} width={1520} height={44} rx={10} fill={night ? '#A5B4FC' : '#FFFFFF'} {...ink} />
      {[160, 520, 880, 1240].map((x) => (
        <g key={x}>
          <rect x={x} y={690} width={220} height={210} rx={12} fill="none" stroke={PALETTE.ink} strokeWidth={INK.medium} opacity={0.6} />
          <rect x={x + 90} y={720} width={40} height={12} rx={6} fill={TONES.gold} stroke={PALETTE.ink} strokeWidth={2.5} />
        </g>
      ))}
      {/* Fridge */}
      <rect x={1560} y={180} width={300} height={780} rx={30} fill={night ? '#C7D2FE' : '#E0F2FE'} {...ink} />
      <line x1={1560} y1={450} x2={1860} y2={450} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      <rect x={1600} y={300} width={18} height={110} rx={9} fill={PALETTE.ink} />
      <rect x={1600} y={500} width={18} height={140} rx={9} fill={PALETTE.ink} />
      {/* Floor */}
      <rect x={0} y={940} width={W} height={140} fill={night ? '#312E81' : '#FBCFE8'} />
      {Array.from({length: 17}, (_, c) => (
        <rect key={c} x={c * 120 - (c % 2) * 0} y={940 + (c % 2) * 70} width={120} height={70} fill={night ? '#3730A3' : '#F9A8D4'} />
      ))}
      <line x1={0} y1={940} x2={W} y2={940} stroke={PALETTE.ink} strokeWidth={INK.bold} />
    </svg>
  );
};

// ── Outdoors ──────────────────────────────────────────────────────────────

const OutdoorsSet: React.FC<{time: 'day' | 'sunset' | 'night'}> = ({time}) => {
  const frame = useCurrentFrame();
  const skyId = useSvgId('out-sky');
  const sky = {day: ['#38BDF8', '#BAE6FD'], sunset: ['#F472B6', '#FDBA74'], night: ['#0F1A4D', '#1E3A8A']}[time];
  const hill = {day: ['#4ADE80', '#22C55E'], sunset: ['#A3E635', '#65A30D'], night: ['#166534', '#14532D']}[time];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${skyId})`} />
      {time === 'night'
        ? Array.from({length: 40}, (_, i) => (
            <circle key={i} cx={random(`os-x-${i}`) * W} cy={random(`os-y-${i}`) * 560} r={2 + random(`os-r-${i}`) * 3} fill={TONES.star} opacity={0.5 + 0.5 * Math.sin(frame * 0.1 + i)} />
          ))
        : null}
      <circle cx={1540} cy={time === 'sunset' ? 560 : 200} r={110} fill={time === 'night' ? TONES.moon : TONES.sun} {...ink} />
      {time !== 'night'
        ? [
            [300, 180, 1],
            [900, 120, 0.8],
            [1300, 300, 0.7],
          ].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${((x + frame * (0.4 + i * 0.2)) % (W + 400)) - 200} ${y}) scale(${s})`}>
              <path d="M-120,30 C-150,30 -150,-20 -110,-20 C-100,-70 -20,-80 0,-40 C30,-80 110,-60 100,-10 C150,-10 150,30 120,30 Z" fill={PALETTE.white} {...ink} strokeWidth={INK.medium} />
            </g>
          ))
        : null}
      <path d="M-50,760 C300,620 640,640 900,740 C1150,640 1500,600 1980,740 L1980,1100 L-50,1100 Z" fill={hill[0]} {...ink} />
      <path d="M-50,900 C400,820 900,860 1100,880 C1400,850 1700,830 1980,880 L1980,1100 L-50,1100 Z" fill={hill[1]} {...ink} />
      <path d="M760,1080 C840,980 900,940 960,900 C1020,940 1080,980 1160,1080 Z" fill="#FDE68A" opacity={0.8} />
      {[220, 1720].map((x) => (
        <g key={x}>
          <rect x={x - 18} y={760} width={36} height={160} fill="#92400E" {...ink} strokeWidth={INK.medium} />
          <circle cx={x} cy={720} r={90} fill={hill[1]} {...ink} />
        </g>
      ))}
    </svg>
  );
};

// ── Stage / plain / classroom ────────────────────────────────────────────

const StageSet: React.FC = () => {
  const frame = useCurrentFrame();
  const beam = useSvgId('stage-beam');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={beam} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FEF9C3" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FEF9C3" stopOpacity={0.08} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="#1E1B4B" />
      {Array.from({length: 16}, (_, i) => (
        <rect key={i} x={i * 120} y={0} width={60} height={900} fill="#312E81" opacity={0.6} />
      ))}
      <path d={`M${860 + Math.sin(frame * 0.03) * 30},0 L${1060 + Math.sin(frame * 0.03) * 30},0 L1500,960 L420,960 Z`} fill={`url(#${beam})`} />
      <rect x={0} y={880} width={W} height={200} fill="#B45309" />
      {Array.from({length: 10}, (_, i) => (
        <line key={i} x1={0} y1={900 + i * 20} x2={W} y2={900 + i * 20} stroke="#92400E" strokeWidth={3} />
      ))}
      <line x1={0} y1={880} x2={W} y2={880} stroke={PALETTE.ink} strokeWidth={INK.bold} />
      {[-1, 1].map((s) => (
        <path
          key={s}
          d={s < 0 ? 'M0,0 L380,0 C340,200 330,500 300,900 L0,900 Z' : 'M1920,0 L1540,0 C1580,200 1590,500 1620,900 L1920,900 Z'}
          fill="#DC2626"
          {...ink}
        />
      ))}
      <path d="M0,0 L1920,0 L1920,90 C1500,140 420,140 0,90 Z" fill="#B91C1C" {...ink} />
      <path d="M0,90 C420,140 1500,140 1920,90" fill="none" stroke={TONES.gold} strokeWidth={14} />
    </svg>
  );
};

const PlainSet: React.FC<{tint: string}> = ({tint}) => {
  const frame = useCurrentFrame();
  const grad = useSvgId('plain-grad');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id={grad} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor={lighten(tint, 0.45)} />
          <stop offset="1" stopColor={tint} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${grad})`} />
      <g transform={`translate(960 520) rotate(${frame * 0.15})`} opacity={0.18}>
        {Array.from({length: 18}, (_, i) => (
          <path key={i} d="M0,0 L-90,-1400 L90,-1400 Z" fill={PALETTE.white} transform={`rotate(${i * 20})`} />
        ))}
      </g>
      {Array.from({length: 14}, (_, r) =>
        Array.from({length: 24}, (_, c) => <circle key={`${r}-${c}`} cx={c * 84 + (r % 2) * 42} cy={r * 84} r={7} fill={darken(tint, 0.25)} opacity={0.12} />),
      )}
    </svg>
  );
};

const ClassroomSet: React.FC<{text?: string}> = ({text}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <rect width={W} height={H} fill="#FDE68A" />
    <rect x={0} y={760} width={W} height={20} fill="#F59E0B" opacity={0.5} />
    <rect x={360} y={110} width={1200} height={520} rx={18} fill="#B45309" {...ink} />
    <rect x={390} y={140} width={1140} height={460} rx={8} fill="#14532D" {...ink} strokeWidth={INK.medium} />
    {text ? (
      <text x={960} y={400} textAnchor="middle" fontFamily={FONTS.display} fontSize={96} fill="#F8FAFC" opacity={0.92} letterSpacing={3}>
        {text}
      </text>
    ) : null}
    <rect x={420} y={600} width={1080} height={22} rx={6} fill="#92400E" {...ink} strokeWidth={INK.medium} />
    <circle cx={1700} cy={260} r={90} fill={PALETTE.white} {...ink} />
    <path d="M1700,260 L1700,200 M1700,260 L1740,280" stroke={PALETTE.ink} strokeWidth={INK.bold} strokeLinecap="round" />
    <rect x={0} y={950} width={W} height={130} fill="#C2410C" />
    <line x1={0} y1={950} x2={W} y2={950} stroke={PALETTE.ink} strokeWidth={INK.bold} />
  </svg>
);

const BedroomEpisodeSet: React.FC<{morning: number; time: string}> = ({morning, time}) => (
  <AbsoluteFill>
    <BedroomRoom morning={morning} />
    <Bed layer="back" morning={morning} />
    <Bed layer="front" morning={morning} />
    <Nightstand morning={morning} time={time} />
  </AbsoluteFill>
);

/** The scenery behind the cast, for a set spec. */
export const SetBackdrop: React.FC<{set: SetSpec}> = ({set}) => {
  switch (set.name) {
    case 'bedroom': {
      const morning = set.time === 'morning' || set.time === 'day' ? 1 : 0;
      return <BedroomEpisodeSet morning={morning} time={set.text ?? (morning ? '07:00' : '12:00')} />;
    }
    case 'gut':
      return <GutBackground />;
    case 'body':
      return <BodySet tint={set.tint ?? '#E5487F'} particles={set.particles ?? 'bubbles'} />;
    case 'kitchen':
      return <KitchenSet night={set.time === 'night'} />;
    case 'outdoors':
      return <OutdoorsSet time={set.time === 'night' ? 'night' : set.time === 'sunset' ? 'sunset' : 'day'} />;
    case 'stage':
      return <StageSet />;
    case 'plain':
      return <PlainSet tint={set.tint ?? '#A78BFA'} />;
    case 'classroom':
      return <ClassroomSet text={set.text} />;
  }
};

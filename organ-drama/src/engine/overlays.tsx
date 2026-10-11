import React from 'react';
import {AbsoluteFill, Easing, interpolate, useVideoConfig} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../theme';
import {clamp, pop, tween} from '../utils/animation';
import {useSvgId} from '../utils/useSvgId';
import type {DialOverlay, ListOverlay, MeterOverlay} from './types';

const ink = {stroke: PALETTE.ink, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};

/** Pop in at `local` 0, pop out over the last 8 frames of `duration`. */
const usePop = (local: number, duration: number) => {
  const {fps} = useVideoConfig();
  const enter = pop(local, fps, 0);
  const exit = tween(local, [duration - 8, duration], [1, 0], Easing.in(Easing.back(2)));
  return local >= duration ? 0 : Math.min(enter, exit);
};

/** A gauge whose needle sweeps to `value` of `max`, with the reading underneath. */
export const Dial: React.FC<DialOverlay & {local: number; duration: number; x: number; y: number; scale?: number}> = ({
  value,
  max,
  unit,
  label,
  color = TONES.gold,
  local,
  duration,
  x,
  y,
  scale = 1,
}) => {
  const s = usePop(local, duration);
  const sweep = tween(local, [6, 36], [0, clamp(value / max)], Easing.out(Easing.back(1.4)));
  const shown = Math.round(tween(local, [6, 36], [0, value], Easing.out(Easing.cubic)));
  const r = 150;
  const a = -Math.PI / 2 + sweep * Math.PI * 2;
  if (s <= 0.001) {
    return null;
  }
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s * scale})`, zIndex: 50}}>
      <svg width={420} height={510} viewBox="-210 -270 420 510" overflow="visible">
        {label ? (
          <text y={-236} textAnchor="middle" fontFamily={FONTS.display} fontSize={46} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={10} paintOrder="stroke" letterSpacing={2}>
            {label}
          </text>
        ) : null}
        <circle r={r + 26} fill={color} {...ink} strokeWidth={INK.bold} />
        <circle r={r} fill={PALETTE.white} {...ink} strokeWidth={INK.bold} />
        <path d={`M0,0 L0,${-r} A${r},${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${Math.cos(a) * r},${Math.sin(a) * r} Z`} fill={color} opacity={0.45} />
        {Array.from({length: 12}, (_, i) => {
          const t = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.cos(t) * (r - 8)} y1={Math.sin(t) * (r - 8)} x2={Math.cos(t) * (r - 28)} y2={Math.sin(t) * (r - 28)} stroke={PALETTE.ink} strokeWidth={6} strokeLinecap="round" />;
        })}
        <line x1={0} y1={0} x2={Math.cos(a) * (r - 30)} y2={Math.sin(a) * (r - 30)} stroke={TONES.alarmRed} strokeWidth={12} strokeLinecap="round" />
        <circle r={16} fill={PALETTE.ink} />
        <rect x={-22} y={-r - 62} width={44} height={36} rx={8} fill={color} {...ink} strokeWidth={INK.medium} />
        <g transform={`translate(0 ${r + 70})`}>
          <rect x={-150} y={-44} width={300} height={78} rx={20} fill={PALETTE.ink} />
          <text y={18} textAnchor="middle" fontFamily={FONTS.display} fontSize={60} fill={color} letterSpacing={2}>
            {shown} {unit}
          </text>
        </g>
      </svg>
    </div>
  );
};

/** A vertical tube filling or draining between two percentages. */
export const Meter: React.FC<MeterOverlay & {local: number; duration: number; x: number; y: number}> = ({label, from, to, color = TONES.mint, local, duration, x, y}) => {
  const s = usePop(local, duration);
  const clipId = useSvgId('meter-clip');
  const level = tween(local, [8, 40], [from, to], Easing.inOut(Easing.cubic)) / 100;
  const h = 420;
  const w = 110;
  if (s <= 0.001) {
    return null;
  }
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s})`, zIndex: 50}}>
      <svg width={300} height={600} viewBox="-150 -300 300 600" overflow="visible">
        <text y={-250} textAnchor="middle" fontFamily={FONTS.display} fontSize={48} fill={PALETTE.white} stroke={PALETTE.ink} strokeWidth={10} paintOrder="stroke" letterSpacing={2}>
          {label}
        </text>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w / 2} fill={PALETTE.white} {...ink} strokeWidth={INK.bold} />
        <clipPath id={clipId}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w / 2} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <rect x={-w / 2} y={h / 2 - h * level} width={w} height={h * level} fill={color} />
          <rect x={-w / 2 + 14} y={h / 2 - h * level + 10} width={16} height={Math.max(0, h * level - 30)} rx={8} fill={PALETTE.white} opacity={0.45} />
        </g>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w / 2} fill="none" {...ink} strokeWidth={INK.bold} />
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={w / 2 - 26} x2={w / 2} y1={h / 2 - h * t} y2={h / 2 - h * t} stroke={PALETTE.ink} strokeWidth={5} />
        ))}
        <g transform={`translate(0 ${h / 2 + 56})`}>
          <rect x={-90} y={-36} width={180} height={64} rx={16} fill={PALETTE.ink} />
          <text y={14} textAnchor="middle" fontFamily={FONTS.display} fontSize={48} fill={color}>
            {Math.round(level * 100)}%
          </text>
        </g>
      </svg>
    </div>
  );
};

/** A tip card whose items tick in one by one. */
export const ListPanel: React.FC<ListOverlay & {local: number; duration: number}> = ({title, items, local, duration}) => {
  const {fps} = useVideoConfig();
  const s = usePop(local, duration);
  if (s <= 0.001) {
    return null;
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 960,
        top: 400,
        transform: `translate(-50%, -50%) scale(${s}) rotate(-1.5deg)`,
        background: PALETTE.white,
        border: `7px solid ${PALETTE.ink}`,
        boxShadow: `14px 16px 0 ${PALETTE.ink}`,
        borderRadius: 28,
        padding: '28px 54px 34px',
        minWidth: 760,
        zIndex: 55,
      }}
    >
      <div style={{fontFamily: FONTS.display, fontSize: 70, color: PALETTE.ink, letterSpacing: 2, textAlign: 'center', marginBottom: 12}}>{title}</div>
      {items.map((item, i) => {
        const k = pop(local, fps, 10 + i * 14);
        return (
          <div key={item} style={{display: 'flex', alignItems: 'center', gap: 22, margin: '14px 0', opacity: clamp(k), transform: `translateX(${(1 - k) * -60}px)`}}>
            <div style={{width: 58, height: 58, borderRadius: 16, background: TONES.mint, border: `5px solid ${PALETTE.ink}`, display: 'grid', placeItems: 'center', flex: 'none'}}>
              <svg width={34} height={34} viewBox="0 0 34 34">
                <path d="M5,18 L14,27 L30,7" fill="none" stroke={PALETTE.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{fontFamily: FONTS.body, fontWeight: 800, fontSize: 44, color: PALETTE.ink}}>{item}</div>
          </div>
        );
      })}
    </div>
  );
};

// ── Character effects (world space, around a head) ───────────────────────

export const SweatFX: React.FC<{x: number; y: number; local: number}> = ({x, y, local}) => (
  <svg style={{position: 'absolute', left: x - 60, top: y - 40, overflow: 'visible', zIndex: 40}} width={120} height={160}>
    {[0, 1].map((i) => {
      const t = ((local + i * 14) % 28) / 28;
      return (
        <path
          key={i}
          d="M0,-22 C10,-6 16,4 16,12 C16,22 8,28 0,28 C-8,28 -16,22 -16,12 C-16,4 -10,-6 0,-22 Z"
          transform={`translate(${i === 0 ? 100 : 18} ${20 + t * 70}) scale(${0.9 - i * 0.2})`}
          fill={TONES.tear}
          stroke={PALETTE.ink}
          strokeWidth={4}
          opacity={1 - t}
        />
      );
    })}
  </svg>
);

export const FloatFX: React.FC<{x: number; y: number; local: number; kind: 'hearts' | 'sparkle' | 'steam'}> = ({x, y, local, kind}) => (
  <svg style={{position: 'absolute', left: x - 160, top: y - 220, overflow: 'visible', zIndex: 40}} width={320} height={260}>
    {[0, 1, 2, 3].map((i) => {
      const t = ((local * (kind === 'steam' ? 1.4 : 1) + i * 11) % 44) / 44;
      const px = 160 + (i - 1.5) * 70 + Math.sin(local * 0.15 + i) * 14;
      const py = 230 - t * 200;
      const o = Math.sin(t * Math.PI);
      if (kind === 'hearts') {
        return (
          <path
            key={i}
            d="M0,10 C-22,-6 -14,-26 0,-14 C14,-26 22,-6 0,10 Z"
            transform={`translate(${px} ${py}) scale(${1 + t * 0.5})`}
            fill="#F43F5E"
            stroke={PALETTE.ink}
            strokeWidth={3.5}
            opacity={o}
          />
        );
      }
      if (kind === 'sparkle') {
        return (
          <path
            key={i}
            d="M0,-20 L5,-5 L20,0 L5,5 L0,20 L-5,5 L-20,0 L-5,-5 Z"
            transform={`translate(${px} ${py + 40}) rotate(${local * 4 + i * 30}) scale(${0.6 + o})`}
            fill={TONES.gold}
            stroke={PALETTE.ink}
            strokeWidth={3}
            opacity={o}
          />
        );
      }
      return <circle key={i} cx={px} cy={py} r={16 + t * 26} fill="#F1F5F9" stroke={PALETTE.ink} strokeWidth={4} opacity={o * 0.9} />;
    })}
  </svg>
);

// ── Screen effects ───────────────────────────────────────────────────────

export const FlashFX: React.FC<{local: number}> = ({local}) => {
  const o = interpolate(local, [0, 2, 10], [0, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return o > 0 ? <AbsoluteFill style={{background: PALETTE.white, opacity: o, zIndex: 90}} /> : null;
};

export const AlarmFX: React.FC<{local: number}> = ({local}) => {
  const o = 0.25 + 0.25 * Math.sin(local * 0.5);
  return <AbsoluteFill style={{boxShadow: `inset 0 0 220px 60px rgba(244, 63, 94, ${o})`, zIndex: 85, pointerEvents: 'none'}} />;
};

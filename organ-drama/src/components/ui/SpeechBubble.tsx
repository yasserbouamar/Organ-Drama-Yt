import React from 'react';
import {random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {tween} from '../../utils/animation';
import {burstPath} from '../../utils/geometry';

export interface SpeechBubbleProps {
  /** Bubble centre (px). */
  x: number;
  y: number;
  /** Where the tail points (px). */
  tailX: number;
  tailY: number;
  text: string;
  /** Frame (parent timeline) it pops in, and how long it stays. */
  start: number;
  duration: number;
  variant?: 'speech' | 'thought' | 'shout' | 'whisper';
  fontSize?: number;
  /** A round tally badge on the bubble's corner (e.g. "1"). */
  badge?: string;
  color?: string;
}

/**
 * Bouncy comic speech bubble. Springs out of its tail point, wobbles while
 * it holds, then pops back. `thought` trails circles, `shout` is a spiky
 * burst, `whisper` has a dashed outline.
 */
export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  x,
  y,
  tailX,
  tailY,
  text,
  start,
  duration,
  variant = 'speech',
  fontSize = 54,
  badge,
  color = PALETTE.white,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= start + duration) {
    return null;
  }
  const local = frame - start;
  const enter = spring({frame: local, fps, config: {damping: 10, stiffness: 220}});
  const exit = tween(local, [duration - 7, duration], [1, 0]);
  const s = Math.min(enter, exit);
  const lines = text.split('\n');
  const w = Math.max(...lines.map((l) => l.length)) * fontSize * 0.56 + 90;
  const h = lines.length * fontSize * 1.1 + 56;
  const pad = 60;
  const box = {w: w + pad * 2, h: h + pad * 2};
  const c = {x: box.w / 2, y: box.h / 2};
  // Tail in the bubble's local frame.
  const tx = tailX - x + c.x;
  const ty = tailY - y + c.y;
  const ang = Math.atan2(ty - c.y, tx - c.x);
  const baseHalf = Math.min(w, h) * 0.16;
  const bx = c.x + Math.cos(ang) * (w * 0.32);
  const by = c.y + Math.sin(ang) * (h * 0.32);
  const px = -Math.sin(ang) * baseHalf;
  const py = Math.cos(ang) * baseHalf;
  const wobble = Math.sin(local * 0.2) * 1.5;
  const originX = (tx / box.w) * 100;
  const originY = (ty / box.h) * 100;

  let body: React.ReactNode;
  const stroke = {stroke: PALETTE.ink, strokeWidth: INK.bold, strokeLinejoin: 'round' as const};
  if (variant === 'shout') {
    const d = burstPath(c.x, c.y, Math.max(w, h) * 0.62, Math.max(w, h) * 0.46, 14, (i) => 0.9 + random(`${text}-b-${i}`) * 0.2);
    body = (
      <g transform={`translate(${c.x} ${c.y}) scale(1 ${h / w + 0.15}) translate(${-c.x} ${-c.y})`}>
        <path d={d} fill={PALETTE.ink} transform="translate(8 10)" />
        <path d={d} fill={color} {...stroke} />
      </g>
    );
  } else if (variant === 'thought') {
    const puffs = Array.from({length: 12}, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return {x: c.x + Math.cos(a) * w * 0.42, y: c.y + Math.sin(a) * h * 0.4, r: Math.min(w, h) * 0.24};
    });
    body = (
      <g>
        {[0.35, 0.6].map((t, i) => (
          <circle key={i} cx={c.x + (tx - c.x) * (0.75 + t * 0.3)} cy={c.y + (ty - c.y) * (0.75 + t * 0.3)} r={14 - i * 5} fill={color} {...stroke} />
        ))}
        {puffs.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={color} {...stroke} />
        ))}
        {puffs.map((p, i) => (
          <circle key={`f-${i}`} cx={p.x} cy={p.y} r={p.r - INK.bold / 2} fill={color} />
        ))}
        <ellipse cx={c.x} cy={c.y} rx={w * 0.42} ry={h * 0.4} fill={color} />
      </g>
    );
  } else {
    const tail = `M${bx + px},${by + py} Q${(bx + tx) / 2 + px * 0.3},${(by + ty) / 2 + py * 0.3} ${tx},${ty} Q${(bx + tx) / 2 - px * 0.6},${(by + ty) / 2 - py * 0.6} ${bx - px},${by - py} Z`;
    const dash = variant === 'whisper' ? '14 10' : undefined;
    // Outlined tail and body first, then their fills on top (the body's inset by half
    // the ink) so the seam where they join disappears but the outline keeps its weight.
    body = (
      <g>
        <ellipse cx={c.x + 8} cy={c.y + 10} rx={w / 2} ry={h / 2} fill={PALETTE.ink} />
        <path d={tail} fill={color} {...stroke} strokeDasharray={dash} />
        <ellipse cx={c.x} cy={c.y} rx={w / 2} ry={h / 2} fill={color} {...stroke} strokeDasharray={dash} />
        <path d={tail} fill={color} />
        <ellipse cx={c.x} cy={c.y} rx={w / 2 - INK.bold / 2} ry={h / 2 - INK.bold / 2} fill={color} />
      </g>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x - c.x,
        top: y - c.y,
        width: box.w,
        height: box.h,
        transform: `scale(${s}) rotate(${wobble}deg)`,
        transformOrigin: `${originX}% ${originY}%`,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <svg width={box.w} height={box.h} overflow="visible" style={{position: 'absolute', left: 0, top: 0}}>
        {body}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: box.w,
          height: box.h,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONTS.display,
          fontSize,
          letterSpacing: 2,
          lineHeight: 1.05,
          color: PALETTE.ink,
          textAlign: 'center',
          fontStyle: variant === 'whisper' ? 'italic' : 'normal',
        }}
      >
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      {badge ? (
        <div
          style={{
            position: 'absolute',
            left: c.x + w * 0.38,
            top: c.y - h * 0.62,
            width: 74,
            height: 74,
            borderRadius: '50%',
            background: TONES.alarmRed,
            border: `5px solid ${PALETTE.ink}`,
            boxShadow: `0 0 0 5px ${PALETTE.white}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.display,
            fontSize: 54,
            color: PALETTE.white,
            transform: `scale(${spring({frame: local - 4, fps, config: {damping: 8, stiffness: 260}})}) rotate(10deg)`,
          }}
        >
          {badge}
        </div>
      ) : null}
    </div>
  );
};

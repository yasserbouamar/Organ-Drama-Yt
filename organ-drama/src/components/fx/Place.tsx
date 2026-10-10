import React from 'react';
import type {Pose} from '../../types/characters';

export interface PlaceProps extends Pose {
  /** Which point of the child sits on (x, y): its centre or its bottom-centre. */
  anchor?: 'center' | 'bottom';
  zIndex?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Positions a puppet or prop in a shot. Squash & stretch preserves volume:
 * `squash` 1.2 → 20% taller and proportionally thinner.
 */
export const Place: React.FC<PlaceProps> = ({
  x,
  y,
  scale = 1,
  rotation = 0,
  squash = 1,
  flipX = false,
  opacity = 1,
  anchor = 'center',
  zIndex,
  style,
  children,
}) => {
  const sy = scale * Math.sqrt(squash);
  const sx = (scale / Math.sqrt(squash)) * (flipX ? -1 : 1);
  const origin = anchor === 'bottom' ? '50% 100%' : '50% 50%';
  const shift = anchor === 'bottom' ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)';
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `${shift} rotate(${rotation}deg) scale(${sx}, ${sy})`,
        transformOrigin: origin,
        opacity,
        zIndex,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

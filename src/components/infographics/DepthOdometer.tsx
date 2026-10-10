import React from 'react';
import {FONTS, INK, PALETTE, TONES} from '../../theme';
import {Sticker} from '../comic/Sticker';

export interface DepthOdometerProps {
  /** Current depth in miles. */
  miles: number;
  /** Number of rolling digit wheels. */
  digits?: number;
  /** Width in px. */
  width?: number;
}

/** Earth's layers by depth (miles). */
export const EARTH_LAYERS = [
  {name: 'CRUST', from: 0, to: 25, color: TONES.crust},
  {name: 'MANTLE', from: 25, to: 1800, color: TONES.mantle},
  {name: 'OUTER CORE', from: 1800, to: 3200, color: TONES.outerCore},
  {name: 'INNER CORE', from: 3200, to: 3959, color: TONES.innerCore},
] as const;
const CENTER_MILES = 3959;

const DIGIT_H = 92;

/**
 * Position of one odometer wheel: whole digit plus a roll fraction. Higher
 * wheels only roll while every wheel below them is passing 9 → 0.
 */
const wheel = (value: number, place: number): number => {
  const unit = 10 ** place;
  const digit = Math.floor(value / unit) % 10;
  if (place === 0) {
    return digit + (value - Math.floor(value));
  }
  const below = value % unit;
  const roll = Math.max(0, below - (unit - 1));
  return digit + roll;
};

/** Mechanical rolling miles counter with a layer readout and a depth strip. */
export const DepthOdometer: React.FC<DepthOdometerProps> = ({miles, digits = 4, width = 470}) => {
  const value = Math.max(0, miles);
  const layer = EARTH_LAYERS.find((l) => value < l.to) ?? EARTH_LAYERS[EARTH_LAYERS.length - 1];
  const scale = width / 470;
  const wheels = Array.from({length: digits}, (_, i) => digits - 1 - i);

  return (
    <div style={{width}}>
      <Sticker bleed={0.15}>
        <div
          style={{
            background: PALETTE.comicNavy,
            border: `${INK.bold}px solid ${PALETTE.ink}`,
            borderRadius: 22 * scale,
            padding: `${14 * scale}px ${20 * scale}px ${18 * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10 * scale,
          }}
        >
          <div style={{fontFamily: FONTS.display, fontSize: 40 * scale, letterSpacing: 4, color: PALETTE.hazardYellow, lineHeight: 1}}>
            DEPTH
          </div>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 6 * scale}}>
            {wheels.map((place, i) => (
              <React.Fragment key={place}>
                {place === 2 && i > 0 ? (
                  <div style={{fontFamily: FONTS.body, fontWeight: 900, fontSize: 64 * scale, color: PALETTE.white, lineHeight: 1, marginBottom: 6 * scale}}>,</div>
                ) : null}
                <div
                  style={{
                    width: 66 * scale,
                    height: DIGIT_H * scale,
                    overflow: 'hidden',
                    background: PALETTE.white,
                    border: `${INK.medium}px solid ${PALETTE.ink}`,
                    borderRadius: 10 * scale,
                    position: 'relative',
                    boxShadow: 'inset 0 14px 10px -8px rgba(0,0,0,0.35), inset 0 -14px 10px -8px rgba(0,0,0,0.35)',
                  }}
                >
                  <div style={{transform: `translateY(${-wheel(value, place) * DIGIT_H * scale}px)`}}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
                      <div
                        key={j}
                        style={{
                          height: DIGIT_H * scale,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: FONTS.body,
                          fontWeight: 900,
                          fontSize: 68 * scale,
                          color: PALETTE.ink,
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            ))}
            <div style={{fontFamily: FONTS.display, fontSize: 54 * scale, color: PALETTE.electricCyan, marginLeft: 8 * scale, lineHeight: 1, marginBottom: 6 * scale}}>
              MI
            </div>
          </div>
          {/* Depth strip: surface → centre of the Earth */}
          <div style={{position: 'relative', width: '100%', height: 30 * scale, marginTop: 4 * scale}}>
            <div style={{display: 'flex', height: '100%', border: `${INK.medium}px solid ${PALETTE.ink}`, borderRadius: 8 * scale, overflow: 'hidden'}}>
              {EARTH_LAYERS.map((l) => (
                <div key={l.name} style={{flexGrow: Math.max(60, l.to - l.from), flexBasis: 0, background: l.color, borderRight: `3px solid ${PALETTE.ink}`}} />
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                top: -10 * scale,
                left: `${(stripPosition(value) * 100).toFixed(2)}%`,
                width: 0,
                height: 0,
                borderLeft: `${12 * scale}px solid transparent`,
                borderRight: `${12 * scale}px solid transparent`,
                borderTop: `${18 * scale}px solid ${PALETTE.white}`,
                transform: 'translateX(-50%)',
                filter: `drop-shadow(0 0 2px ${PALETTE.ink})`,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: 900,
              fontSize: 26 * scale,
              letterSpacing: 2,
              color: PALETTE.ink,
              background: layer.color,
              border: `${INK.medium}px solid ${PALETTE.ink}`,
              borderRadius: 999,
              padding: `${4 * scale}px ${18 * scale}px`,
            }}
          >
            {layer.name}
          </div>
        </div>
      </Sticker>
    </div>
  );
};

/** Marker position along the strip, which gives thin layers a minimum width. */
const stripPosition = (miles: number): number => {
  const weights = EARTH_LAYERS.map((l) => Math.max(60, l.to - l.from));
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < EARTH_LAYERS.length; i++) {
    const l = EARTH_LAYERS[i];
    if (miles <= l.to || i === EARTH_LAYERS.length - 1) {
      const t = Math.min(1, Math.max(0, (miles - l.from) / (l.to - l.from)));
      return (acc + t * weights[i]) / total;
    }
    acc += weights[i];
  }
  return Math.min(1, miles / CENTER_MILES);
};

import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {BrainCharacter} from '../components/characters/BrainCharacter';
import {HeartCharacter} from '../components/characters/HeartCharacter';
import {LetterCharacter} from '../components/characters/LetterCharacter';
import {PizzaSlice} from '../components/characters/PizzaSlice';
import {StomachCharacter} from '../components/characters/StomachCharacter';
import {FONTS, PALETTE} from '../theme';

const Cell: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
    {children}
    <div style={{fontFamily: FONTS.body, fontWeight: 800, fontSize: 18, color: PALETTE.ink}}>{label}</div>
  </div>
);

/** Every puppet on one model sheet, for checking art, expressions and rigs. */
export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame % 90) / 90;
  return (
    <AbsoluteFill style={{background: '#FDF2F8', padding: 30}}>
      <div style={{display: 'flex', gap: 24, alignItems: 'flex-end'}}>
        <Cell label="brain · sneaky">
          <BrainCharacter size={220} expression="sneaky" look={{x: Math.sin(frame * 0.3), y: 0}} />
        </Cell>
        <Cell label="brain · excited">
          <BrainCharacter size={220} expression="excited" mouth="open" leftArm={{angle: 150, bend: 20}} rightArm={{angle: 150, bend: 20}} />
        </Cell>
        <Cell label="brain · chewing">
          <BrainCharacter size={220} expression="chewing" />
        </Cell>
        <Cell label="brain · sleeping">
          <BrainCharacter size={220} expression="sleeping" />
        </Cell>
        <Cell label="pizza · cool">
          <PizzaSlice size={170} wave={1} mouth="smile" />
        </Cell>
        <Cell label="pizza · bitten">
          <PizzaSlice size={170} bite={0.5} glasses={false} mouth="o" />
        </Cell>
        <Cell label="letter · run">
          <LetterCharacter size={220} expression="worried" mouth="o" run={1} />
        </Cell>
      </div>
      <div style={{display: 'flex', gap: 24, alignItems: 'flex-end', marginTop: 20}}>
        <Cell label="stomach · sleepy, locked">
          <StomachCharacter size={340} expression="sleepy" mouth="yawn" lockShow={1} lockClosed={1} slices={1} />
        </Cell>
        <Cell label="stomach · bloated">
          <StomachCharacter size={340} expression="shocked" mouth="open" bloat={0.8} slices={3 + t} acidLevel={0.45} />
        </Cell>
        <Cell label="stomach · tilted 90°">
          <div style={{transform: 'rotate(-90deg)'}}>
            <StomachCharacter size={300} expression="crying" mouth="wobbly" tilt={-90} slosh={1} slices={4} valveOpen={1} lockShow={1} lockClosed={1} lockBroken={1} acidLevel={0.5} />
          </div>
        </Cell>
        <Cell label="heart · irritated / panic">
          <HeartCharacter size={250} expression="irritated" mouth="teeth" panic={1} />
        </Cell>
        <Cell label="heart · crossed">
          <HeartCharacter size={250} expression="grumpy" mouth="frown" armsCrossed />
        </Cell>
      </div>
    </AbsoluteFill>
  );
};

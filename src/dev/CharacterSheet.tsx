import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HalftoneBackground} from '../components/comic/HalftoneBackground';
import {Place} from '../components/comic/Place';
import {EarthCharacter} from '../components/characters/EarthCharacter';
import {GravityCharacter} from '../components/characters/GravityCharacter';
import {RocketCharacter} from '../components/characters/RocketCharacter';
import {SatelliteCharacter} from '../components/characters/SatelliteCharacter';
import {SunCharacter} from '../components/characters/SunCharacter';

/** Model sheet for checking puppets in the Studio. Not part of the pilot. */
export const CharacterSheet: React.FC = () => {
  return (
    <AbsoluteFill>
      <HalftoneBackground accent={{color: '#000', spacing: 22, radius: 6, opacity: 0.35}} />
      <Place x={330} y={300}>
        <SunCharacter size={500} hammer={{hand: {x: 700, y: 330}, angle: 40}} glassesDrop={0.6} />
      </Place>
      <Place x={960} y={290}>
        <EarthCharacter size={440} notice={1} expression="scared" boil={0.7} steam={1} dryness={0.4} />
      </Place>
      <Place x={1600} y={300}>
        <GravityCharacter size={380} arms={{left: {x: 60, y: -120}, right: {x: 460, y: -120}}} />
      </Place>
      <Place x={300} y={810}>
        <SatelliteCharacter size={420} expression="scared" tremble={1} wingAngle={10} />
      </Place>
      <Place x={760} y={810}>
        <SatelliteCharacter size={420} expression="crying" mouth="screaming" wingAngle={-20} />
      </Place>
      <Place x={1200} y={800}>
        <SatelliteCharacter size={420} expression="happy" mouth="smile" wingAngle={70} aura={1} />
      </Place>
      <Place x={1650} y={800}>
        <EarthCharacter size={400} expression="happy" doorOpen={0.8} cutaway={1} />
      </Place>
      <Place x={960} y={560} scale={0.6}>
        <RocketCharacter expression="happy" mouth="smile" leftArm={{angle: 160, glove: 'thumbsUp'}} />
      </Place>
    </AbsoluteFill>
  );
};

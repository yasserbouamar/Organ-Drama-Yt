import React from 'react';
import {Composition, Folder} from 'remotion';
import {CosmicEvictionPilot, defaultPilotProps} from './CosmicEvictionPilot';
import {assertScriptIntegrity, TOTAL_FRAMES} from './data/script60s';
import {CharacterSheet} from './dev/CharacterSheet';
import {loadComicFonts} from './fonts';
import {VIDEO} from './theme';

loadComicFonts();
assertScriptIntegrity();

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CosmicEvictionPilot"
        component={CosmicEvictionPilot}
        durationInFrames={TOTAL_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={defaultPilotProps}
      />
      <Folder name="Dev">
        <Composition
          id="CharacterSheet"
          component={CharacterSheet}
          durationInFrames={300}
          fps={VIDEO.fps}
          width={VIDEO.width}
          height={VIDEO.height}
        />
      </Folder>
    </>
  );
};

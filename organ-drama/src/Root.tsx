import React from 'react';
import {Composition, Folder} from 'remotion';
import {assertScriptIntegrity, getScene, sceneLength, TOTAL_FRAMES} from './data/scriptData';
import {CharacterSheet} from './dev/CharacterSheet';
import {ShapeSheet} from './engine/dev/ShapeSheet';
import {episodeFrames} from './engine/EpisodeVideo';
import {EPISODES, EpisodeComposition} from './engine/registry';
import {loadOrganDramaFonts} from './fonts';
import {defaultPilotProps, OrganDramaPilot} from './OrganDramaPilot';
import {REMAKE_FRAMES} from './remake/remakeScript';
import {RemakeTest} from './remake/RemakeTest';
import {Scene1MidnightHeist} from './scenes/Scene1_MidnightHeist';
import {Scene2ValveAndPizza} from './scenes/Scene2_ValveAndPizza';
import {Scene3TwentyMinuteDelay} from './scenes/Scene3_TwentyMinuteDelay';
import {Scene4HeartburnDisaster} from './scenes/Scene4_HeartburnDisaster';
import {Scene5ThreeHourRule} from './scenes/Scene5_ThreeHourRule';
import {VIDEO} from './theme';
import type {SceneId} from './types/dialogue';

loadOrganDramaFonts();
assertScriptIntegrity();

const SCENE_DEV: {id: SceneId; component: React.FC}[] = [
  {id: 1, component: Scene1MidnightHeist},
  {id: 2, component: Scene2ValveAndPizza},
  {id: 3, component: Scene3TwentyMinuteDelay},
  {id: 4, component: Scene4HeartburnDisaster},
  {id: 5, component: Scene5ThreeHourRule},
];

/** Registers the pilot (1920×1080, 30 fps, 1680 frames) plus dev compositions for each scene and the model sheet. */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="OrganDramaPilot"
      component={OrganDramaPilot}
      durationInFrames={TOTAL_FRAMES}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={defaultPilotProps}
    />
    <Folder name="Dev">
      <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={300} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
      <Composition id="ShapeSheet" component={ShapeSheet} durationInFrames={60} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} defaultProps={{page: 0}} />
      {SCENE_DEV.map(({id, component}) => (
        <Composition
          key={id}
          id={`Scene${id}`}
          component={component}
          durationInFrames={sceneLength(getScene(id))}
          fps={VIDEO.fps}
          width={VIDEO.width}
          height={VIDEO.height}
        />
      ))}
    </Folder>
    <Folder name="Episodes">
      {EPISODES.map((entry) => (
        <Composition
          key={entry.slug}
          id={entry.slug}
          component={EpisodeComposition}
          durationInFrames={episodeFrames(entry)}
          fps={VIDEO.fps}
          width={VIDEO.width}
          height={VIDEO.height}
          defaultProps={{slug: entry.slug}}
        />
      ))}
    </Folder>
    <Folder name="Tests">
      <Composition id="ReferenceRemake" component={RemakeTest} durationInFrames={REMAKE_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
    </Folder>
  </>
);

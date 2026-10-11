import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {AudioController} from './audio/AudioController';
import {OrganSubtitles} from './components/ui/OrganSubtitles';
import {SCENES, sceneLength} from './data/scriptData';
import {Scene1MidnightHeist} from './scenes/Scene1_MidnightHeist';
import {Scene2ValveAndPizza} from './scenes/Scene2_ValveAndPizza';
import {Scene3TwentyMinuteDelay} from './scenes/Scene3_TwentyMinuteDelay';
import {Scene4HeartburnDisaster} from './scenes/Scene4_HeartburnDisaster';
import {Scene5ThreeHourRule} from './scenes/Scene5_ThreeHourRule';
import {PALETTE} from './theme';
import type {SceneId} from './types/dialogue';

export type OrganDramaPilotProps = {
  /** Kinetic captions (off: the pilot plays without captions). */
  showSubtitles: boolean;
  /** Gain for the voiceover (1 = as mastered). */
  voiceVolume: number;
  /** Multiplier on the music's ducking curve (1 = 0.15 under dialogue, 0.35 in gaps). */
  musicVolume: number;
  sfxVolume: number;
  music: boolean;
};

export const defaultPilotProps: OrganDramaPilotProps = {
  showSubtitles: false,
  voiceVolume: 1,
  musicVolume: 1,
  sfxVolume: 1,
  music: true,
};

const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  1: Scene1MidnightHeist,
  2: Scene2ValveAndPizza,
  3: Scene3TwentyMinuteDelay,
  4: Scene4HeartburnDisaster,
  5: Scene5ThreeHourRule,
};

/**
 * "Organ Drama: Midnight Pizza" — the master timeline: five scenes joined
 * by hard cuts, and the audio (voiceover, ducked pizzicato score, sound
 * effects). Captions are off unless `showSubtitles` is set.
 */
export const OrganDramaPilot: React.FC<OrganDramaPilotProps> = ({showSubtitles, voiceVolume, musicVolume, sfxVolume, music}) => (
  <AbsoluteFill style={{background: PALETTE.midnight}}>
    {SCENES.map((scene) => {
      const Scene = SCENE_COMPONENTS[scene.id];
      return (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={sceneLength(scene)} name={`Scene ${scene.id}: ${scene.title}`}>
          <Scene />
        </Sequence>
      );
    })}
    {showSubtitles ? <OrganSubtitles /> : null}
    <AudioController voiceVolume={voiceVolume} musicVolume={musicVolume} sfxVolume={sfxVolume} music={music} />
  </AbsoluteFill>
);

import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {ChapterTag} from './components/comic/ChapterTag';
import {PanelWipe} from './components/comic/PanelWipe';
import {ComicSubtitles} from './components/subtitles/ComicSubtitles';
import {SCENES, SCRIPT_60S, TOTAL_FRAMES} from './data/script60s';
import {VOICEOVER} from './data/voiceover.generated';
import {Scene1EvictionNotice} from './scenes/Scene1_EvictionNotice';
import {Scene2HeatLimit} from './scenes/Scene2_HeatLimit';
import {Scene3CoreElevator} from './scenes/Scene3_CoreElevator';
import {Scene4MagneticShield} from './scenes/Scene4_MagneticShield';
import {PALETTE} from './theme';
import type {SceneId} from './types/dialogue';

export type CosmicEvictionPilotProps = {
  showSubtitles: boolean;
  showChapterTags: boolean;
  /** 0..1 gain for the ElevenLabs voiceover clips. */
  voiceoverVolume: number;
  /** Optional music bed inside `public/`, e.g. "music/bed.mp3". */
  musicFile: string | null;
  musicVolume: number;
};

export const defaultPilotProps: CosmicEvictionPilotProps = {
  showSubtitles: true,
  showChapterTags: true,
  voiceoverVolume: 1,
  musicFile: null,
  musicVolume: 0.12,
};

const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  1: Scene1EvictionNotice,
  2: Scene2HeatLimit,
  3: Scene3CoreElevator,
  4: Scene4MagneticShield,
};

/** One <Audio> per line that has a rendered clip in `voiceover.generated.ts`. */
const Voiceover: React.FC<{volume: number}> = ({volume}) => (
  <>
    {SCRIPT_60S.map((line) => {
      const clip = VOICEOVER[line.id];
      if (!clip) {
        return null;
      }
      return (
        <Sequence
          key={line.id}
          from={line.startFrame}
          durationInFrames={Math.min(clip.durationInFrames, TOTAL_FRAMES - line.startFrame)}
          layout="none"
          name={`VO ${line.speaker}: ${line.id}`}
        >
          <Audio src={staticFile(clip.file)} volume={volume} />
        </Sequence>
      );
    })}
  </>
);

/**
 * "Cosmic Eviction (60s Pilot)": the four scenes in sequence, comic panel
 * wipes over each cut, chapter stickers, kinetic captions and voiceover.
 */
export const CosmicEvictionPilot: React.FC<CosmicEvictionPilotProps> = ({
  showSubtitles,
  showChapterTags,
  voiceoverVolume,
  musicFile,
  musicVolume,
}) => {
  return (
    <AbsoluteFill style={{background: PALETTE.comicNavy}}>
      {SCENES.map((scene) => {
        const Scene = SCENE_COMPONENTS[scene.id];
        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames} name={`Scene ${scene.id}: ${scene.title}`}>
            <Scene />
          </Sequence>
        );
      })}

      {showChapterTags
        ? SCENES.map((scene) => (
            <Sequence
              key={`tag-${scene.id}`}
              from={scene.startFrame + (scene.id === 1 ? 0 : 10)}
              durationInFrames={80}
              layout="none"
              name={`Chapter tag ${scene.id}`}
            >
              <ChapterTag
                label={scene.id === 1 ? 'COSMIC EVICTION' : `PART ${scene.id}`}
                title={scene.id === 1 ? `PART 1 · ${scene.title}` : scene.title}
                durationInFrames={80}
              />
            </Sequence>
          ))
        : null}

      {SCENES.slice(1).map((scene) => (
        <PanelWipe key={`wipe-${scene.id}`} at={scene.startFrame} />
      ))}

      {showSubtitles ? <ComicSubtitles /> : null}

      <Voiceover volume={voiceoverVolume} />
      {musicFile ? <Audio src={staticFile(musicFile)} volume={musicVolume} loop /> : null}
    </AbsoluteFill>
  );
};

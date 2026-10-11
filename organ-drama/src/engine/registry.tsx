import React from 'react';
import {EpisodeVideo, type EpisodeEntry} from './EpisodeVideo';
import {EPISODES} from './episodes.generated';

export {EPISODES};

export const findEpisode = (slug: string): EpisodeEntry => {
  const entry = EPISODES.find((e) => e.slug === slug);
  if (!entry) {
    throw new Error(`No episode "${slug}". Run \`npm run episode -- sync\` after adding episodes/${slug}/episode.ts.`);
  }
  return entry;
};

/** Composition component: props stay tiny (just the slug) so the Studio stays fast. */
export const EpisodeComposition: React.FC<{slug: string}> = ({slug}) => <EpisodeVideo entry={findEpisode(slug)} />;

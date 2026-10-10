import {getRemotionEnvironment, getStaticFiles} from 'remotion';

let index: Set<string> | null = null;

/**
 * Whether `path` (relative to `public/`) exists. Remotion embeds the public
 * folder listing in every bundle, so this works in the Studio and during
 * renders, including an empty `public/` (nothing exists). The Player and
 * server-side code get no listing; there it returns `null` and callers
 * trust their manifest.
 */
export const publicFileExists = (path: string): boolean | null => {
  if (typeof window === 'undefined' || getRemotionEnvironment().isPlayer) {
    return null;
  }
  index ??= new Set(getStaticFiles().map((f) => f.name));
  return index.has(path);
};

/** The first of `candidates` that exists in `public/`, if any. */
export const firstPublicFile = (candidates: readonly string[]): string | null =>
  candidates.find((c) => publicFileExists(c) === true) ?? null;

import {useId} from 'react';

/**
 * A document-unique id safe to use inside `url(#…)`. React's ids contain
 * characters (`:`, `«`) that break SVG references, so they are stripped.
 */
export const useSvgId = (prefix: string): string => {
  const raw = useId();
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
};

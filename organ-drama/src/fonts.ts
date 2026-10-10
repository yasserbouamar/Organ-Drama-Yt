import {loadFont} from '@remotion/fonts';
import bangers from '@fontsource/bangers/files/bangers-latin-400-normal.woff2';
import montserrat700 from '@fontsource/montserrat/files/montserrat-latin-700-normal.woff2';
import montserrat800 from '@fontsource/montserrat/files/montserrat-latin-800-normal.woff2';
import montserrat900 from '@fontsource/montserrat/files/montserrat-latin-900-normal.woff2';

/**
 * Fonts ship inside the bundle (from @fontsource, SIL Open Font License), so
 * renders never depend on network access. `loadFont` holds the render with
 * `delayRender()` until each face is ready.
 */
let loaded = false;

export const loadOrganDramaFonts = (): void => {
  if (loaded) {
    return;
  }
  loaded = true;
  void loadFont({family: 'Bangers', url: bangers, weight: '400'});
  void loadFont({family: 'Montserrat', url: montserrat700, weight: '700'});
  void loadFont({family: 'Montserrat', url: montserrat800, weight: '800'});
  void loadFont({family: 'Montserrat', url: montserrat900, weight: '900'});
};

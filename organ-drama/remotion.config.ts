// Remotion CLI configuration — applies to `remotion studio`, `render` and `still`.
// https://www.remotion.dev/docs/config
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);

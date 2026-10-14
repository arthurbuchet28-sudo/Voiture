import React from 'react';
import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, H, W} from './theme';
import {TOTAL_FRAMES} from './timing';
import {Video} from './Video';

const GREEK = 'U+0370-03FF, U+1F00-1FFF';
const fontHandle = delayRender('Chargement de la police Inter');
Promise.all(
	[400, 600, 800].flatMap((weight) => [
		loadFont({family: 'Inter', url: staticFile(`fonts/inter-latin-${weight}-normal.woff2`), weight: String(weight)}),
		loadFont({family: 'Inter', url: staticFile(`fonts/inter-greek-${weight}-normal.woff2`), weight: String(weight), unicodeRange: GREEK}),
	]),
).then(() => continueRender(fontHandle));

export const Root: React.FC = () => (
	<>
		<Composition id="Temps" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} defaultProps={{subtitles: false}} />
		<Composition
			id="TempsSousTitres"
			component={Video}
			durationInFrames={TOTAL_FRAMES}
			fps={FPS}
			width={W}
			height={H}
			defaultProps={{subtitles: true}}
		/>
	</>
);

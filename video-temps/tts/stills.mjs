// Rend des images fixes à des instants donnés pour vérifier la mise en page.
// Usage : node tts/stills.mjs <dossier_sortie> <secondes...>   (secondes depuis le début de la vidéo)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'TempsSousTitres', browserExecutable});
for (const s of times) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * 30));
	const output = path.join(outDir, `t${String(s).padStart(6, '0')}.jpg`);
	await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 80, browserExecutable});
	console.log(output);
}

import timings from './data/timings.json';
import {FPS} from './theme';

export type Cue = {text: string; start: number; end: number};
export type SceneTiming = {
	id: string;
	audio: string;
	audioDuration: number;
	lead: number;
	duration: number;
	words: {w: string; t: number}[];
	cues: Cue[];
};

export const SCENES = timings as SceneTiming[];
export const sceneFrames = (s: SceneTiming) => Math.round(s.duration * FPS);
export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + sceneFrames(s), 0);

const norm = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/œ/g, 'oe')
		.replace(/[^a-z0-9'-]/g, '');

/**
 * Renvoie l'instant (s, depuis le début de la scène) où la voix off prononce un mot.
 * `mot*` cherche un préfixe ; `n` = n-ième occurrence. Lève une erreur si absent,
 * pour qu'une faute de frappe ne désynchronise jamais silencieusement la vidéo.
 */
export const wordTimer = (s: SceneTiming) => (word: string, n = 1): number => {
	const prefix = word.endsWith('*');
	const target = norm(prefix ? word.slice(0, -1) : word);
	let k = 0;
	for (const x of s.words) {
		const v = norm(x.w);
		if (prefix ? v.startsWith(target) : v === target) {
			k++;
			if (k === n) return x.t;
		}
	}
	throw new Error(`Mot « ${word} » (#${n}) introuvable dans ${s.id}`);
};

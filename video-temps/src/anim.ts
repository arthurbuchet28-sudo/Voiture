import {Easing} from 'remotion';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const inOut = Easing.inOut(Easing.cubic);
const outBack = Easing.out(Easing.back(1.6));
const outCubic = Easing.out(Easing.cubic);

/** Progression 0→1, adoucie, entre a et a+d (en secondes). */
export const p = (t: number, a: number, d = 0.6) => inOut(clamp01((t - a) / d));
/** Progression décélérée. */
export const po = (t: number, a: number, d = 0.6) => outCubic(clamp01((t - a) / d));
/** Progression linéaire. */
export const lin = (t: number, a: number, d: number) => clamp01((t - a) / d);
/** Apparition avec léger rebond (pour des échelles). */
export const pop = (t: number, a: number, d = 0.5) => (t <= a ? 0 : outBack(clamp01((t - a) / d)));
/** Visible entre a et b avec fondus. */
export const win = (t: number, a: number, b: number, f = 0.4) => Math.min(p(t, a, f), 1 - p(t, b, f));

/** Générateur pseudo-aléatoire déterministe (même rendu à chaque image). */
export const rng = (seed: number) => {
	let s = seed % 2147483647;
	if (s <= 0) s += 2147483646;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
};

export const mix = (c1: string, c2: string, k: number) => {
	const a = parseInt(c1.slice(1), 16);
	const b = parseInt(c2.slice(1), 16);
	const ch = (sh: number) => Math.round(lerp((a >> sh) & 255, (b >> sh) & 255, clamp01(k)));
	return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

import React, {useMemo} from 'react';
import {clamp01, lerp, rng} from '../anim';
import {C} from '../theme';

/* ------------------------------------------------------------------ Œuf */

const EGG_W = 30;
const EGG_H = 40;
const eggPoint = (a: number) => {
	// Contour d'œuf : plus pointu en haut.
	const x = Math.sin(a) * EGG_W;
	const y = -Math.cos(a) * EGG_H * (Math.cos(a) > 0 ? 1.12 : 0.88);
	return [x, y] as const;
};
const EGG_PATH = (() => {
	const pts = Array.from({length: 64}, (_, i) => eggPoint((i / 64) * Math.PI * 2));
	return 'M ' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ') + ' Z';
})();

type Shard = {pts: string; vx: number; vy: number; vr: number; cx: number; cy: number};

/**
 * Œuf qui tombe d'une table et se brise. Coordonnées locales : bord de la table en (0,0),
 * sol à y = floor. `u` = secondes écoulées depuis la poussée (peut décroître : lecture à l'envers).
 */
export const Egg: React.FC<{u: number; floor?: number}> = ({u, floor = 300}) => {
	const shards = useMemo<Shard[]>(() => {
		const r = rng(7);
		const n = 9;
		return Array.from({length: n}, (_, i) => {
			const a0 = (i / n) * Math.PI * 2;
			const a1 = ((i + 1) / n) * Math.PI * 2;
			const pts: (readonly [number, number])[] = [];
			for (let k = 0; k <= 4; k++) pts.push(eggPoint(lerp(a0, a1, k / 4)));
			const inner1 = [(pts[4][0] * 0.35 + (r() - 0.5) * 8), pts[4][1] * 0.35 + (r() - 0.5) * 8] as const;
			const inner2 = [(pts[0][0] * 0.4 + (r() - 0.5) * 8), pts[0][1] * 0.4 + (r() - 0.5) * 8] as const;
			const all = [...pts, inner1, inner2];
			const cx = all.reduce((s, q) => s + q[0], 0) / all.length;
			const cy = all.reduce((s, q) => s + q[1], 0) / all.length;
			return {
				pts: all.map(([x, y]) => `${(x - cx).toFixed(1)},${(y - cy).toFixed(1)}`).join(' '),
				cx,
				cy,
				vx: (Math.sin((a0 + a1) / 2) * 0.8 + (r() - 0.5) * 0.6) * 260,
				vy: -160 - r() * 260,
				vr: (r() - 0.5) * 900,
			};
		});
	}, []);

	const y0 = -EGG_H * 0.88;
	const tRoll = 0.3;
	const tImpact = 0.78;
	if (u < tImpact) {
		let x = -45;
		let y = y0;
		let rot = 0;
		if (u > 0 && u <= tRoll) {
			const k = u / tRoll;
			x = -45 + 75 * k * k;
			rot = 70 * k * k;
		} else if (u > tRoll) {
			const k = (u - tRoll) / (tImpact - tRoll);
			x = 30 + 70 * k;
			y = lerp(y0, floor + y0, k * k);
			rot = 70 + 200 * k;
		}
		return (
			<g transform={`translate(${x},${y}) rotate(${rot})`}>
				<path d={EGG_PATH} fill="#F6EBDD" stroke="#C9B9A4" strokeWidth={2} />
				<ellipse cx={-9} cy={-14} rx={6} ry={11} fill="#FFFFFF" opacity={0.6} />
			</g>
		);
	}
	const d = u - tImpact;
	const ix = 104;
	const iy = floor - EGG_H * 0.9;
	const puddle = clamp01(d / 0.5);
	const g = 1100;
	return (
		<g>
			<ellipse cx={ix + 10} cy={floor - 4} rx={140 * Math.sqrt(puddle)} ry={14 * Math.sqrt(puddle)} fill="#F4F7FB" opacity={0.35} />
			<ellipse cx={ix + 4} cy={floor - 8} rx={46 * Math.sqrt(puddle)} ry={13 * Math.sqrt(puddle)} fill={C.orange} />
			<ellipse cx={ix - 6} cy={floor - 12} rx={14 * puddle} ry={4 * puddle} fill="#FFE3B3" opacity={0.8} />
			{shards.map((s, i) => {
				// Trajectoire balistique, arrêt au sol.
				const tLand = (-s.vy + Math.sqrt(s.vy * s.vy + 2 * g * (floor - 6 - iy - s.cy))) / g;
				const tt = Math.min(d, tLand);
				const x = ix + s.cx + s.vx * tt;
				const y = iy + s.cy + s.vy * tt + 0.5 * g * tt * tt;
				const rot = s.vr * tt;
				return (
					<polygon
						key={i}
						points={s.pts}
						transform={`translate(${x},${y}) rotate(${rot})`}
						fill="#F6EBDD"
						stroke="#C9B9A4"
						strokeWidth={1.5}
					/>
				);
			})}
		</g>
	);
};

/* ------------------------------------------------------------ Sablier */

const HG_PATH =
	'M -130 -240 L 130 -240 C 130 -110 18 -60 10 0 C 18 60 130 110 130 240 L -130 240 C -130 110 -18 60 -10 0 C -18 -60 -130 -110 -130 -240 Z';

/**
 * Sablier en coordonnées locales (centre au goulot, hauteur 480).
 * `top` = fraction de sable restant en haut, `flow` = débit visuel (0 = aucun filet).
 */
export const Hourglass: React.FC<{id: string; top: number; flow: number; t: number}> = ({id, top, flow, t}) => {
	const hTop = 214 * Math.cbrt(clamp01(top));
	const bottom = 1 - clamp01(top);
	const hBot = 214 * (1 - Math.cbrt(1 - bottom * 0.98));
	const surface = 236 - hBot;
	const grains = Math.round(4 + flow * 22);
	return (
		<g>
			<defs>
				<clipPath id={`hg-${id}`}>
					<path d={HG_PATH} />
				</clipPath>
			</defs>
			<path d={HG_PATH} fill="rgba(63,224,255,0.06)" />
			<g clipPath={`url(#hg-${id})`}>
				{/* sable du haut : se vide par le centre */}
				<rect x={-140} y={-hTop} width={280} height={hTop} fill={C.orange} />
				<path d={`M -40 ${-hTop - 1} Q 0 ${-hTop + 18 * clamp01(1 - top)} 40 ${-hTop - 1} Z`} fill="rgba(63,224,255,0.06)" />
				{/* sable du bas : tas conique */}
				<path
					d={`M -140 240 L -140 ${surface + 20} Q 0 ${surface - 30 * clamp01(bottom * 3)} 140 ${surface + 20} L 140 240 Z`}
					fill={C.orange}
				/>
				{/* filet de sable */}
				{flow > 0.01 && (
					<>
						<rect x={-1 - flow * 2} y={0} width={2 + flow * 4} height={surface + 5} fill={C.orange} opacity={0.9} />
						{Array.from({length: grains}, (_, i) => {
							const ph = ((t * (1.2 + flow * 1.5) + i / grains) % 1 + 1) % 1;
							return (
								<circle
									key={i}
									cx={Math.sin(i * 12.9) * (3 + flow * 4)}
									cy={ph * surface}
									r={2.2}
									fill="#FFD9A8"
								/>
							);
						})}
					</>
				)}
			</g>
			<path d={HG_PATH} fill="none" stroke={C.cyan} strokeWidth={6} strokeLinejoin="round" />
			<rect x={-160} y={-262} width={320} height={22} rx={8} fill="#3A4E74" stroke={C.cyan} strokeWidth={3} />
			<rect x={-160} y={240} width={320} height={22} rx={8} fill="#3A4E74" stroke={C.cyan} strokeWidth={3} />
		</g>
	);
};

/* -------------------------------------------------- Grille d'espace-temps */

export type GridCam = {cx: number; cy: number; s: number};

/** Projection perspective d'un point (X, Z sur le plan, Y = hauteur). */
export const projectGrid = (X: number, Z: number, Y: number, cam: GridCam) => {
	const q = 1 / (1 + (Z + 10) * 0.035);
	return [cam.cx + X * cam.s * q, cam.cy + (-Z * 0.42 * cam.s - Y * cam.s) * q] as const;
};

/** Profondeur du puits de potentiel à la distance r de la masse. */
export const well = (X: number, Z: number, depth: number, width = 2.2) =>
	-depth / (1 + (X * X + Z * Z) / (width * width));

export const SpacetimeGrid: React.FC<{cam: GridCam; depth: number; n?: number; ext?: number; opacity?: number; strokeW?: number}> = ({
	cam,
	depth,
	n = 22,
	ext = 10,
	opacity = 1,
	strokeW = 2,
}) => {
	const lines: string[] = [];
	const samples = 60;
	for (let i = 0; i <= n; i++) {
		const c = -ext + (2 * ext * i) / n;
		const a: string[] = [];
		const b: string[] = [];
		for (let k = 0; k <= samples; k++) {
			const v = -ext + (2 * ext * k) / samples;
			const [x1, y1] = projectGrid(c, v, well(c, v, depth), cam);
			const [x2, y2] = projectGrid(v, c, well(v, c, depth), cam);
			a.push(`${x1.toFixed(1)},${y1.toFixed(1)}`);
			b.push(`${x2.toFixed(1)},${y2.toFixed(1)}`);
		}
		lines.push(a.join(' '), b.join(' '));
	}
	return (
		<g opacity={opacity}>
			{lines.map((pts, i) => (
				<polyline key={i} points={pts} fill="none" stroke={C.cyan} strokeOpacity={0.45} strokeWidth={strokeW} />
			))}
		</g>
	);
};

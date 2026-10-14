import React from 'react';
import {lerp, p, pop, win} from '../anim';
import {Headings} from '../components/Headings';
import {GridCam, projectGrid, SpacetimeGrid, well} from '../components/Objects';
import {Clock, Person, Plane, T} from '../components/Shapes';
import {CONTINENTS} from '../geo';
import {C} from '../theme';
import {SceneProps} from './types';

const CAM: GridCam = {cx: 900, cy: 520, s: 55};
const DEPTH = 6;
const GRID_CLOCKS = [
	{X: 2.0, Z: -2.5, base: 0.25, label: 'lent'},
	{X: 4.5, Z: -3, base: 0.6, label: ''},
	{X: 8, Z: -3.5, base: 0.97, label: 'rapide'},
];

/** Intègre un débit variable : ∫ rate(τ) dτ de a à t (pas d'une image). */
const integrate = (a: number, t: number, rate: (tau: number) => number) => {
	let s = 0;
	for (let tau = a; tau < t; tau += 1 / 30) s += rate(tau) / 30;
	return s;
};

const GLOBE = {x: 760, y: 560, R: 250};
const polar = (lon: number, lat: number, rot: number) => {
	const r = ((90 - lat) / 105) * GLOBE.R;
	const th = ((lon + rot - 90) * Math.PI) / 180;
	return [GLOBE.x + r * Math.cos(th), GLOBE.y - r * Math.sin(th)] as const;
};

export const S5General: React.FC<SceneProps> = ({t, w}) => {
	const tGrav = w('gravité');
	const tDef = w('déformation');
	const tClose = w('proche');
	const tHead = w('tête');
	const tB = w('mille');
	const tPlanes = w('avions');
	const t59 = w('cinquante-neuf');
	const t273 = w('soixante-treize');
	const tOk = w('Exactement');

	/* ---- Phase A : grille d'espace-temps ---- */
	const oA = win(t, 0.2, tB, 0.8);
	const depth = DEPTH * p(t, tDef, 1.6);
	const fall = p(t, tGrav, 1.4);
	const [mx, my] = projectGrid(0, 0, well(0, 0, depth), CAM);
	const sphereY = lerp(-120, my - 40, fall);

	/* ---- Phase B : tours du monde de Hafele et Keating ---- */
	const oB = p(t, tB + 0.3, 0.8);
	const rot = (t - tB) * 12;
	const lap = 5.2;
	const kE = Math.min(1, Math.max(0, t - tPlanes) / lap);
	const kW = kE;
	const ring = (r: number, a0: number, a1: number) => {
		const pts: string[] = [];
		const n = 80;
		for (let i = 0; i <= n; i++) {
			const a = lerp(a0, a1, i / n);
			pts.push(`${(GLOBE.x + r * Math.cos(a)).toFixed(1)},${(GLOBE.y - r * Math.sin(a)).toFixed(1)}`);
		}
		return pts.join(' ');
	};
	const start = -Math.PI / 2;
	const aE = start + kE * Math.PI * 2; // vers l'est : sens antihoraire vu du pôle Nord
	const aW = start - kW * Math.PI * 2;
	const rE = GLOBE.R + 40;
	const rW = GLOBE.R + 80;
	const count = (target: number, at: number) => Math.round(target * p(t, at, 0.9));

	return (
		<>
			<svg width={1920} height={1080}>
				{/* Phase A */}
				<g opacity={oA}>
					<SpacetimeGrid cam={CAM} depth={depth} opacity={p(t, 0.2, 1)} />
					<circle cx={mx} cy={sphereY} r={56} fill={C.orange} opacity={fall > 0 ? 1 : 0} />
					<circle cx={mx - 18} cy={sphereY - 18} r={17} fill="#FFD9A8" opacity={fall > 0 ? 0.7 : 0} />
					{GRID_CLOCKS.map((c, i) => {
						const [x, y] = projectGrid(c.X, c.Z, well(c.X, c.Z, depth), CAM);
						const rate = (tau: number) => 1 - (1 - c.base) * (DEPTH * p(tau, tDef, 1.6)) / DEPTH;
						const ph = integrate(tClose, t, rate) * 0.5;
						const k = pop(t, tClose + i * 0.25, 0.5);
						return (
							<g key={i} opacity={Math.min(1, k)}>
								<Clock x={x} y={y - 50} r={40} turns={ph / 6} sec={ph} color={i === 0 ? C.orange : C.cyan} />
								{c.label && (
									<T x={x} y={y + 22} size={26} textAnchor="middle" fill={i === 0 ? C.orange : C.cyan}>
										{c.label}
									</T>
								)}
							</g>
						);
					})}
					{/* Tête et pieds */}
					<g opacity={Math.min(1, pop(t, tHead - 0.3, 0.6))}>
						<Person x={1700} y={820} h={300} color="#8FA7CF" />
						<Clock x={1800} y={530} r={30} turns={0} sec={(t - tHead) * 0.6} color={C.orange} />
						<Clock x={1800} y={800} r={30} turns={0} sec={(t - tHead) * 0.5} color={C.cyan} />
						<T x={1800} y={482} size={24} textAnchor="middle" fill={C.orange}>
							+ vite
						</T>
					</g>
				</g>

				{/* Phase B */}
				<g opacity={oB}>
					<circle cx={GLOBE.x} cy={GLOBE.y} r={GLOBE.R} fill="#12305A" stroke={C.cyan} strokeOpacity={0.5} strokeWidth={3} />
					<defs>
						<clipPath id="globe-clip">
							<circle cx={GLOBE.x} cy={GLOBE.y} r={GLOBE.R} />
						</clipPath>
					</defs>
					<g clipPath="url(#globe-clip)">
					{Array.from({length: 5}, (_, i) => (
						<circle key={i} cx={GLOBE.x} cy={GLOBE.y} r={((90 - (75 - i * 15)) / 105) * GLOBE.R} fill="none" stroke={C.cyan} strokeOpacity={0.12} strokeWidth={1.5} />
					))}
					{CONTINENTS.map((poly, i) => (
						<polygon
							key={i}
							points={poly.map(([lon, lat]) => polar(lon, lat, rot).map((v) => v.toFixed(1)).join(',')).join(' ')}
							fill={C.cyan}
							opacity={0.35}
						/>
					))}
					</g>
					<circle cx={GLOBE.x} cy={GLOBE.y} r={5} fill={C.white} />
					<T x={GLOBE.x} y={GLOBE.y - GLOBE.R - 110} size={24} textAnchor="middle" fill={C.muted}>
						vue depuis le pôle Nord
					</T>
					<circle cx={GLOBE.x} cy={GLOBE.y} r={rE} fill="none" stroke={C.orange} strokeOpacity={0.2} strokeWidth={2} strokeDasharray="4 8" />
					<circle cx={GLOBE.x} cy={GLOBE.y} r={rW} fill="none" stroke={C.cyan} strokeOpacity={0.2} strokeWidth={2} strokeDasharray="4 8" />
					{kE > 0 && (
						<>
							<polyline points={ring(rE, start, aE)} fill="none" stroke={C.orange} strokeWidth={5} />
							<polyline points={ring(rW, start, aW)} fill="none" stroke={C.cyan} strokeWidth={5} />
						</>
					)}
					<g opacity={p(t, tPlanes - 0.6, 0.5)}>
						<Plane x={GLOBE.x + rE * Math.cos(aE)} y={GLOBE.y - rE * Math.sin(aE)} s={1.4} rot={-(aE * 180) / Math.PI} color={C.orange} />
						<Plane x={GLOBE.x + rW * Math.cos(aW)} y={GLOBE.y - rW * Math.sin(aW)} s={1.4} rot={180 - (aW * 180) / Math.PI} color={C.cyan} />
					</g>

					{/* Résultats */}
					<g opacity={p(t, w('Comparées'), 0.6)}>
						<Clock x={1240} y={360} r={44} turns={t * 0.05} sec={t * 0.5} color={C.white} />
						<T x={1310} y={372} size={30} fill={C.white}>
							horloges restées au sol
						</T>
					</g>
					<g opacity={p(t, t59 - 0.3, 0.5)}>
						<rect x={1180} y={450} width={600} height={100} rx={14} fill={C.panel} stroke={C.orange} strokeWidth={3} />
						<T x={1210} y={514} size={38} weight={800} fill={C.orange}>
							Vers l'est : {count(-59, t59 - 0.3) === 0 ? '0' : `−${Math.abs(count(-59, t59 - 0.3))}`} ns
						</T>
					</g>
					<g opacity={p(t, t273 - 0.5, 0.5)}>
						<rect x={1180} y={580} width={600} height={100} rx={14} fill={C.panel} stroke={C.cyan} strokeWidth={3} />
						<T x={1210} y={644} size={38} weight={800} fill={C.cyan}>
							Vers l'ouest : +{count(273, t273 - 0.5)} ns
						</T>
					</g>
					<g opacity={p(t, tOk, 0.5)}>
						<T x={1210} y={740} size={28} fill={C.green}>
							✓ prédit : −40 ± 23 ns et +275 ± 21 ns
						</T>
					</g>
				</g>
			</svg>
			<Headings
				t={t}
				items={[
					{at: w('Einstein'), text: 'Einstein, 1915 : la gravité courbe le temps', color: C.cyan},
					{at: tClose, text: "Près d'une masse, le temps ralentit", color: C.orange},
					{at: w('Hafele'), text: 'Hafele-Keating, 1971'},
				]}
			/>
		</>
	);
};

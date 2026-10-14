import React, {useMemo} from 'react';
import {lerp, p, pop, rng} from '../anim';
import {Headings} from '../components/Headings';
import {Clock, T} from '../components/Shapes';
import {C} from '../theme';
import {SceneProps} from './types';

const TOP = 210; // 15 km
const GROUND = 860; // 0 km
const PX_KM = (GROUND - TOP) / 15;
const IMPACT = {x: 660, y: TOP};
const SPEED = 520; // px/s à l'écran (ralenti)
const LIFE_PX = 0.66 * PX_KM; // 660 m sans dilatation du temps

export const S4Muons: React.FC<SceneProps> = ({t, w}) => {
	const tRay = w('rayons');
	const tMu = w('muons');
	const tLife = w('microsecondes');
	const t600 = w('six');
	const tPour = w('Pourtant');
	const tDet = w('détecte');
	const t16 = w('seize');

	const muons = useMemo(() => {
		const r = rng(11);
		return Array.from({length: 400}, (_, i) => ({birth: i * 0.07, ang: (r() - 0.5) * 0.5, sp: 0.85 + r() * 0.3}));
	}, []);

	const impactFlash = Math.exp(-Math.max(0, t - tRay - 0.6) * 3) * (t > tRay + 0.6 ? 1 : 0);
	const rayK = p(t, tRay, 0.6);
	let detected = 0;

	const parts = muons.map((m, i) => {
		const born = tMu + m.birth;
		const age = t - born;
		if (age < 0) return null;
		const relativistic = born >= tPour;
		const dir = [Math.sin(m.ang), Math.cos(m.ang)];
		const d = age * SPEED * m.sp;
		const maxD = relativistic ? (GROUND - IMPACT.y) / dir[1] : LIFE_PX;
		if (d >= maxD) {
			const since = (d - maxD) / (SPEED * m.sp);
			if (relativistic) detected++;
			if (since > 0.35) return null;
			const x = IMPACT.x + dir[0] * maxD;
			const y = IMPACT.y + dir[1] * maxD;
			return (
				<circle
					key={i}
					cx={x}
					cy={y}
					r={6 + since * 40}
					fill="none"
					stroke={relativistic ? C.green : C.red}
					strokeWidth={3}
					opacity={1 - since / 0.35}
				/>
			);
		}
		const x = IMPACT.x + dir[0] * d;
		const y = IMPACT.y + dir[1] * d;
		return (
			<g key={i}>
				<line x1={x - dir[0] * 40} y1={y - dir[1] * 40} x2={x} y2={y} stroke={C.cyan} strokeWidth={3} opacity={0.5} />
				<circle cx={x} cy={y} r={6} fill={C.cyan} />
			</g>
		);
	});

	const bar1 = p(t, t600, 0.6);
	const bar2 = p(t, t16 + 0.4, 1.4);
	const detGlow = t > tDet - 1 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 6)) : 0;

	return (
		<>
			<svg width={1920} height={1080}>
				<defs>
					<linearGradient id="atmo" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#0B1426" stopOpacity={0} />
						<stop offset="1" stopColor="#2F6FB5" stopOpacity={0.55} />
					</linearGradient>
				</defs>
				<rect x={260} y={TOP - 20} width={820} height={GROUND - TOP + 20} fill="url(#atmo)" opacity={p(t, 0.2, 1)} />
				<rect x={240} y={GROUND} width={860} height={18} rx={4} fill="#3A5A3F" />

				{/* Échelle d'altitude */}
				<g opacity={p(t, 0.4, 0.8)}>
					<line x1={210} y1={TOP} x2={210} y2={GROUND} stroke={C.muted} strokeWidth={2} />
					{[0, 5, 10, 15].map((km) => (
						<g key={km}>
							<line x1={200} y1={GROUND - km * PX_KM} x2={220} y2={GROUND - km * PX_KM} stroke={C.muted} strokeWidth={2} />
							<T x={190} y={GROUND - km * PX_KM + 9} size={26} textAnchor="end" fill={C.muted}>
								{km} km
							</T>
						</g>
					))}
				</g>

				{/* Rayon cosmique */}
				<g opacity={rayK * (1 - p(t, tRay + 1.5, 0.6))}>
					<line
						x1={lerp(1080, IMPACT.x, 0)}
						y1={TOP - 120}
						x2={lerp(1080, IMPACT.x, rayK)}
						y2={lerp(TOP - 120, IMPACT.y, rayK)}
						stroke={C.orange}
						strokeWidth={6}
						strokeLinecap="round"
					/>
				</g>
				<circle cx={IMPACT.x} cy={IMPACT.y} r={20 + impactFlash * 40} fill={C.orange} opacity={0.25 + 0.6 * impactFlash} />
				<circle cx={IMPACT.x} cy={IMPACT.y} r={10} fill="#FFE7A8" opacity={t > tRay + 0.6 ? 1 : 0} />

				{/* Durée de vie sans dilatation : 660 m */}
				<g opacity={bar1 * (1 - p(t, tPour, 0.5))}>
					<line x1={IMPACT.x - 160} y1={IMPACT.y + LIFE_PX} x2={IMPACT.x + 160} y2={IMPACT.y + LIFE_PX} stroke={C.red} strokeWidth={3} strokeDasharray="8 6" />
					<T x={IMPACT.x + 175} y={IMPACT.y + LIFE_PX + 9} size={26} fill={C.red}>
						fin de vie (~660 m)
					</T>
				</g>

				{parts}

				{/* Détecteur au sol */}
				<rect x={560} y={GROUND - 26} width={200} height={26} rx={6} fill={C.panel} stroke={C.green} strokeWidth={3} />
				<rect x={560} y={GROUND - 26} width={200} height={26} rx={6} fill={C.green} opacity={0.35 * detGlow} />
				<T x={660} y={GROUND + 52} size={26} textAnchor="middle" fill={C.green} opacity={p(t, tPour, 0.5)}>
					détectés : {detected}
				</T>

				{/* Panneau de droite : distances à la même échelle */}
				<g opacity={p(t, tLife, 0.6)}>
					<T x={1460} y={260} size={30} textAnchor="middle" fill={C.white}>
						distance parcourue
					</T>
					<line x1={1180} y1={GROUND} x2={1740} y2={GROUND} stroke={C.muted} strokeWidth={2} />
				</g>
				<g opacity={bar1}>
					<rect x={1220} y={GROUND - LIFE_PX * bar1} width={140} height={LIFE_PX * bar1} fill={C.red} rx={4} />
					<T x={1290} y={GROUND - LIFE_PX - 60} size={30} weight={800} textAnchor="middle" fill={C.red}>
						~660 m
					</T>
					<T x={1290} y={GROUND - LIFE_PX - 22} size={24} textAnchor="middle" fill={C.muted}>
						sans relativité
					</T>
				</g>
				<g opacity={Math.min(1, bar2 * 3)}>
					<rect x={1530} y={GROUND - 10.4 * PX_KM * bar2} width={140} height={10.4 * PX_KM * bar2} fill={C.green} rx={4} />
					<T x={1600} y={GROUND - 10.4 * PX_KM * bar2 - 60} size={30} weight={800} textAnchor="middle" fill={C.green}>
						&gt; 10 km
					</T>
					<T x={1600} y={GROUND - 10.4 * PX_KM * bar2 - 22} size={24} textAnchor="middle" fill={C.muted}>
						avec relativité
					</T>
				</g>

				{/* Horloge interne du muon, 16 fois plus lente */}
				<g opacity={Math.min(1, pop(t, t16 - 0.6, 0.6))}>
					<Clock x={1290} y={480} r={70} turns={t * 0.06} sec={(t - t16) / 16} color={C.cyan} />
					<T x={1290} y={590} size={26} textAnchor="middle" fill={C.cyan}>
						horloge du muon : ×1/16
					</T>
				</g>
			</svg>
			<Headings
				t={t}
				items={[
					{at: tRay, text: 'Rayons cosmiques → muons'},
					{at: tLife, text: 'Muons : 2,2 microsecondes de vie', color: C.cyan},
					{at: t600, text: 'Sans relativité : ~660 m', color: C.red},
					{at: tDet, text: 'Détectés au sol ✓', color: C.green},
					{at: t16, text: 'Avec relativité : > 10 km', color: C.green},
				]}
			/>
		</>
	);
};

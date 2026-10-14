import React, {useMemo} from 'react';
import {lerp, p, pop, rng} from '../anim';
import {Headings} from '../components/Headings';
import {Hourglass} from '../components/Objects';
import {Clock, T} from '../components/Shapes';
import {C} from '../theme';
import {SceneProps} from './types';

const VAC_COLORS = ['#FFB86B', '#5FD3F3', '#9BE58F', '#FF8FA3', '#C7A6FF', '#FFE082', '#7FE0C2'];

/** Petits pictogrammes de souvenirs de vacances. */
const Icon: React.FC<{k: number; x: number; y: number; s: number}> = ({k, x, y, s}) => {
	const c = '#0B1426';
	switch (k % 7) {
		case 0:
			return <circle cx={x} cy={y} r={14 * s} fill={c} />;
		case 1:
			return <path d={`M ${x - 18 * s} ${y + 12 * s} L ${x} ${y - 14 * s} L ${x + 18 * s} ${y + 12 * s} Z`} fill={c} />;
		case 2:
			return <path d={`M ${x - 20 * s} ${y} q ${10 * s} ${-12 * s} ${20 * s} 0 t ${20 * s} 0`} stroke={c} strokeWidth={4 * s} fill="none" />;
		case 3:
			return <path d={`M ${x} ${y - 15 * s} L ${x + 5 * s} ${y - 3 * s} L ${x + 16 * s} ${y - 3 * s} L ${x + 7 * s} ${y + 5 * s} L ${x + 10 * s} ${y + 16 * s} L ${x} ${y + 9 * s} L ${x - 10 * s} ${y + 16 * s} L ${x - 7 * s} ${y + 5 * s} L ${x - 16 * s} ${y - 3 * s} L ${x - 5 * s} ${y - 3 * s} Z`} fill={c} />;
		case 4:
			return (
				<g>
					<rect x={x - 3 * s} y={y} width={6 * s} height={14 * s} fill={c} />
					<circle cx={x} cy={y - 4 * s} r={11 * s} fill={c} />
				</g>
			);
		case 5:
			return <path d={`M ${x - 18 * s} ${y + 4 * s} L ${x + 18 * s} ${y + 4 * s} L ${x + 12 * s} ${y + 14 * s} L ${x - 12 * s} ${y + 14 * s} Z M ${x} ${y + 4 * s} L ${x} ${y - 16 * s} L ${x + 12 * s} ${y} Z`} fill={c} />;
		default:
			return <rect x={x - 12 * s} y={y - 12 * s} width={24 * s} height={24 * s} rx={5 * s} fill={c} />;
	}
};

export const S8Perception: React.FC<SceneProps> = ({t, w}) => {
	const tBrain = w('cerveau');
	const tWait = w('salle');
	const tParty = w('soirée');
	const tBut = w('Mais');
	const tMem = w('souvenirs', 2);
	const tYears = w('années');

	const rate = (tau: number) => {
		if (tau < 0.5) return 0;
		if (tau < tWait) return 0.03;
		if (tau < tParty) return 0.006;
		if (tau < tBut + 0.5) return 0.09;
		return 0.02;
	};
	let used = 0;
	for (let tau = 0; tau < t; tau += 1 / 30) used += rate(tau) / 30;
	const top = Math.max(0.03, 0.95 - used);
	const flow = rate(t) / 0.09;

	const move = p(t, tBut, 1);
	const hgX = lerp(960, 200, move);
	const hgY = lerp(560, 560, move);
	const hgS = lerp(0.88, 0.5, move);

	const oWait = Math.min(1, pop(t, tWait - 0.2, 0.5)) * (1 - p(t, tBut, 0.6));
	const oParty = Math.min(1, pop(t, tParty - 0.2, 0.5)) * (1 - p(t, tBut, 0.6));
	const confetti = useMemo(() => {
		const r = rng(9);
		return Array.from({length: 26}, () => ({x: (r() - 0.5) * 260, sp: 60 + r() * 90, ph: r() * 300, c: VAC_COLORS[Math.floor(r() * 7)], rot: r() * 360}));
	}, []);

	/* ---- Frises : durée réelle vs durée dans le souvenir ---- */
	const oRows = p(t, tBut + 0.6, 0.7);
	const memK = p(t, tMem, 1.6);
	const vacW = lerp(34, 190, memK);
	const rouW = lerp(34, 11, memK);
	const ROW_X = 440;

	/* ---- Échelle des âges : chaque année « pèse » 1/âge ---- */
	const oAge = p(t, tYears - 0.3, 0.7);
	const ages: {age: number; x: number}[] = [];
	{
		const a0 = 5;
		const a1 = 70;
		const L = Math.log(a1 / a0);
		for (let a = a0; a <= a1; a++) ages.push({age: a, x: ROW_X + (1300 * Math.log(a / a0)) / L});
	}
	const ageReveal = p(t, tYears, 2.2);

	return (
		<>
			<svg width={1920} height={1080}>
				{/* Salle d'attente */}
				<g opacity={oWait}>
					<rect x={330} y={470} width={120} height={18} rx={6} fill="#5A6E92" />
					<rect x={340} y={488} width={12} height={110} fill="#5A6E92" />
					<rect x={428} y={488} width={12} height={110} fill="#5A6E92" />
					<rect x={428} y={360} width={18} height={128} rx={6} fill="#5A6E92" />
					<Clock x={390} y={290} r={60} turns={t * 0.004} sec={t * 0.02} color={C.cyan} />
					<T x={390} y={660} size={30} textAnchor="middle" fill={C.cyan}>
						salle d'attente
					</T>
				</g>
				{/* Soirée */}
				<g opacity={oParty}>
					{confetti.map((c, i) => {
						const y = 230 + ((c.ph + t * c.sp) % 380);
						return <rect key={i} x={1530 + c.x} y={y} width={12} height={20} fill={c.c} transform={`rotate(${c.rot + t * 200}, ${1530 + c.x}, ${y})`} />;
					})}
					<path d="M 1470 470 L 1500 470 L 1490 530 L 1480 530 Z" fill="none" stroke={C.orange} strokeWidth={5} />
					<line x1={1485} y1={530} x2={1485} y2={580} stroke={C.orange} strokeWidth={5} />
					<path d="M 1560 470 L 1590 470 L 1580 530 L 1570 530 Z" fill="none" stroke={C.orange} strokeWidth={5} />
					<line x1={1575} y1={530} x2={1575} y2={580} stroke={C.orange} strokeWidth={5} />
					<T x={1530} y={660} size={30} textAnchor="middle" fill={C.orange}>
						soirée entre amis
					</T>
				</g>

				<g transform={`translate(${hgX},${hgY}) scale(${hgS})`} opacity={p(t, 0.2, 0.7)}>
					<Hourglass id="s8" top={top} flow={flow} t={t} />
				</g>

				{/* Frises */}
				<g opacity={oRows}>
					<T x={ROW_X} y={350} size={32} weight={800} fill={C.white}>
						1 semaine de vacances
					</T>
					{Array.from({length: 7}, (_, i) => (
						<g key={i}>
							<rect x={ROW_X + i * (vacW + 6)} y={375} width={vacW} height={90} rx={10} fill={VAC_COLORS[i]} />
							<g opacity={memK}>
								<Icon k={i} x={ROW_X + i * (vacW + 6) + vacW / 2} y={420} s={1.3} />
							</g>
						</g>
					))}
					<T x={ROW_X} y={580} size={32} weight={800} fill={C.white}>
						1 mois de routine
					</T>
					{Array.from({length: 30}, (_, i) => (
						<rect key={i} x={ROW_X + i * (rouW + 4)} y={605} width={rouW} height={90} rx={Math.min(8, rouW / 2)} fill="#4B5B78" />
					))}
					<g>
						<T x={1760} y={350} size={28} textAnchor="end" fill={C.muted} opacity={1 - memK}>
							durée réelle
						</T>
						<T x={1760} y={350} size={28} textAnchor="end" fill={C.orange} opacity={memK}>
							dans le souvenir
						</T>
					</g>
				</g>

				{/* Âge */}
				<g opacity={oAge}>
					<T x={ROW_X - 30} y={835} size={28} textAnchor="end" fill={C.muted}>
						âge
					</T>
					<line x1={ROW_X} y1={820} x2={ROW_X + 1300 * ageReveal} y2={820} stroke={C.muted} strokeWidth={3} />
					{ages.map((a) => {
						if (a.x > ROW_X + 1300 * ageReveal) return null;
						const big = a.age % 10 === 0 && a.age !== 60;
						return (
							<g key={a.age}>
								<line x1={a.x} y1={big ? 796 : 808} x2={a.x} y2={820} stroke={big ? C.cyan : C.muted} strokeWidth={big ? 4 : 2} />
								{big && (
									<T x={a.x} y={866} size={26} textAnchor="middle" fill={C.cyan}>
										{a.age} ans
									</T>
								)}
							</g>
						);
					})}
				</g>
			</svg>
			<Headings
				t={t}
				items={[
					{at: tBrain, text: "Le cerveau n'a pas d'horloge"},
					{at: tWait, text: "Ennui → le temps s'étire", color: C.cyan},
					{at: tParty, text: 'Plaisir → le temps file', color: C.orange},
					{at: tMem - 0.4, text: 'Nouveaux souvenirs = période plus longue'},
				]}
			/>
		</>
	);
};

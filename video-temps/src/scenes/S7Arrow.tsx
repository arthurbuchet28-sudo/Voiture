import React, {useMemo} from 'react';
import {lerp, p, pop, rng} from '../anim';
import {Headings} from '../components/Headings';
import {Egg} from '../components/Objects';
import {T} from '../components/Shapes';
import {C, FONT} from '../theme';
import {SceneProps} from './types';

const TABLE = {x0: 200, x1: 560, y: 520};
const FLOOR = 820;
const BOX = {x: 1150, y: 300, w: 600, h: 400};

const Chip: React.FC<{x: number; y: number; text: string; color: string; opacity: number}> = ({x, y, text, color, opacity}) => (
	<g opacity={opacity}>
		<rect x={x} y={y} width={230} height={56} rx={28} fill={C.panel} stroke={color} strokeWidth={3} />
		<text x={x + 115} y={y + 38} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={color}>
			{text}
		</text>
	</g>
);

export const S7Arrow: React.FC<SceneProps> = ({t, w}) => {
	const tPush = w('pourquoi') + 0.3;
	const tRev = w("l'envers");
	const REW = 2.2;
	const tBox = w('Il');
	const tOpen = w('désordre');
	const tWhole = w('entier');
	const tBreak = w('cassé');
	const tNever = w('jamais');

	// État de l'œuf (u = secondes depuis la poussée).
	let u: number;
	let rewinding = false;
	if (t < tRev) u = t - tPush;
	else if (t < tRev + REW) {
		u = REW - (t - tRev);
		rewinding = true;
	} else if (t < tBreak) u = -1;
	else u = t - tBreak;

	const particles = useMemo(() => {
		const r = rng(3);
		return Array.from({length: 72}, (_, i) => {
			const left = i % 2 === 0;
			return {
				left,
				sx: left ? BOX.x + 30 + r() * (BOX.w / 2 - 60) : BOX.x + BOX.w / 2 + 30 + r() * (BOX.w / 2 - 60),
				sy: BOX.y + 30 + r() * (BOX.h - 60),
				f: [0.3 + r() * 0.5, 0.3 + r() * 0.5, 0.2 + r() * 0.4, 0.2 + r() * 0.4],
				ph: [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28],
			};
		});
	}, []);
	const mixK = p(t, tOpen + 0.2, 8);
	const wall = 1 - p(t, tOpen, 0.4);
	const oBox = p(t, tBox, 0.6);
	const entropy = 0.08 + 0.87 * mixK;

	const vhs = rewinding ? 1 : 0;

	return (
		<>
			<svg width={1920} height={1080}>
				{/* Table et sol */}
				<line x1={140} y1={FLOOR} x2={1020} y2={FLOOR} stroke={C.dim} strokeWidth={4} />
				<rect x={TABLE.x0} y={TABLE.y} width={TABLE.x1 - TABLE.x0} height={18} rx={4} fill="#5B4636" />
				<rect x={TABLE.x0 + 20} y={TABLE.y + 18} width={16} height={FLOOR - TABLE.y - 18} fill="#4A3A2D" />
				<rect x={TABLE.x1 - 36} y={TABLE.y + 18} width={16} height={FLOOR - TABLE.y - 18} fill="#4A3A2D" />

				<g transform={`translate(${TABLE.x1},${TABLE.y}) scale(1.6)`} opacity={p(t, 0.2, 0.6)}>
					<Egg u={u} floor={(FLOOR - TABLE.y) / 1.6} />
				</g>

				{/* Effet « bande rembobinée » */}
				{vhs > 0 && (
					<g>
						<rect x={140} y={230} width={880} height={620} fill="#6A7FA8" opacity={0.12} />
						{Array.from({length: 14}, (_, i) => {
							const y = 230 + ((i * 47 + t * 900) % 620);
							return <rect key={i} x={140} y={y} width={880} height={3} fill={C.white} opacity={0.18} />;
						})}
					</g>
				)}
				<Chip x={180} y={250} text="▶ normal" color={C.green} opacity={t > tPush - 0.3 && t < tRev ? 1 : t >= tBreak ? 1 : 0} />
				<Chip x={180} y={250} text="◀ absurde" color={C.red} opacity={rewinding ? 0.7 + 0.3 * Math.sin(t * 10) : 0} />
				<g opacity={t > tRev + REW && t < tRev + REW + 2.5 ? 1 : 0}>
					<text x={420} y={430} fontFamily={FONT} fontWeight={800} fontSize={90} fill={C.red} opacity={0.5 + 0.5 * Math.sin(t * 8)}>
						?
					</text>
				</g>

				{/* Ordre rare / désordre innombrable */}
				<g opacity={Math.min(1, pop(t, tWhole, 0.5)) * (1 - p(t, tBreak, 0.3))}>
					<T x={TABLE.x1 - 72} y={TABLE.y - 150} size={30} textAnchor="middle" fill={C.cyan}>
						ordre : rare
					</T>
				</g>
				<g opacity={Math.min(1, pop(t, w('milliards'), 0.5))}>
					<T x={840} y={FLOOR - 150} size={30} textAnchor="middle" fill={C.orange}>
						désordre : innombrable
					</T>
				</g>
				<g opacity={p(t, tNever, 0.4)}>
					<path
						d="M -30 0 A 30 40 0 1 1 30 0 A 30 36 0 1 1 -30 0"
						transform={`translate(${TABLE.x1 - 72},${TABLE.y - 56}) scale(1.6)`}
						fill="none"
						stroke={C.muted}
						strokeWidth={3}
						strokeDasharray="6 6"
					/>
					<path
						d={`M ${TABLE.x1 - 112} ${TABLE.y - 106} l 80 80 m 0 -80 l -80 80`}
						stroke={C.red}
						strokeWidth={7}
						strokeLinecap="round"
					/>
				</g>

				{/* Boîte : deux gaz qui se mélangent */}
				<g opacity={oBox}>
					<rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={16} fill={C.panel} stroke={C.muted} strokeWidth={3} />
					<line
						x1={BOX.x + BOX.w / 2}
						y1={BOX.y + 6}
						x2={BOX.x + BOX.w / 2}
						y2={lerp(BOX.y + 6, BOX.y + BOX.h - 6, wall)}
						stroke={C.white}
						strokeWidth={5}
						opacity={wall}
					/>
					{particles.map((pt, i) => {
						const jx = Math.sin(t * pt.f[0] * 3 + pt.ph[0]) * 8;
						const jy = Math.sin(t * pt.f[1] * 3 + pt.ph[1]) * 8;
						const fx = BOX.x + BOX.w / 2 + (BOX.w / 2 - 30) * Math.sin(t * pt.f[2] + pt.ph[2] + i);
						const fy = BOX.y + BOX.h / 2 + (BOX.h / 2 - 30) * Math.sin(t * pt.f[3] * 1.3 + pt.ph[3]);
						const x = lerp(pt.sx + jx, fx, mixK);
						const y = lerp(pt.sy + jy, fy, mixK);
						return <circle key={i} cx={x} cy={y} r={10} fill={pt.left ? C.cyan : C.orange} />;
					})}
					<T x={BOX.x} y={BOX.y + BOX.h + 70} size={28} fill={C.muted}>
						entropie
					</T>
					<rect x={BOX.x + 140} y={BOX.y + BOX.h + 44} width={BOX.w - 140} height={34} rx={17} fill={C.dim} />
					<rect
						x={BOX.x + 140}
						y={BOX.y + BOX.h + 44}
						width={(BOX.w - 140) * entropy}
						height={34}
						rx={17}
						fill="url(#entropyGrad)"
					/>
					<defs>
						<linearGradient id="entropyGrad" x1="0" x2="1">
							<stop offset="0" stopColor={C.cyan} />
							<stop offset="1" stopColor={C.orange} />
						</linearGradient>
					</defs>
				</g>
			</svg>
			<Headings
				t={t}
				items={[
					{at: w('pourquoi'), text: "Pourquoi le temps n'a qu'un sens ?"},
					{at: tRev, text: '▶ normal · ◀ absurde', color: C.orange},
					{at: tOpen, text: 'Entropie : le désordre augmente', color: C.cyan},
				]}
			/>
		</>
	);
};

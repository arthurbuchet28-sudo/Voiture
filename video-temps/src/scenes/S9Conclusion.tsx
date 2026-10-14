import React from 'react';
import {lerp, p, pop} from '../anim';
import {Headings} from '../components/Headings';
import {Egg, Hourglass, SpacetimeGrid} from '../components/Objects';
import {Satellite, T} from '../components/Shapes';
import {C, FONT} from '../theme';
import {TITLE} from './S1Twins';
import {SceneProps} from './types';

const TILE_W = 380;
const TILE_H = 360;
const TILE_Y = 470;
const TILES = [
	{x: 330, label: 'Vitesse', color: C.cyan, word: 'vite'},
	{x: 750, label: 'Gravité', color: C.orange, word: 'masses'},
	{x: 1170, label: 'Entropie', color: C.cyan, word: 'désordre'},
	{x: 1590, label: 'Esprit', color: C.orange, word: 'cerveau'},
];

const MiniLightClock: React.FC<{t: number}> = ({t}) => {
	const pass = 3;
	const u = ((t % pass) + pass) % pass;
	const x = -150 + (300 * u) / pass;
	const half = 0.75;
	const b = (v: number) => {
		const k = (((v / half) % 2) + 2) % 2;
		return k < 1 ? k : 2 - k;
	};
	const pts: string[] = [];
	for (let v = 0; v <= u; v += 0.05) pts.push(`${(-150 + (300 * v) / pass).toFixed(1)},${(90 - b(v) * 180).toFixed(1)}`);
	pts.push(`${x.toFixed(1)},${(90 - b(u) * 180).toFixed(1)}`);
	return (
		<g>
			<polyline points={pts.join(' ')} fill="none" stroke={C.orange} strokeWidth={3} opacity={0.8} />
			<rect x={x - 45} y={-102} width={90} height={8} rx={3} fill={C.cyan} />
			<rect x={x - 45} y={94} width={90} height={8} rx={3} fill={C.cyan} />
			<circle cx={x} cy={90 - b(u) * 180} r={8} fill="#FFFFFF" />
		</g>
	);
};

const WarpedClock: React.FC<{x: number; y: number; r: number; t: number; opacity: number}> = ({x, y, r, t, opacity}) => {
	const hand = (ang: number, len: number, bend: number, wdt: number, col: string) => {
		const a = ((ang - 90) * Math.PI) / 180;
		const tx = x + Math.cos(a) * len;
		const ty = y + Math.sin(a) * len;
		const mx = x + Math.cos(a) * len * 0.5 - Math.sin(a) * bend;
		const my = y + Math.sin(a) * len * 0.5 + Math.cos(a) * bend;
		return <path d={`M ${x} ${y} Q ${mx} ${my} ${tx} ${ty}`} stroke={col} strokeWidth={wdt} fill="none" strokeLinecap="round" />;
	};
	return (
		<g opacity={opacity}>
			<ellipse cx={x} cy={y} rx={r * (1.06 + 0.04 * Math.sin(t * 1.3))} ry={r * (1 - 0.05 * Math.sin(t * 1.3))} fill={C.panel} stroke={C.cyan} strokeWidth={8} />
			{Array.from({length: 12}, (_, i) => {
				const a = (i * Math.PI) / 6 + 0.04 * Math.sin(t * 2 + i);
				return (
					<circle key={i} cx={x + Math.cos(a) * r * 0.82} cy={y + Math.sin(a) * r * 0.82} r={i % 3 === 0 ? 7 : 4} fill={C.white} opacity={0.7} />
				);
			})}
			{hand(t * 25, r * 0.5, r * 0.12 * Math.sin(t * 1.7), 10, C.white)}
			{hand(t * 140, r * 0.75, r * 0.2 * Math.sin(t * 1.1 + 1), 7, C.orange)}
			<circle cx={x} cy={y} r={10} fill={C.cyan} />
		</g>
	);
};

export const S9Conclusion: React.FC<SceneProps> = ({t, w}) => {
	const tNon = w('Non');
	const tB = w('ralentit');
	const tC = w('toile') - 0.6;
	const tD = w('prochaine');

	const oTitle = p(t, 0.3, 0.6) * (1 - p(t, tB - 0.4, 0.5));
	const conv = p(t, tC, 1.1);
	const oTiles = 1 - p(t, tC + 0.6, 0.5);
	const oClock = p(t, tC + 0.7, 0.7);
	const up = p(t, tD, 1);
	const clockY = lerp(540, 330, up);
	const clockR = lerp(210, 130, up);
	const satA = t * 1.4;

	return (
		<>
			{/* Rappel de la question, puis la réponse */}
			<div
				style={{
					position: 'absolute',
					left: 140,
					right: 140,
					top: 300,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 800,
					color: C.white,
					opacity: oTitle,
				}}
			>
				<div style={{fontSize: 72, lineHeight: 1.15}}>{TITLE}</div>
				<div
					style={{
						fontSize: 150,
						color: C.orange,
						marginTop: 30,
						opacity: Math.min(1, pop(t, tNon, 0.5)),
						transform: `scale(${pop(t, tNon, 0.5)})`,
					}}
				>
					Non.
				</div>
			</div>

			<svg width={1920} height={1080}>
				<defs>
					{TILES.map((_, i) => (
						<clipPath key={i} id={`tile-${i}`}>
							<rect x={-TILE_W / 2} y={-TILE_H / 2} width={TILE_W} height={TILE_H} rx={24} />
						</clipPath>
					))}
				</defs>
				{TILES.map((tile, i) => {
					const k = pop(t, w(tile.word) - 0.3, 0.6);
					if (k <= 0) return null;
					const x = lerp(tile.x, 960, conv);
					const y = lerp(TILE_Y, 520, conv);
					const s = Math.max(0.001, k * lerp(1, 0.3, conv));
					return (
						<g key={i} transform={`translate(${x},${y}) scale(${s})`} opacity={Math.min(1, k) * oTiles}>
							<rect x={-TILE_W / 2} y={-TILE_H / 2} width={TILE_W} height={TILE_H} rx={24} fill={C.panel} stroke={tile.color} strokeWidth={4} />
							<g clipPath={`url(#tile-${i})`}>
								{i === 0 && <MiniLightClock t={t} />}
								{i === 1 && (
									<g>
										<SpacetimeGrid cam={{cx: 0, cy: -10, s: 15}} depth={3 + Math.sin(t * 2)} n={14} strokeW={1.5} />
										<circle cx={0} cy={-10 + (3 + Math.sin(t * 2)) * 15 / 1.35 - 22} r={22} fill={C.orange} />
									</g>
								)}
								{i === 2 && (
									<g transform="translate(20,-10) scale(0.7)">
										<line x1={-200} y1={0} x2={0} y2={0} stroke="#5B4636" strokeWidth={10} />
										<line x1={-260} y1={200} x2={260} y2={200} stroke={C.dim} strokeWidth={4} />
										<Egg u={(((t - w(tile.word)) % 3.2) + 3.2) % 3.2 - 0.6} floor={200} />
									</g>
								)}
								{i === 3 && (
									<g transform="scale(0.6)">
										<Hourglass id="s9" top={0.85 - (((t * 0.08) % 0.7) + 0.7) % 0.7} flow={0.6} t={t} />
									</g>
								)}
							</g>
							<text x={0} y={TILE_H / 2 + 62} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={tile.color}>
								{tile.label}
							</text>
						</g>
					);
				})}

				<WarpedClock x={960} y={clockY} r={clockR} t={t} opacity={oClock} />
				<g opacity={p(t, tD + 0.6, 0.6)}>
					<ellipse cx={960} cy={clockY} rx={clockR + 110} ry={clockR * 0.42} fill="none" stroke={C.cyan} strokeOpacity={0.35} strokeDasharray="6 8" strokeWidth={2} />
					<Satellite
						x={960 + (clockR + 110) * Math.cos(satA)}
						y={clockY + clockR * 0.42 * Math.sin(satA)}
						s={0.6}
						opacity={Math.sin(satA) < 0 ? 0.5 : 1}
					/>
				</g>
				<g opacity={p(t, w('GPS'), 0.8)}>
					<T x={960} y={640} size={54} weight={800} textAnchor="middle">
						Le temps passe-t-il pareil pour tout le monde ?
					</T>
					<T x={960} y={770} size={110} weight={800} textAnchor="middle" fill={C.orange}>
						Non.
					</T>
				</g>
			</svg>
			<Headings t={t} items={[{at: tC, text: "Le temps n'est pas un décor", until: tD}]} center top={70} size={64} />
		</>
	);
};

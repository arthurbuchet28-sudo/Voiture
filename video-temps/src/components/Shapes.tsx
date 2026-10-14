import React from 'react';
import {mix} from '../anim';
import {C, FONT} from '../theme';

/** Texte SVG avec la typo de la vidéo. */
export const T: React.FC<
	React.SVGProps<SVGTextElement> & {size?: number; weight?: number; children: React.ReactNode}
> = ({size = 30, weight = 600, children, ...rest}) => (
	<text fontFamily={FONT} fontSize={size} fontWeight={weight} fill={C.white} {...rest}>
		{children}
	</text>
);

/**
 * Horloge à aiguilles. `turns` = nombre de tours de la grande aiguille
 * (la petite fait 12 fois moins), `sec` = tours de la trotteuse.
 */
export const Clock: React.FC<{
	x: number;
	y: number;
	r: number;
	turns: number;
	sec?: number;
	color?: string;
	opacity?: number;
	glow?: number;
	face?: string;
}> = ({x, y, r, turns, sec, color = C.cyan, opacity = 1, glow = 0.5, face = C.panel}) => {
	const hand = (deg: number, len: number, w: number, col: string) => {
		const a = ((deg - 90) * Math.PI) / 180;
		return (
			<line
				x1={x - Math.cos(a) * len * 0.15}
				y1={y - Math.sin(a) * len * 0.15}
				x2={x + Math.cos(a) * len}
				y2={y + Math.sin(a) * len}
				stroke={col}
				strokeWidth={w}
				strokeLinecap="round"
			/>
		);
	};
	return (
		<g opacity={opacity}>
			<circle cx={x} cy={y} r={r * 1.12} fill={color} opacity={0.12 * glow} />
			<circle cx={x} cy={y} r={r} fill={face} stroke={color} strokeWidth={Math.max(2, r * 0.06)} />
			{Array.from({length: 12}, (_, i) => {
				const a = (i * Math.PI) / 6;
				const r1 = i % 3 === 0 ? r * 0.76 : r * 0.84;
				return (
					<line
						key={i}
						x1={x + Math.cos(a) * r1}
						y1={y + Math.sin(a) * r1}
						x2={x + Math.cos(a) * r * 0.92}
						y2={y + Math.sin(a) * r * 0.92}
						stroke={C.white}
						strokeOpacity={0.7}
						strokeWidth={Math.max(1.5, r * (i % 3 === 0 ? 0.04 : 0.025))}
						strokeLinecap="round"
					/>
				);
			})}
			{hand((turns / 12) * 360, r * 0.48, Math.max(3, r * 0.07), C.white)}
			{hand(turns * 360, r * 0.72, Math.max(2.5, r * 0.05), C.white)}
			{sec !== undefined && hand(sec * 360, r * 0.8, Math.max(1.5, r * 0.022), color)}
			<circle cx={x} cy={y} r={Math.max(3, r * 0.07)} fill={color} />
		</g>
	);
};

/** Silhouette stylisée. (x, y) = position des pieds. */
export const Person: React.FC<{
	x: number;
	y: number;
	h?: number;
	color: string;
	grey?: number;
	ponytail?: boolean;
	opacity?: number;
	step?: number;
}> = ({x, y, h = 260, color, grey = 0, ponytail = false, opacity = 1, step = 0}) => {
	const u = h / 100;
	const hair = mix('#3B2A1E', '#D9DEE7', grey);
	const leg = Math.sin(step) * 6 * u * 0.3;
	return (
		<g opacity={opacity} transform={`translate(${x},${y})`}>
			<ellipse cx={0} cy={0} rx={22 * u} ry={3 * u} fill="#000" opacity={0.3} />
			{/* jambes */}
			<rect x={-9 * u + leg} y={-46 * u} width={7.5 * u} height={46 * u} rx={3.5 * u} fill={color} />
			<rect x={1.5 * u - leg} y={-46 * u} width={7.5 * u} height={46 * u} rx={3.5 * u} fill={color} />
			{/* buste */}
			<rect x={-13 * u} y={-80 * u} width={26 * u} height={40 * u} rx={10 * u} fill={color} />
			{/* bras */}
			<rect x={-19 * u} y={-77 * u} width={7 * u} height={34 * u} rx={3.5 * u} fill={color} opacity={0.85} />
			<rect x={12 * u} y={-77 * u} width={7 * u} height={34 * u} rx={3.5 * u} fill={color} opacity={0.85} />
			{/* tête */}
			{ponytail && <circle cx={-11 * u} cy={-90 * u} r={5 * u} fill={hair} />}
			<circle cx={0} cy={-91 * u} r={10 * u} fill={color} />
			<path
				d={`M ${-10 * u} ${-92 * u} A ${10 * u} ${10 * u} 0 0 1 ${10 * u} ${-92 * u} Q 0 ${-96 * u} ${-10 * u} ${-92 * u} Z`}
				fill={hair}
			/>
		</g>
	);
};

/** Fusée verticale. (x, y) = base du corps. `flame` 0→1, `t` pour le scintillement. */
export const Rocket: React.FC<{x: number; y: number; s?: number; flame?: number; t?: number; rot?: number}> = ({
	x,
	y,
	s = 1,
	flame = 0,
	t = 0,
	rot = 0,
}) => {
	const fl = flame * (1 + 0.15 * Math.sin(t * 40) + 0.1 * Math.sin(t * 23));
	return (
		<g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
			{fl > 0.01 && (
				<g>
					<path d={`M -26 0 Q 0 ${150 * fl} 26 0 Z`} fill={C.orange} opacity={0.85} />
					<path d={`M -14 0 Q 0 ${90 * fl} 14 0 Z`} fill="#FFE7A8" />
				</g>
			)}
			{/* ailerons */}
			<path d="M -40 -10 L -70 30 L -70 -40 L -40 -90 Z" fill={C.orange} />
			<path d="M 40 -10 L 70 30 L 70 -40 L 40 -90 Z" fill={C.orange} />
			{/* corps */}
			<path d="M -40 0 L -40 -190 Q -40 -270 0 -320 Q 40 -270 40 -190 L 40 0 Z" fill="#DCE6F5" />
			<path d="M -40 -190 Q -40 -270 0 -320 Q 40 -270 40 -190 Z" fill={C.cyan} opacity={0.35} />
			<rect x={-40} y={-14} width={80} height={14} fill="#9FB0CC" />
			<circle cx={0} cy={-170} r={20} fill={C.panel} stroke={C.cyan} strokeWidth={6} />
			<path d="M -8 -10 L -8 -60 L 8 -60 L 8 -10 Z" fill={C.orange} opacity={0.9} />
		</g>
	);
};

/** Satellite (corps + panneaux solaires). */
export const Satellite: React.FC<{x: number; y: number; s?: number; rot?: number; color?: string; opacity?: number}> = ({
	x,
	y,
	s = 1,
	rot = 0,
	color = C.cyan,
	opacity = 1,
}) => (
	<g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={opacity}>
		<rect x={-58} y={-9} width={38} height={18} fill="#2C5B9E" stroke={color} strokeWidth={2} />
		<rect x={20} y={-9} width={38} height={18} fill="#2C5B9E" stroke={color} strokeWidth={2} />
		<line x1={-20} y1={0} x2={20} y2={0} stroke={C.white} strokeWidth={3} />
		<rect x={-12} y={-13} width={24} height={26} rx={4} fill="#E8EEF8" />
		<line x1={0} y1={13} x2={0} y2={24} stroke={C.white} strokeWidth={2.5} />
		<circle cx={0} cy={26} r={4} fill={color} />
	</g>
);

/** Avion vu de dessus, nez vers le haut avant rotation. */
export const Plane: React.FC<{x: number; y: number; s?: number; rot?: number; color: string}> = ({
	x,
	y,
	s = 1,
	rot = 0,
	color,
}) => (
	<g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
		<path
			d="M 0 -22 Q 4 -18 4 -8 L 22 4 L 22 8 L 4 2 L 3 14 L 9 19 L 9 22 L 0 19 L -9 22 L -9 19 L -3 14 L -4 2 L -22 8 L -22 4 L -4 -8 Q -4 -18 0 -22 Z"
			fill={color}
			stroke="#0B1426"
			strokeWidth={1.5}
		/>
	</g>
);

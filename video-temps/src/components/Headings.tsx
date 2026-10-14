import React from 'react';
import {p} from '../anim';
import {C, FONT} from '../theme';

export type HeadingItem = {at: number; text: React.ReactNode; color?: string; until?: number};

/**
 * Titres courts en haut à gauche. Un seul visible à la fois : chaque nouveau titre
 * remplace le précédent avec un fondu/glissement.
 */
export const Headings: React.FC<{
	t: number;
	items: HeadingItem[];
	top?: number;
	left?: number;
	size?: number;
	center?: boolean;
}> = ({t, items, top = 64, left = 110, size = 56, center = false}) => {
	return (
		<>
			{items.map((it, i) => {
				const next = it.until ?? items[i + 1]?.at ?? Infinity;
				const k = p(t, it.at, 0.5);
				const out = p(t, next - 0.15, 0.35);
				const o = Math.min(k, 1 - out);
				if (o <= 0.001) return null;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							top,
							left: center ? 0 : left,
							right: center ? 0 : undefined,
							textAlign: center ? 'center' : 'left',
							fontFamily: FONT,
							fontWeight: 800,
							fontSize: size,
							letterSpacing: -0.5,
							color: it.color ?? C.white,
							opacity: o,
							transform: `translateY(${(1 - k) * 26 - out * 16}px)`,
							textShadow: '0 4px 24px rgba(0,0,0,0.5)',
						}}
					>
						{it.text}
						<div
							style={{
								height: 6,
								width: 140 * k,
								marginTop: 12,
								borderRadius: 3,
								marginLeft: center ? 'auto' : 0,
								marginRight: center ? 'auto' : 0,
								background: `linear-gradient(90deg, ${C.cyan}, ${C.orange})`,
							}}
						/>
					</div>
				);
			})}
		</>
	);
};

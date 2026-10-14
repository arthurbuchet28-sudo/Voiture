import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {rng} from '../anim';
import {C, FPS, H, W} from '../theme';

/** Fond bleu nuit commun à toute la vidéo : dégradé + étoiles qui scintillent et dérivent lentement. */
export const Background: React.FC = () => {
	const t = useCurrentFrame() / FPS;
	const stars = useMemo(() => {
		const r = rng(42);
		return Array.from({length: 240}, () => ({
			x: r() * W,
			y: r() * H,
			s: 0.6 + r() * 1.8,
			ph: r() * 6.28,
			sp: 0.5 + r() * 1.5,
			depth: 0.3 + r() * 0.7,
		}));
	}, []);
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse at 50% 40%, ${C.bg2} 0%, ${C.bg} 65%, #070D1A 100%)`,
			}}
		>
			<svg width={W} height={H}>
				{stars.map((s, i) => {
					const x = (((s.x - t * 6 * s.depth) % W) + W) % W;
					const o = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
					return <circle key={i} cx={x} cy={s.y} r={s.s} fill={C.white} opacity={o * s.depth} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};

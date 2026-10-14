import React from 'react';
import {p} from '../anim';
import {Cue} from '../timing';
import {FONT} from '../theme';

/** Sous-titres de la voix off, incrustés en bas de l'écran (version « sous-titrée »). */
export const Subtitles: React.FC<{t: number; cues: Cue[]}> = ({t, cues}) => {
	const i = cues.findIndex((c, k) => t >= c.start - 0.05 && t < (cues[k + 1]?.start ?? c.end + 0.6) - 0.05);
	if (i < 0) return null;
	const c = cues[i];
	const o = Math.min(p(t, c.start - 0.05, 0.15), 1 - p(t, c.end + 0.45, 0.15));
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 42, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					maxWidth: 1500,
					padding: '10px 26px',
					borderRadius: 10,
					background: 'rgba(4,9,20,0.72)',
					color: '#FFFFFF',
					fontFamily: FONT,
					fontWeight: 600,
					fontSize: 38,
					lineHeight: 1.3,
					textAlign: 'center',
					opacity: o,
				}}
			>
				{c.text}
			</div>
		</div>
	);
};

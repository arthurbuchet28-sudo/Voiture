import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {p} from './anim';
import {Background} from './components/Background';
import {Subtitles} from './components/Subtitles';
import {S1Twins} from './scenes/S1Twins';
import {S2Newton} from './scenes/S2Newton';
import {S3Special} from './scenes/S3Special';
import {S4Muons} from './scenes/S4Muons';
import {S5General} from './scenes/S5General';
import {S6GPS} from './scenes/S6GPS';
import {S7Arrow} from './scenes/S7Arrow';
import {S8Perception} from './scenes/S8Perception';
import {S9Conclusion} from './scenes/S9Conclusion';
import {SceneProps} from './scenes/types';
import {FPS} from './theme';
import {SCENES, SceneTiming, TOTAL_FRAMES, sceneFrames, wordTimer} from './timing';

const COMPONENTS: Record<string, React.FC<SceneProps>> = {
	s1: S1Twins,
	s2: S2Newton,
	s3: S3Special,
	s4: S4Muons,
	s5: S5General,
	s6: S6GPS,
	s7: S7Arrow,
	s8: S8Perception,
	s9: S9Conclusion,
};

const FADE = 0.45;

const Scene: React.FC<{s: SceneTiming; subtitles: boolean}> = ({s, subtitles}) => {
	const t = useCurrentFrame() / FPS;
	const Comp = COMPONENTS[s.id];
	const o = Math.min(p(t, 0, FADE), 1 - p(t, s.duration - FADE, FADE));
	const slide = (1 - p(t, 0, 0.8)) * 30;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{opacity: o, transform: `translateX(${slide}px)`}}>
				<Comp t={t} w={wordTimer(s)} s={s} />
			</AbsoluteFill>
			{subtitles && <Subtitles t={t} cues={s.cues} />}
		</AbsoluteFill>
	);
};

export type VideoProps = {subtitles: boolean};

export const Video: React.FC<VideoProps> = ({subtitles}) => {
	const frame = useCurrentFrame();
	let from = 0;
	const blackOut = interpolate(frame, [TOTAL_FRAMES - 25, TOTAL_FRAMES - 1], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill>
			<Background />
			{SCENES.map((s) => {
				const d = sceneFrames(s);
				const seq = (
					<Sequence key={s.id} from={from} durationInFrames={d} name={s.id}>
						<Scene s={s} subtitles={subtitles} />
						<Sequence from={Math.round(s.lead * FPS)} layout="none">
							<Audio src={staticFile(s.audio)} />
						</Sequence>
					</Sequence>
				);
				from += d;
				return seq;
			})}
			<Audio
				src={staticFile('audio/musique.mp3')}
				volume={(f) =>
					0.1 *
					interpolate(f, [0, 60, TOTAL_FRAMES - 90, TOTAL_FRAMES], [0, 1, 1, 0], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					})
				}
			/>
			<AbsoluteFill style={{background: '#000', opacity: blackOut}} />
		</AbsoluteFill>
	);
};

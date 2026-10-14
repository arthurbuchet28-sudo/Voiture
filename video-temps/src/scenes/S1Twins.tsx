import React from 'react';
import {lerp, lin, p, po, pop} from '../anim';
import {Headings} from '../components/Headings';
import {Clock, Person, Rocket, T} from '../components/Shapes';
import {C, FONT} from '../theme';
import {SceneProps} from './types';

export const TITLE = 'Le temps passe-t-il pareil pour tout le monde\u00A0?';

export const S1Twins: React.FC<SceneProps> = ({t, w}) => {
	const tJ = w('jumeaux');
	const tLea = w('Léa');
	const tHugo = w('Hugo');
	const tEmb = w('embarque');
	const tLaunch = Math.max(w('fusée') + 0.5, tEmb + 1.5);
	const tRev = w('revient');
	const tLand = tRev + 1.6;
	const tAlors = w('Alors');

	// Années écoulées pour Hugo (Terre) et Léa (fusée, γ = 2).
	const yearsH = 10 * lin(t, tLaunch, tLand - tLaunch);
	const yearsL = yearsH / 2;
	const idle = t * 0.04;

	// Léa marche vers la fusée, disparaît dedans, puis ressort au retour.
	const walkIn = p(t, tEmb, 1.3);
	const walkOut = p(t, tLand + 0.3, 1.2);
	const leaX = walkOut > 0 ? lerp(1480, 1120, walkOut) : lerp(1080, 1480, walkIn);
	const leaO = walkOut > 0 ? Math.min(1, walkOut * 3) : 1 - p(t, tEmb + 1.0, 0.3);
	const walking = (walkIn > 0 && walkIn < 1) || (walkOut > 0 && walkOut < 1);

	// Trajectoire de la fusée : décollage puis atterrissage.
	const up = Math.max(0, t - tLaunch);
	let rocketY = 800 - 240 * up * up;
	let flame = t > tLaunch - 0.4 ? 1 : 0;
	if (t > tLaunch + 2.5) {
		rocketY = -600;
		flame = 0;
	}
	if (t > tRev) {
		const k = po(t, tRev, tLand - tRev);
		rocketY = lerp(-500, 800, k);
		flame = k < 1 ? 1 : 0;
	}

	const sceneOut = 1 - p(t, tAlors - 0.2, 0.6);
	const ageH = 30 + Math.floor(yearsH + 1e-6);
	const ageL = 30 + Math.floor(yearsL + 1e-6);

	return (
		<>
			<div style={{position: 'absolute', inset: 0, opacity: sceneOut}}>
				<svg width={1920} height={1080}>
					<g transform="translate(130,0)">
					<line x1={180} y1={800} x2={1740} y2={800} stroke={C.dim} strokeWidth={3} />
					<rect x={1410} y={800} width={140} height={14} rx={4} fill={C.dim} />
					<Rocket x={1480} y={rocketY} s={0.9} flame={flame} t={t} />

					<g transform={`translate(0,0) scale(1)`} opacity={pop(t, tHugo - 0.6, 0.6)}>
						<Person x={640} y={800} color={C.orange} grey={yearsH / 10} />
					</g>
					<g opacity={Math.min(pop(t, tLea - 0.2, 0.6), leaO)}>
						<Person x={leaX} y={800} color={C.cyan} ponytail step={walking ? t * 14 : 0} />
					</g>

					<g opacity={p(t, tJ, 0.6)}>
						<Clock x={640} y={350} r={100} turns={yearsH + idle} sec={t * 0.5} color={C.orange} />
						<T x={640} y={498} size={34} textAnchor="middle" fill={C.orange}>
							Hugo · {ageH} ans
						</T>
						<Clock x={1080} y={350} r={100} turns={yearsL + idle} sec={t * 0.5 - 0.25 * Math.max(0, Math.min(t, tLand) - tLaunch)} color={C.cyan} />
						<T x={1080} y={498} size={34} textAnchor="middle" fill={C.cyan}>
							Léa · {ageL} ans
						</T>
					</g>
					</g>
				</svg>
				<Headings
					t={t}
					items={[
						{at: tJ, text: 'Deux jumeaux. Deux horloges.'},
						{at: w('quatre-vingt-sept'), text: <>Aller-retour à 87 % de <i>c</i></>, color: C.cyan},
						{at: w('dix'), text: '10 ans sur Terre · 5 ans à bord', color: C.orange},
					]}
				/>
			</div>
			{/* Titre de la vidéo, lettre par lettre */}
			<div
				style={{
					position: 'absolute',
					left: 160,
					right: 160,
					top: 380,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 800,
					fontSize: 92,
					lineHeight: 1.15,
					color: C.white,
				}}
			>
				{TITLE.split(' ').map((word, wi, arr) => {
					const offset = arr.slice(0, wi).join(' ').length + (wi ? 1 : 0);
					return (
						<span key={wi} style={{display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.28em'}}>
							{word.split('').map((ch, i) => {
								const k = p(t, tAlors + 0.3 + (offset + i) * 0.035, 0.4);
								return (
									<span key={i} style={{opacity: k, display: 'inline-block', transform: `translateY(${(1 - k) * 20}px)`}}>
										{ch}
									</span>
								);
							})}
						</span>
					);
				})}
				<div
					style={{
						margin: '30px auto 0',
						height: 8,
						borderRadius: 4,
						width: 600 * p(t, tAlors + 1.6, 1),
						background: `linear-gradient(90deg, ${C.cyan}, ${C.orange})`,
					}}
				/>
			</div>
		</>
	);
};

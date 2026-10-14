import React from 'react';
import {lerp, p, pop, win} from '../anim';
import {Headings} from '../components/Headings';
import {Person, Rocket, T} from '../components/Shapes';
import {C} from '../theme';
import {SceneProps} from './types';

const H = 300; // distance entre les miroirs (px)
const HALF = 0.9; // durée d'un trajet miroir → miroir au repos (s)
const BETA = 0.866;
const GAMMA = 2;
const CPX = H / HALF; // « vitesse de la lumière » à l'écran (px/s)

/** Position verticale (0 = miroir du bas, 1 = miroir du haut) d'un photon qui rebondit. */
const bounce = (u: number, half: number) => {
	const k = (((u / half) % 2) + 2) % 2;
	return k < 1 ? k : 2 - k;
};

const Mirrors: React.FC<{x: number; y: number; color: string; flash?: number}> = ({x, y, color, flash = 0}) => (
	<g>
		<rect x={x - 110} y={y - H / 2 - 14} width={220} height={12} rx={4} fill={color} />
		<rect x={x - 110} y={y + H / 2 + 2} width={220} height={12} rx={4} fill={color} />
		<rect x={x - 120} y={y + H / 2 - 4} width={240} height={24} rx={8} fill={color} opacity={0.35 * flash} />
	</g>
);

const Photon: React.FC<{x: number; y: number}> = ({x, y}) => (
	<g>
		<circle cx={x} cy={y} r={26} fill="#FFF6C8" opacity={0.18} />
		<circle cx={x} cy={y} r={13} fill="#FFF6C8" opacity={0.5} />
		<circle cx={x} cy={y} r={7} fill="#FFFFFF" />
	</g>
);

export const S3Special: React.FC<SceneProps> = ({t, w}) => {
	const tC = w('vitesse');
	const tB = w('Construisons');
	const tPhoton = w('grain');
	const tM = w('Maintenant');
	const tD = w('diagonale');
	const tE = w('À');
	const tLong = w('longtemps');

	/* ---- Phase A : la lumière va à la même vitesse pour tous ---- */
	const oA = win(t, 0.2, tB - 0.3, 0.6);
	const rocketX = 260 + 110 * t;

	/* ---- Phase B/C : horloge à lumière au repos ---- */
	const restX = lerp(960, 300, p(t, tM, 0.9));
	const restY = 560;
	const u = Math.max(0, t - tPhoton);
	const restPh = bounce(u, HALF);
	const restTicks = Math.floor(u / (2 * HALF));
	const restFlash = t > tPhoton ? Math.exp(-((u % (2 * HALF)) * 6)) : 0;
	const oRest = win(t, tB, tE, 0.6);

	/* ---- Phase C : horloge en mouvement ---- */
	const oMove = win(t, tM + 0.5, tD + 0.3, 0.5);
	const um = Math.max(0, t - tM - 0.5);
	const pass = (1140 / (BETA * CPX));
	const pi = Math.floor(um / pass);
	const ul = um - pi * pass; // temps depuis le début du passage courant
	const moveX = 620 + BETA * CPX * ul;
	const halfM = HALF * GAMMA;
	const mPh = bounce(um, halfM);
	const moveTicks = Math.floor(um / (2 * halfM));
	const trail: string[] = [];
	{
		const t0 = pi * pass;
		const pts: number[] = [];
		const firstBounce = Math.ceil(t0 / halfM) * halfM;
		pts.push(t0);
		for (let b = firstBounce; b < um; b += halfM) pts.push(b);
		pts.push(um);
		for (const tt of pts) {
			const x = 620 + BETA * CPX * (tt - t0);
			const y = restY + H / 2 - bounce(tt, halfM) * H;
			trail.push(`${x.toFixed(1)},${y.toFixed(1)}`);
		}
	}
	const edgeFade = Math.min(1, ul / 0.4, (pass - ul) / 0.4);

	/* ---- Phase D : le triangle ---- */
	const oD = win(t, tD + 0.3, tE, 0.5);
	const A = [720, 780];
	const B = [720 + Math.sqrt(3) * 320, 780];
	const Cp = [B[0], 780 - 320];
	const kBC = p(t, tD + 0.4, 0.8);
	const kAC = p(t, tD + 1.2, 0.8);
	const kAB = p(t, tD + 2.0, 0.8);
	const ud = Math.max(0, t - tD - 2.4);
	const dPh = bounce(ud, 1.6);
	const dRest = bounce(ud, 0.8);

	/* ---- Phase E : courbe γ(v) ---- */
	const oE = p(t, tE + 0.2, 0.6);
	const gx = (b: number) => 560 + b * 900;
	const gy = (g: number) => 820 - (g - 1) * 110;
	const curveK = p(t, tE + 0.4, 1.2);
	const curve: string[] = [];
	for (let i = 0; i <= 200 * curveK; i++) {
		const b = Math.min(0.979, (i / 200) * 0.979);
		curve.push(`${gx(b).toFixed(1)},${gy(1 / Math.sqrt(1 - b * b)).toFixed(1)}`);
	}
	const cursorB = BETA * p(t, tE + 1.4, 2);
	const cursorG = 1 / Math.sqrt(1 - cursorB * cursorB);
	const showTwo = p(t, w('deux'), 0.5);

	return (
		<>
			<svg width={1920} height={1080}>
				{/* Phase A */}
				<g opacity={oA}>
					<line x1={0} y1={600} x2={1920} y2={600} stroke={C.dim} strokeWidth={2} strokeDasharray="8 10" />
					{Array.from({length: 12}, (_, i) => {
						const x = (t - i * 1.1) * 950 - 60;
						if (x < -60 || x > 2000) return null;
						return (
							<g key={i}>
								<line x1={x - 140} y1={600} x2={x} y2={600} stroke="#FFF6C8" strokeWidth={4} opacity={0.5} />
								<Photon x={x} y={600} />
							</g>
						);
					})}
					<Person x={260} y={820} h={200} color={C.orange} />
					<T x={260} y={862} size={26} textAnchor="middle" fill={C.orange}>
						au sol : mesure c
					</T>
					<Rocket x={rocketX} y={420} s={0.42} rot={90} flame={1} t={t} />
					<T x={rocketX - 40} y={360} size={26} textAnchor="middle" fill={C.cyan}>
						en fusée : mesure c
					</T>
				</g>

				{/* Horloge au repos */}
				<g opacity={oRest}>
					<Mirrors x={restX} y={restY} color={C.cyan} flash={restFlash} />
					<g opacity={p(t, tPhoton, 0.3)}>
						<Photon x={restX} y={restY + H / 2 - restPh * H} />
					</g>
					<T x={restX} y={restY + H / 2 + 70} size={32} textAnchor="middle" fill={C.cyan}>
						au repos · {restTicks} {restTicks > 1 ? "tics" : "tic"}
					</T>
				</g>

				{/* Horloge en mouvement */}
				<g opacity={oMove * edgeFade}>
					<polyline points={trail.join(' ')} fill="none" stroke={C.orange} strokeWidth={4} opacity={0.8} />
					<Mirrors x={moveX} y={restY} color={C.orange} />
					<Photon x={moveX} y={restY + H / 2 - mPh * H} />
				</g>
				<g opacity={oMove}>
					<T x={1190} y={restY + H / 2 + 70} size={32} textAnchor="middle" fill={C.orange}>
						en mouvement · {moveTicks} {moveTicks > 1 ? "tics" : "tic"}
					</T>
					<path d={`M 1050 ${restY - H / 2 - 60} l 260 0 m -24 -14 l 24 14 l -24 14`} stroke={C.orange} strokeWidth={4} fill="none" />
				</g>

				{/* Phase D : triangle */}
				<g opacity={oD}>
					<line x1={B[0]} y1={B[1]} x2={B[0]} y2={lerp(B[1], Cp[1], kBC)} stroke={C.cyan} strokeWidth={7} strokeLinecap="round" />
					<line x1={A[0]} y1={A[1]} x2={lerp(A[0], Cp[0], kAC)} y2={lerp(A[1], Cp[1], kAC)} stroke={C.orange} strokeWidth={7} strokeLinecap="round" />
					<line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], kAB)} y2={A[1]} stroke={C.muted} strokeWidth={4} strokeDasharray="12 10" />
					<rect x={B[0] - 26} y={B[1] - 26} width={26} height={26} fill="none" stroke={C.muted} strokeWidth={2} opacity={kAB} />
					<g opacity={kBC}>
						<T x={B[0] + 30} y={(B[1] + Cp[1]) / 2 - 10} size={34} fill={C.cyan}>
							au repos
						</T>
						<T x={B[0] + 30} y={(B[1] + Cp[1]) / 2 + 30} size={28} fill={C.muted} weight={400}>
							trajet court
						</T>
					</g>
					<g opacity={kAC}>
						<T x={(A[0] + Cp[0]) / 2 - 60} y={(A[1] + Cp[1]) / 2 - 40} size={34} fill={C.orange} textAnchor="end">
							en mouvement
						</T>
						<T x={(A[0] + Cp[0]) / 2 - 60} y={(A[1] + Cp[1]) / 2} size={28} fill={C.muted} weight={400} textAnchor="end">
							trajet long
						</T>
					</g>
					<T x={(A[0] + B[0]) / 2} y={A[1] + 50} size={28} fill={C.muted} textAnchor="middle" opacity={kAB}>
						déplacement de l'horloge
					</T>
					{ud > 0 && (
						<>
							<Photon x={lerp(A[0], Cp[0], dPh)} y={lerp(A[1], Cp[1], dPh)} />
							<Photon x={B[0]} y={lerp(B[1], Cp[1], dRest)} />
						</>
					)}
					<g opacity={p(t, tLong, 0.5)}>
						<rect x={1360} y={300} width={360} height={110} rx={16} fill={C.panel} stroke={C.orange} strokeWidth={3} />
						<T x={1540} y={372} size={46} weight={800} textAnchor="middle" fill={C.white}>
							t = γ · t₀
						</T>
					</g>
				</g>

				{/* Phase E : courbe γ(v) */}
				<g opacity={oE}>
					<line x1={gx(0)} y1={gy(1)} x2={gx(1) + 30} y2={gy(1)} stroke={C.muted} strokeWidth={3} />
					<line x1={gx(0)} y1={gy(1)} x2={gx(0)} y2={gy(5) - 20} stroke={C.muted} strokeWidth={3} />
					<line x1={gx(1)} y1={gy(1)} x2={gx(1)} y2={gy(5) - 20} stroke={C.red} strokeWidth={2} strokeDasharray="6 8" />
					{[0, 0.5, 1].map((b) => (
						<T key={b} x={gx(b)} y={gy(1) + 42} size={26} textAnchor="middle" fill={C.muted}>
							{b === 0.5 ? '0,5' : b}
						</T>
					))}
					{[1, 2, 3, 4, 5].map((g) => (
						<T key={g} x={gx(0) - 20} y={gy(g) + 9} size={26} textAnchor="end" fill={C.muted}>
							{g}
						</T>
					))}
					<T x={gx(1) + 40} y={gy(1) + 10} size={30} fill={C.white}>
						v / c
					</T>
					<T x={gx(0)} y={gy(5) - 36} size={34} fill={C.white} textAnchor="middle">
						γ
					</T>
					<T x={gx(1) - 10} y={gy(5) - 30} size={24} fill={C.red} textAnchor="end">
						vitesse de la lumière
					</T>
					<polyline points={curve.join(' ')} fill="none" stroke={C.cyan} strokeWidth={5} />
					{cursorB > 0.01 && (
						<g>
							<line x1={gx(cursorB)} y1={gy(1)} x2={gx(cursorB)} y2={gy(cursorG)} stroke={C.orange} strokeWidth={2} strokeDasharray="6 6" />
							<line x1={gx(0)} y1={gy(cursorG)} x2={gx(cursorB)} y2={gy(cursorG)} stroke={C.orange} strokeWidth={2} strokeDasharray="6 6" />
							<circle cx={gx(cursorB)} cy={gy(cursorG)} r={12} fill={C.orange} />
						</g>
					)}
					<g opacity={showTwo}>
						<T x={gx(BETA) - 30} y={gy(2) - 30} size={38} weight={800} textAnchor="end" fill={C.orange}>
							87 % de c → γ = 2
						</T>
					</g>
					<g opacity={pop(t, w('Léa'), 0.5) > 0 ? Math.min(1, pop(t, w('Léa'), 0.5)) : 0}>
						<T x={gx(BETA) + 26} y={gy(2) + 50} size={30} fill={C.cyan}>
							voyage de Léa
						</T>
					</g>
				</g>
			</svg>
			<Headings
				t={t}
				items={[
					{at: 0.4, text: 'Einstein, 1905', color: C.cyan},
					{at: tC, text: <>c = 300 000 km/s, pour tous</>},
					{at: tB, text: 'Horloge à lumière', color: C.cyan},
					{at: w('chaque', 2), text: 'Plus vite → temps plus lent', color: C.orange},
					{at: tE, text: 'γ = 1 / √(1 − v²/c²)'},
				]}
			/>
		</>
	);
};

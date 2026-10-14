import React, {useMemo} from 'react';
import {lerp, p, pop, rng, win} from '../anim';
import {Headings} from '../components/Headings';
import {Satellite, T} from '../components/Shapes';
import {C} from '../theme';
import {SceneProps} from './types';

const EARTH = {x: 560, y: 570, r: 95};
// Rayon orbital / rayon terrestre ≈ 26 600 / 6 371 ≈ 4,2 : l'orbite est à l'échelle.
const ORBITS = [
	{rx: 400, ry: 115, tilt: -16},
	{rx: 400, ry: 115, tilt: 22},
];
const SATS = [
	{o: 0, ph: 0.3},
	{o: 0, ph: 2.4},
	{o: 0, ph: 4.4},
	{o: 1, ph: 1.2},
	{o: 1, ph: 3.3},
	{o: 1, ph: 5.3},
];

const satPos = (o: number, phi: number) => {
	const {rx, ry, tilt} = ORBITS[o];
	const lx = rx * Math.cos(phi);
	const ly = ry * Math.sin(phi);
	const a = (tilt * Math.PI) / 180;
	return {x: EARTH.x + lx * Math.cos(a) - ly * Math.sin(a), y: EARTH.y + lx * Math.sin(a) + ly * Math.cos(a), back: Math.sin(phi) < 0};
};

const BAR_X = 1110;
const US = 13; // px par microseconde

export const S6GPS: React.FC<SceneProps> = ({t, w}) => {
	const tAlt = w('vingtaine');
	const tSpeed = w('quatre');
	const tGrav = w('quarante-cinq');
	const tVel = w('sept');
	const tSum = w('Bilan');
	const tOr = w('Or');
	const tCm = w('centimètres');
	const tDrift = w('sans');
	const tFix = w('pourquoi');
	const tSet = w('réglées');

	const oA = win(t, 0.2, tOr, 0.7);
	const oB = p(t, tOr + 0.4, 0.7);

	const sats = SATS.map((s, i) => ({...satPos(s.o, s.ph + t * 0.35), i}));
	const hl = sats[0];

	const g1 = p(t, tGrav - 0.2, 0.9);
	const g2 = p(t, tVel - 0.2, 0.9);
	const g3 = p(t, tSum + 0.3, 0.9);
	const days = t > tSum + 0.8 ? Math.min(30, 1 + Math.floor((t - tSum - 0.8) / 0.25)) : 0;

	/* ---- Carte de ville ---- */
	const city = useMemo(() => {
		const r = rng(5);
		const parks = Array.from({length: 6}, () => ({x: 300 + Math.floor(r() * 18) * 76, y: 250 + Math.floor(r() * 8) * 76}));
		return {parks};
	}, []);
	const here = {x: 700, y: 600};
	const drift = p(t, tDrift, tFix - tDrift - 0.3) * (1 - p(t, tFix + 0.2, 1.2));
	const dir = {x: Math.cos(-0.35), y: Math.sin(-0.35)};
	const dot = {x: here.x + dir.x * 440 * drift, y: here.y + dir.y * 440 * drift};
	const km = Math.round(11 * drift * 10) / 10;

	return (
		<>
			<svg width={1920} height={1080}>
				<defs>
					<clipPath id="earth-clip">
						<circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} />
					</clipPath>
				</defs>
				{/* ---- Phase A : orbites et bilan ---- */}
				<g opacity={oA}>
					{ORBITS.map((o, i) => (
						<ellipse
							key={i}
							cx={EARTH.x}
							cy={EARTH.y}
							rx={o.rx}
							ry={o.ry}
							transform={`rotate(${o.tilt}, ${EARTH.x}, ${EARTH.y})`}
							fill="none"
							stroke={C.cyan}
							strokeOpacity={0.3}
							strokeWidth={2}
							strokeDasharray="6 8"
						/>
					))}
					{sats.filter((s) => s.back).map((s) => (
						<Satellite key={s.i} x={s.x} y={s.y} s={0.55} color={s.i === 0 ? C.orange : C.cyan} opacity={0.6} />
					))}
					<circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r + 12} fill={C.cyan} opacity={0.12} />
					<circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill="#1E5FA8" />
					<g clipPath="url(#earth-clip)">
					<path
						d={`M ${EARTH.x - 60} ${EARTH.y - 50} q 30 -20 50 5 q 20 30 -10 50 q -30 10 -40 -20 Z M ${EARTH.x + 20} ${EARTH.y + 10} q 40 -10 50 20 q -10 40 -40 30 q -20 -20 -10 -50 Z`}
						fill="#4FB37A"
						opacity={0.85}
						transform={`translate(${((t * 18) % 60) - 30}, 0)`}
					/>
					</g>
					{sats.filter((s) => !s.back).map((s) => (
						<Satellite key={s.i} x={s.x} y={s.y} s={0.7} color={s.i === 0 ? C.orange : C.cyan} />
					))}
					<circle cx={hl.x} cy={hl.y} r={46} fill="none" stroke={C.orange} strokeWidth={3} opacity={0.6 + 0.4 * Math.sin(t * 5)} />
					<g opacity={p(t, tAlt, 0.5)}>
						<T x={EARTH.x} y={EARTH.y + 190} size={28} textAnchor="middle" fill={C.cyan}>
							orbite : 20 200 km
						</T>
					</g>
					<g opacity={p(t, tSpeed, 0.5)}>
						<T x={hl.x} y={hl.y - 60} size={28} textAnchor="middle" fill={C.orange}>
							~3,9 km/s
						</T>
					</g>

					{/* Bilan en cascade */}
					<g opacity={g1}>
						<T x={BAR_X} y={330} size={34} weight={800} fill={C.orange}>
							Gravité : +45 µs/jour
						</T>
						<rect x={BAR_X} y={350} width={45 * US * g1} height={44} rx={6} fill={C.orange} />
					</g>
					<g opacity={g2}>
						<T x={BAR_X} y={470} size={34} weight={800} fill={C.cyan}>
							Vitesse : −7 µs/jour
						</T>
						<rect x={BAR_X + 45 * US - 7 * US * g2} y={490} width={7 * US * g2} height={44} rx={6} fill={C.cyan} />
						<line x1={BAR_X + 45 * US} y1={394} x2={BAR_X + 45 * US} y2={490} stroke={C.muted} strokeDasharray="4 6" strokeWidth={2} />
					</g>
					<g opacity={g3}>
						<T x={BAR_X} y={610} size={34} weight={800} fill={C.white}>
							Total : +38 µs/jour
						</T>
						<rect x={BAR_X} y={630} width={38 * US * g3} height={44} rx={6} fill={C.white} />
						<line x1={BAR_X + 38 * US} y1={534} x2={BAR_X + 38 * US} y2={630} stroke={C.muted} strokeDasharray="4 6" strokeWidth={2} />
					</g>
					<g opacity={days > 0 ? 1 : 0}>
						<rect x={BAR_X} y={720} width={585} height={84} rx={14} fill={C.panel} stroke={C.dim} strokeWidth={2} />
						<T x={BAR_X + 28} y={775} size={34} fill={C.muted}>
							Jour {days}
						</T>
						<T x={BAR_X + 560} y={775} size={34} weight={800} textAnchor="end" fill={C.orange}>
							avance : {38 * days} µs
						</T>
					</g>
				</g>

				{/* ---- Phase B : la position dérive ---- */}
				<g opacity={oB}>
					<rect x={260} y={230} width={1400} height={630} rx={20} fill="#0E1A30" stroke={C.dim} strokeWidth={2} />
					{city.parks.map((pk, i) => (
						<rect key={i} x={pk.x} y={pk.y} width={66} height={66} rx={6} fill="#2E6B4A" opacity={0.5} />
					))}
					{Array.from({length: 19}, (_, i) => (
						<line key={`v${i}`} x1={296 + i * 76} y1={232} x2={296 + i * 76} y2={858} stroke="#2A3C5E" strokeWidth={i % 4 === 0 ? 7 : 3} />
					))}
					{Array.from({length: 9}, (_, i) => (
						<line key={`h${i}`} x1={262} y1={246 + i * 76} x2={1658} y2={246 + i * 76} stroke="#2A3C5E" strokeWidth={i % 3 === 0 ? 7 : 3} />
					))}
					<path d="M 262 760 C 600 640, 900 860, 1250 700 S 1600 560, 1658 600" fill="none" stroke="#2D6FB8" strokeWidth={26} opacity={0.7} />
					<line x1={262} y1={860} x2={1658} y2={230} stroke="#34486E" strokeWidth={8} />

					{/* Échelle */}
					<g>
						<line x1={300} y1={820} x2={700} y2={820} stroke={C.white} strokeWidth={4} />
						<line x1={300} y1={808} x2={300} y2={832} stroke={C.white} strokeWidth={4} />
						<line x1={700} y1={808} x2={700} y2={832} stroke={C.white} strokeWidth={4} />
						<T x={500} y={800} size={26} textAnchor="middle">
							10 km
						</T>
					</g>

					{/* Position réelle */}
					<circle cx={here.x} cy={here.y} r={30 + 6 * Math.sin(t * 4)} fill="none" stroke={C.cyan} strokeWidth={4} />
					<circle cx={here.x} cy={here.y} r={8} fill={C.cyan} />
					<T x={here.x} y={here.y + 66} size={26} textAnchor="middle" fill={C.cyan}>
						vous êtes ici
					</T>

					{/* Position calculée sans correction */}
					{drift > 0.01 && (
						<>
							<line x1={here.x} y1={here.y} x2={dot.x} y2={dot.y} stroke={C.orange} strokeWidth={3} strokeDasharray="10 8" />
							<T x={(here.x + dot.x) / 2} y={(here.y + dot.y) / 2 - 22} size={30} weight={800} textAnchor="middle" fill={C.orange}>
								{km.toFixed(1).replace('.', ',')} km
							</T>
						</>
					)}
					<g opacity={p(t, tOr + 0.6, 0.5)}>
						<circle cx={dot.x} cy={dot.y} r={22} fill={C.orange} opacity={0.3} />
						<circle cx={dot.x} cy={dot.y} r={12} fill={C.orange} />
					</g>
					<g opacity={Math.min(1, pop(t, tFix + 1.2, 0.5))}>
						<T x={here.x + 50} y={here.y - 40} size={34} weight={800} fill={C.green}>
							corrigé ✓
						</T>
					</g>
					<g opacity={p(t, tSet, 0.5)}>
						<rect x={860} y={740} width={790} height={104} rx={14} fill={C.panel} stroke={C.green} strokeWidth={2} />
						<T x={1255} y={784} size={30} textAnchor="middle" fill={C.white}>
							horloge réglée au sol : 10,229 999 995 43 MHz
						</T>
						<T x={1255} y={824} size={25} textAnchor="middle" fill={C.muted}>
							au lieu de 10,23 MHz : juste une fois en orbite
						</T>
					</g>
				</g>
			</svg>
			<Headings
				t={t}
				items={[
					{at: 0.4, text: 'GPS : relativité au quotidien'},
					{at: tAlt, text: "GPS : 20 200 km d'altitude", color: C.cyan},
					{at: tCm, text: '1 ns ↔ 30 cm de lumière', color: C.cyan},
					{at: w('dériverait'), text: 'Sans correction : ~11 km/jour', color: C.orange},
					{at: tFix, text: 'Corrigé avant le lancement', color: C.green},
				]}
			/>
		</>
	);
};

import React, {useMemo} from 'react';
import {p, pop} from '../anim';
import {Headings} from '../components/Headings';
import {Clock, T} from '../components/Shapes';
import {landDots} from '../geo';
import {C} from '../theme';
import {SceneProps} from './types';

const X0 = 240;
const Y0 = 330;
const K = 4;
const proj = (lon: number, lat: number) => [X0 + (lon + 180) * K, Y0 + (78 - lat) * K] as const;

const CITIES: {name: string; lon: number; lat: number; word: string}[] = [
	{name: 'Paris', lon: 2.35, lat: 48.85, word: 'Paris'},
	{name: 'Tokyo', lon: 139.7, lat: 35.7, word: 'Tokyo'},
	{name: 'New York', lon: -74, lat: 40.7, word: 'métronome'},
	{name: 'Rio', lon: -43.2, lat: -22.9, word: 'métronome'},
	{name: 'Sydney', lon: 151.2, lat: -33.9, word: 'métronome'},
];

const BIG = {x: 1690, y: 200, r: 100};

export const S2Newton: React.FC<SceneProps> = ({t, w}) => {
	const dots = useMemo(() => landDots(2.5), []);
	const tN = w('Newton');
	const tFalse = w('fausse');
	const running = Math.min(t, tFalse);
	const ticks = Math.max(0, Math.floor(running - tN));
	const sinceTick = running - (tN + ticks);
	const flash = t > tN && t < tFalse + 0.2 ? Math.exp(-sinceTick * 5) : 0;
	const handTurns = (ticks + Math.min(1, sinceTick * 8)) / 12;

	const crack = p(t, tFalse, 0.5);
	const shake = crack > 0 && crack < 1 ? Math.sin(t * 80) * 6 * (1 - crack) : 0;

	return (
		<>
			<div style={{position: 'absolute', inset: 0, filter: `saturate(${1 - crack * 0.85})`, transform: `translateX(${shake}px)`}}>
			<svg width={1920} height={1080}>
				{dots.map(([lon, lat], i) => {
					const [x, y] = proj(lon, lat);
					const o = p(t, 0.2 + ((x - X0) / 1440) * 1.8, 0.5);
					return <circle key={i} cx={x} cy={y} r={3.3} fill={C.cyan} opacity={0.4 * o} />;
				})}

				{/* Ondes : chaque « tic » de l'horloge universelle */}
				{Array.from({length: ticks + 1}, (_, k) => {
					const age = running - (tN + k);
					if (age < 0 || age > 2.2 || t > tFalse + 0.3) return null;
					return (
						<circle
							key={k}
							cx={BIG.x}
							cy={BIG.y}
							r={BIG.r + age * 900}
							fill="none"
							stroke={C.orange}
							strokeWidth={3}
							opacity={0.5 * (1 - age / 2.2)}
						/>
					);
				})}

				{CITIES.map((c) => {
					const [x, y] = proj(c.lon, c.lat);
					const k = pop(t, w(c.word), 0.5);
					return (
						<g key={c.name} opacity={Math.min(1, k)} transform={`translate(${x},${y}) scale(${k}) translate(${-x},${-y})`}>
							<circle cx={x} cy={y} r={34 + flash * 10} fill={C.orange} opacity={0.25 * flash} />
							<Clock x={x} y={y} r={26} turns={handTurns} color={C.orange} />
							<T x={x} y={y + 58} size={24} textAnchor="middle">
								{c.name}
							</T>
						</g>
					);
				})}

				{/* Lune et galaxie : la même seconde partout */}
				<g opacity={Math.min(1, pop(t, w('Lune'), 0.5))}>
					<circle cx={1160} cy={230} r={34} fill="#C9D3E3" />
					<circle cx={1150} cy={222} r={7} fill="#A9B4C7" />
					<circle cx={1172} cy={240} r={5} fill="#A9B4C7" />
					<Clock x={1218} y={195} r={20} turns={handTurns} color={C.orange} />
				</g>
				<g opacity={Math.min(1, pop(t, w('galaxie'), 0.5))} transform={`rotate(${t * 20}, 1400, 230)`}>
					{Array.from({length: 2}, (_, arm) => (
						<path
							key={arm}
							d={Array.from({length: 30}, (_, i) => {
								const a = arm * Math.PI + i * 0.22;
								const r = 3 + i * 1.5;
								return `${i ? 'L' : 'M'} ${1400 + Math.cos(a) * r} ${230 + Math.sin(a) * r * 0.6}`;
							}).join(' ')}
							fill="none"
							stroke="#B9A6FF"
							strokeWidth={4}
							strokeLinecap="round"
						/>
					))}
					<circle cx={1400} cy={230} r={6} fill="#FFFFFF" />
				</g>
				<g opacity={Math.min(1, pop(t, w('galaxie'), 0.5))}>
					<Clock x={1455} y={195} r={20} turns={handTurns} color={C.orange} />
				</g>

				{/* Horloge universelle de Newton */}
				<g opacity={p(t, 0.3, 0.8)}>
					<Clock x={BIG.x} y={BIG.y} r={BIG.r} turns={handTurns} color={C.orange} glow={0.5 + flash} face="#1B2440" />
					<path
						d={`M ${BIG.x - 60} ${BIG.y - 90} L ${BIG.x - 20} ${BIG.y - 30} L ${BIG.x - 40} ${BIG.y + 5} L ${BIG.x + 10} ${BIG.y + 40} L ${BIG.x - 5} ${BIG.y + 70} L ${BIG.x + 30} ${BIG.y + 105}`}
						fill="none"
						stroke={C.white}
						strokeWidth={5}
						strokeLinejoin="round"
						pathLength={1}
						strokeDasharray={1}
						strokeDashoffset={1 - crack}
						opacity={crack > 0 ? 1 : 0}
					/>
				</g>
			</svg>
			</div>
			<Headings
				t={t}
				items={[
					{at: tN, text: 'Newton, 1687', color: C.orange},
					{at: w('uniforme'), text: 'Un temps absolu, universel'},
					{at: w('métronome'), text: "Une seule horloge pour l'Univers"},
					{at: tFalse, text: '… vraiment ?', color: C.red},
				]}
			/>
		</>
	);
};

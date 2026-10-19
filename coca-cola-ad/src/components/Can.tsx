import React, { useId, useMemo } from "react";
import { random } from "remotion";
import { fontFamily } from "../fonts";

/**
 * Canette rouge générique en SVG (aucun logo ni ruban de marque).
 *
 * La rotation 3D est simulée : l'ombrage et les reflets restent fixes (la
 * lumière ne bouge pas) tandis que les éléments imprimés et les gouttes de
 * condensation sont projetés sur un cylindre : x = R·sin(θ), largeur ∝ cos(θ),
 * et masqués quand ils passent derrière.
 */

type CanProps = {
  width: number;
  /** Angle de rotation autour de l'axe vertical (radians). 0 = face avant. */
  rotation?: number;
  /** Ouverture de l'anneau : 0 = fermé, 1 = soulevé. */
  tabLift?: number;
  /** Temps (frames) pour les gouttes qui coulent. */
  time?: number;
  /** Givre / buée sur la canette (0–1). */
  frost?: number;
  /** Position du reflet qui balaie la canette (0 → 1). Hors de [0, 1] = invisible. */
  shine?: number;
  style?: React.CSSProperties;
};

// Repère de dessin (viewBox) : 240 × 480, axe du cylindre en x = 120.
const CX = 120;
const R = 100;
const BAND_TOP = 100;
const BAND_BOTTOM = 424;

const SILHOUETTE =
  "M36,44 C36,64 20,70 20,96 L20,428 C20,448 40,456 40,462 A80,10 0 0 0 200,462 C200,456 220,448 220,428 L220,96 C220,70 204,64 204,44 A84,12 0 0 0 36,44 Z";

/** Bande rouge : bords haut / bas en arcs d'ellipse (section du cylindre). */
const BAND = `M20,${BAND_TOP} A100,9 0 0 0 220,${BAND_TOP} L220,${BAND_BOTTOM} A100,9 0 0 1 20,${BAND_BOTTOM} Z`;

/** Projette un point de la surface (angle θ) selon la rotation courante. */
const project = (theta: number, rotation: number) => {
  const rel = theta + rotation;
  const z = Math.cos(rel); // > 0 : face visible
  return { x: CX + R * Math.sin(rel), z };
};

type Drop = { theta: number; y: number; r: number; drips: boolean; speed: number };

export const Can: React.FC<CanProps> = ({
  width,
  rotation = 0,
  tabLift = 0,
  time = 0,
  frost = 0.25,
  shine = -1,
  style,
}) => {
  // Identifiants SVG uniques (plusieurs canettes peuvent coexister).
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (name: string) => `${name}-${uid}`;

  // Gouttes de condensation générées une fois, de façon déterministe.
  const drops = useMemo<Drop[]>(
    () =>
      new Array(70).fill(true).map((_, i) => ({
        theta: random(`drop-t-${i}`) * Math.PI * 2,
        y: BAND_TOP + 8 + random(`drop-y-${i}`) * (BAND_BOTTOM - BAND_TOP - 30),
        r: 1.4 + Math.pow(random(`drop-r-${i}`), 2) * 4.6,
        drips: i % 9 === 0,
        speed: 0.15 + random(`drop-v-${i}`) * 0.25,
      })),
    [],
  );

  // Éléments imprimés génériques répartis autour du cylindre.
  const main = project(0, rotation);
  const back = project(Math.PI, rotation);
  const sides = [Math.PI / 2, -Math.PI / 2].map((t) => project(t, rotation));
  const lines = [Math.PI - 0.42, Math.PI + 0.42].map((t) => project(t, rotation));

  const lift = Math.max(0, Math.min(1, tabLift));
  const opening = Math.max(0, Math.min(1, (tabLift - 0.35) / 0.65));

  return (
    <svg
      width={width}
      height={width * 2}
      viewBox="0 0 240 480"
      style={{ overflow: "visible", ...style }}
    >
      <defs>
        <linearGradient id={id("silver")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5f656c" />
          <stop offset="0.1" stopColor="#b3b8be" />
          <stop offset="0.27" stopColor="#f6f8fa" />
          <stop offset="0.36" stopColor="#d4d8dc" />
          <stop offset="0.62" stopColor="#a5aab0" />
          <stop offset="0.86" stopColor="#787e85" />
          <stop offset="1" stopColor="#4a4f55" />
        </linearGradient>
        <linearGradient id={id("red")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3d000a" />
          <stop offset="0.08" stopColor="#8a001a" />
          <stop offset="0.21" stopColor="#d60028" />
          <stop offset="0.29" stopColor="#ff5268" />
          <stop offset="0.36" stopColor="#e4002b" />
          <stop offset="0.66" stopColor="#c20025" />
          <stop offset="0.87" stopColor="#7d0018" />
          <stop offset="1" stopColor="#33000a" />
        </linearGradient>
        <linearGradient id={id("lid")} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f2f4f6" />
          <stop offset="0.5" stopColor="#a9aeb4" />
          <stop offset="1" stopColor="#dfe2e5" />
        </linearGradient>
        <linearGradient id={id("tab")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fbfcfd" />
          <stop offset="1" stopColor="#9aa0a6" />
        </linearGradient>
        <linearGradient id={id("shine")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={id("body")}>
          <path d={SILHOUETTE} />
        </clipPath>
        <clipPath id={id("band")}>
          <path d={BAND} />
        </clipPath>
        <filter id={id("soft")} x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Corps en aluminium */}
      <path d={SILHOUETTE} fill={`url(#${id("silver")})`} />

      {/* Bande rouge + impression générique */}
      <g clipPath={`url(#${id("band")})`}>
        <rect x="0" y="0" width="240" height="480" fill={`url(#${id("red")})`} />

        {main.z > 0 && (
          <text
            transform={`translate(${main.x} 262) scale(${main.z} 1) rotate(-90)`}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={fontFamily}
            fontWeight={900}
            fontSize={56}
            letterSpacing={-2}
            fill="#fff"
            opacity={0.55 + 0.45 * main.z}
          >
            Coca-Cola
          </text>
        )}
        {back.z > 0 && (
          <text
            transform={`translate(${back.x} 262) scale(${back.z} 1) rotate(-90)`}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={fontFamily}
            fontWeight={800}
            fontSize={17}
            letterSpacing={4}
            fill="#fff"
            opacity={0.85 * back.z}
          >
            ORIGINAL · 33 CL
          </text>
        )}
        {lines.map(
          (p, i) =>
            p.z > 0 && (
              <rect key={i} x={p.x - 1.5 * p.z} y={BAND_TOP} width={3 * p.z} height={BAND_BOTTOM - BAND_TOP} fill="#fff" opacity={0.7 * p.z} />
            ),
        )}
        {sides.map(
          (p, i) =>
            p.z > 0 &&
            [0, 1, 2, 3, 4].map((k) => (
              <ellipse
                key={`${i}-${k}`}
                cx={p.x}
                cy={190 + k * 34}
                rx={(5 + k * 1.5) * p.z}
                ry={5 + k * 1.5}
                fill="none"
                stroke="#fff"
                strokeWidth={2}
                opacity={0.6 * p.z}
              />
            )),
        )}

        {/* Filets argentés horizontaux (symétrie de révolution : fixes) */}
        {[BAND_TOP + 12, BAND_BOTTOM - 12].map((y) => (
          <path key={y} d={`M20,${y} A100,9 0 0 0 220,${y}`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={1.6} />
        ))}

        {/* Condensation */}
        {drops.map((d, i) => {
          const p = project(d.theta, rotation);
          if (p.z < 0.08) return null;
          const y = d.drips ? Math.min(BAND_BOTTOM - 6, d.y + time * d.speed) : d.y;
          return (
            <g key={i} opacity={0.4 + 0.6 * p.z}>
              {d.drips && y > d.y && (
                <rect x={p.x - d.r * 0.35 * p.z} y={d.y} width={d.r * 0.7 * p.z} height={y - d.y} fill="#fff" opacity={0.18} />
              )}
              <ellipse cx={p.x} cy={y + d.r * 0.35} rx={d.r * p.z} ry={d.r * 1.1} fill="#4a0010" opacity={0.35} />
              <ellipse cx={p.x} cy={y} rx={d.r * p.z} ry={d.r * 1.15} fill="#fff" fillOpacity={0.2} stroke="#fff" strokeOpacity={0.45} strokeWidth={0.6} />
              <ellipse cx={p.x - d.r * 0.35 * p.z} cy={y - d.r * 0.4} rx={d.r * 0.3 * p.z} ry={d.r * 0.35} fill="#fff" opacity={0.9} />
            </g>
          );
        })}

        {/* Buée */}
        <rect x="0" y="0" width="240" height="480" fill="#fff" opacity={frost * 0.14} />
      </g>

      {/* Reflets fixes (la lumière ne tourne pas avec la canette) + balayage */}
      <g clipPath={`url(#${id("body")})`}>
        <rect x="50" y="0" width="18" height="480" fill="#fff" opacity={0.5} filter={`url(#${id("soft")})`} />
        <rect x="76" y="0" width="5" height="480" fill="#fff" opacity={0.25} filter={`url(#${id("soft")})`} />
        <rect x="176" y="0" width="9" height="480" fill="#fff" opacity={0.14} filter={`url(#${id("soft")})`} />
        {shine >= 0 && shine <= 1 && (
          <rect
            x={-120 + shine * 480}
            y="-60"
            width="70"
            height="600"
            fill={`url(#${id("shine")})`}
            transform={`rotate(18 ${-85 + shine * 480} 240)`}
          />
        )}
      </g>

      {/* Couvercle */}
      <ellipse cx={CX} cy={44} rx={84} ry={12} fill={`url(#${id("lid")})`} stroke="#80868c" strokeWidth={0.8} />
      <ellipse cx={CX} cy={46} rx={72} ry={9} fill="#b6bbc1" stroke="#eef1f4" strokeWidth={1.2} />
      {/* Ligne de découpe + ouverture qui se creuse */}
      <ellipse cx={CX} cy={51} rx={15} ry={4.2} fill="none" stroke="#868c92" strokeWidth={0.7} />
      {opening > 0 && <ellipse cx={CX} cy={51} rx={15 * opening} ry={4.2 * opening} fill="#1a0306" />}

      {/* Anneau : s'aplatit sur le couvercle, se redresse en s'ouvrant */}
      <g transform={`translate(${CX} 45) scale(1 ${0.26 + 0.74 * lift})`}>
        <path
          d="M-13,5 Q-13,9 -9,9 L9,9 Q13,9 13,5 L13,-28 Q13,-40 0,-40 Q-13,-40 -13,-28 Z M-7.5,-26 a7.5,7.5 0 1,0 15,0 a7.5,7.5 0 1,0 -15,0 Z"
          fillRule="evenodd"
          fill={`url(#${id("tab")})`}
          stroke="#6f757c"
          strokeWidth={0.8}
        />
        <circle cx={0} cy={0} r={3} fill="#8d9399" />
      </g>
    </svg>
  );
};

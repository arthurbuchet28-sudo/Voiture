import { interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TEXTES } from "../config";
import { FONT_TITRE } from "../fonts";
import { Fond } from "../components/Fond";
import { SousTitres } from "../components/SousTitres";
import { TitreScene } from "../components/TitreScene";
import { fr } from "../components/texte";

const T = TEXTES.refroidissement;

const CX = 960;
const CY = 540;
const NB_RADIATEURS = 10;
const RAYON = { x: 560, y: 270 };

// Radiateurs répartis en ellipse autour du moteur
const RADIATEURS = Array.from({ length: NB_RADIATEURS }).map((_, i) => {
  const a = ((i + 0.5) / NB_RADIATEURS) * Math.PI * 2;
  return { x: CX + RAYON.x * Math.cos(a), y: CY + RAYON.y * Math.sin(a), a };
});

const Radiateur: React.FC<{ x: number; y: number; p: number; froid: number }> = ({ x, y, p, froid }) => (
  <g opacity={p} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * p})`}>
    <rect
      x={-62}
      y={-36}
      width={124}
      height={72}
      rx={8}
      fill={COLORS.fondClair}
      stroke={interpolateColors(froid, [0, 1], [COLORS.argentFonce, COLORS.froid])}
      strokeWidth={3}
    />
    {Array.from({ length: 8 }).map((_, i) => (
      <line
        key={i}
        x1={-48 + i * 13.7}
        x2={-48 + i * 13.7}
        y1={-26}
        y2={26}
        stroke={interpolateColors(froid, [0, 1], [COLORS.argentFonce, COLORS.froid])}
        strokeOpacity={0.7}
        strokeWidth={3}
      />
    ))}
  </g>
);

export const Scene6Refroidissement: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  // 0–4 s : la chaleur monte ; 4–8 s : les radiateurs apparaissent et évacuent la chaleur
  const chaleur = interpolate(sec, [0, 3.5], [0.25, 1], { extrapolateRight: "clamp" });
  const pulsation = 0.85 + 0.15 * Math.sin(frame * 0.25);
  const flux = interpolate(sec, [4.2, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const refroidi = interpolate(sec, [5, 8], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const temperature = chaleur - refroidi;

  const compteur = RADIATEURS.filter((_, i) => frame >= Math.round(3.6 * fps) + i * 3 + 6).length;
  const intro = spring({ frame, fps, config: { damping: 200 } });

  return (
    <Fond>
      <svg width={1920} height={1080} style={{ position: "absolute" }} opacity={intro}>
        <defs>
          <radialGradient id="halo">
            <stop offset="0%" stopColor={COLORS.brulant} stopOpacity={0.75} />
            <stop offset="55%" stopColor={COLORS.chaud} stopOpacity={0.25} />
            <stop offset="100%" stopColor={COLORS.chaud} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* halo de chaleur */}
        <ellipse cx={CX} cy={CY} rx={420 * temperature * pulsation} ry={260 * temperature * pulsation} fill="url(#halo)" />

        {/* ondes de chaleur avant l'arrivée des radiateurs */}
        {[0, 1, 2].map((k) => {
          const t = ((frame + k * 20) % 60) / 60;
          return (
            <ellipse
              key={k}
              cx={CX}
              cy={CY}
              rx={170 + t * 260}
              ry={110 + t * 160}
              fill="none"
              stroke={COLORS.brulant}
              strokeWidth={3}
              opacity={(1 - t) * 0.6 * (1 - flux)}
            />
          );
        })}

        {/* flux de chaleur moteur → radiateurs : rouge qui devient bleu */}
        {RADIATEURS.map((r, i) =>
          Array.from({ length: 5 }).map((_, k) => {
            const t = (frame * 0.02 + k / 5 + i * 0.13) % 1.4;
            const dx = r.x - CX;
            const dy = r.y - CY;
            const x = CX + dx * (0.3 + 0.7 * t);
            const y = CY + dy * (0.3 + 0.7 * t);
            const couleur = interpolateColors(t, [0, 0.4, 0.85], [COLORS.brulant, COLORS.chaud, COLORS.froid]);
            const opacite = flux * interpolate(t, [0, 0.1, 1, 1.4], [0, 1, 1, 0]);
            return <circle key={`${i}-${k}`} cx={x} cy={y} r={7} fill={couleur} opacity={opacite} />;
          }),
        )}

        {/* radiateurs */}
        {RADIATEURS.map((r, i) => {
          const p = spring({ frame: frame - Math.round(3.6 * fps) - i * 3, fps, config: { damping: 15 } });
          return <Radiateur key={i} x={r.x} y={r.y} p={Math.min(1, p)} froid={flux} />;
        })}

        {/* moteur */}
        <rect
          x={CX - 150}
          y={CY - 90}
          width={300}
          height={180}
          rx={24}
          fill={interpolateColors(temperature, [0.2, 1], ["#2a3240", "#5a1d14"])}
          stroke={interpolateColors(temperature, [0.2, 1], [COLORS.froid, COLORS.brulant])}
          strokeWidth={4}
        />
        <text
          x={CX}
          y={CY - 18}
          textAnchor="middle"
          fill={COLORS.texte}
          fontFamily={FONT_TITRE}
          fontWeight={700}
          fontSize={36}
        >
          {T.moteur}
        </text>
        <text
          x={CX}
          y={CY + 40}
          textAnchor="middle"
          fill={COLORS.froid}
          fontFamily={FONT_TITRE}
          fontWeight={700}
          fontSize={32}
          opacity={compteur > 0 ? 1 : 0}
        >
          {fr(`≈ ${compteur} ${T.compteur}`)}
        </text>
      </svg>

      <TitreScene numero={6} titre={T.titre} />
      <SousTitres items={T.sousTitres} />
    </Fond>
  );
};

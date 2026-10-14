import { interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, reperes, TEXTES } from "../config";
import { FONT_TEXTE, FONT_TITRE } from "../fonts";
import { Fond } from "../components/Fond";
import { SousTitres } from "../components/SousTitres";
import { TitreScene } from "../components/TitreScene";
import { surPolyligne } from "../components/geometrie";
import { fr } from "../components/texte";

const T = TEXTES.quatreTemps;
// Début de chaque phrase de voix off (s) : 0 intro, 1 admission, 2 compression, 3 combustion,
// 4 échappement, 5 soupapes
const R = reperes("quatreTemps").map((r) => r.debut);
/** Après le premier cycle commenté, le moteur continue de tourner : un demi-tour en… (s) */
const DEMI_TOUR_LIBRE = 1.2;

/**
 * Angle de vilebrequin (radians) à l'instant t : immobile au point mort haut pendant l'intro,
 * puis un demi-tour par temps, chaque demi-tour durant le temps de sa phrase de voix off.
 */
const angleVilebrequin = (t: number) => {
  if (t < R[1]) return 0;
  for (let k = 0; k < 4; k++) {
    if (t < R[k + 2]) return Math.PI * (k + (t - R[k + 1]) / (R[k + 2] - R[k + 1]));
  }
  return Math.PI * (4 + (t - R[5]) / DEMI_TOUR_LIBRE);
};

// Géométrie du cylindre (coupe)
const CX = 700;
const CY = 770; // axe du vilebrequin
const MANETON = 85; // rayon de manivelle
const BIELLE = 220; // longueur de bielle
const CHAMBRE = 370; // plafond de la chambre de combustion
const ALESAGE = 160;
const LEVEE_MAX = 26;

const ADMISSION: [number, number][] = [
  [CX - 330, 300],
  [CX - 120, 300],
  [CX - 50, 352],
];
const ECHAPPEMENT: [number, number][] = [
  [CX + 50, 352],
  [CX + 120, 300],
  [CX + 330, 300],
];

const Soupape: React.FC<{ x: number; levee: number; couleur: string }> = ({ x, levee, couleur }) => (
  <g transform={`translate(0 ${levee})`}>
    <rect x={x - 5} y={214} width={10} height={146} fill={COLORS.argent} />
    <path d={`M ${x - 32} ${370} L ${x + 32} ${370} L ${x + 8} ${356} L ${x - 8} ${356} Z`} fill={couleur} />
  </g>
);

const Etiquette: React.FC<{
  x: number;
  y: number;
  vers: { x: number; y: number };
  texte: string;
  aligne: "start" | "end" | "middle";
}> = ({ x, y, vers, texte, aligne }) => (
  <g>
    <line
      x1={aligne === "end" ? x + 12 : aligne === "start" ? x - 12 : x}
      y1={aligne === "middle" ? y + 12 : y - 8}
      x2={vers.x}
      y2={vers.y}
      stroke={COLORS.argentFonce}
      strokeWidth={2}
    />
    <circle cx={vers.x} cy={vers.y} r={5} fill={COLORS.argent} />
    <text
      x={x}
      y={y}
      textAnchor={aligne}
      fill={COLORS.texte}
      fontFamily={FONT_TEXTE}
      fontWeight={500}
      fontSize={26}
    >
      {texte}
    </text>
  </g>
);

export const Scene4QuatreTemps: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Angle de vilebrequin : 0 = point mort haut au début de l'admission
  const theta = angleVilebrequin(frame / fps);
  const demiTours = theta / Math.PI;
  const phase = Math.floor(demiTours) % 4; // 0 admission … 3 échappement
  const u = demiTours - Math.floor(demiTours); // avancement dans le temps en cours
  const phaseListe = frame / fps < R[1] ? -1 : phase; // aucun temps surligné pendant l'intro

  const maneton = { x: CX + MANETON * Math.sin(theta), y: CY - MANETON * Math.cos(theta) };
  const axePiston =
    CY - (MANETON * Math.cos(theta) + Math.sqrt(BIELLE ** 2 - (MANETON * Math.sin(theta)) ** 2));
  const hautPiston = axePiston - 55;

  const leveeAdm = phase === 0 ? Math.sin(Math.PI * u) * LEVEE_MAX : 0;
  const leveeEch = phase === 3 ? Math.sin(Math.PI * u) * LEVEE_MAX : 0;

  // Couleur et densité du gaz dans la chambre selon le temps
  const gaz =
    phase === 0
      ? { c: COLORS.froid, o: interpolate(u, [0, 1], [0.15, 0.4]) }
      : phase === 1
        ? { c: interpolateColors(u, [0, 1], [COLORS.froid, "#8f7bff"]), o: interpolate(u, [0, 1], [0.4, 0.7]) }
        : phase === 2
          ? { c: interpolateColors(u, [0, 0.5, 1], ["#fff1b0", COLORS.chaud, COLORS.brulant]), o: interpolate(u, [0, 1], [0.95, 0.55]) }
          : { c: "#8a7a70", o: interpolate(u, [0, 1], [0.5, 0.08]) };
  const etincelle = phase === 2 ? interpolate(u, [0, 0.06, 0.3], [0, 1, 0], { extrapolateRight: "clamp" }) : 0;

  const particules = (chemin: [number, number][], couleur: string, actif: number) =>
    actif > 0
      ? Array.from({ length: 7 }).map((_, i) => {
          const t = ((frame * 0.035 + i / 7) % 1 + 1) % 1;
          const p = surPolyligne(chemin, t);
          return <circle key={i} cx={p.x} cy={p.y} r={7} fill={couleur} opacity={actif * Math.sin(Math.PI * t)} />;
        })
      : null;

  const badge = spring({ frame: frame - Math.round(R[5] * fps), fps, config: { damping: 200 } });
  const intro = spring({ frame, fps, config: { damping: 200 } });

  return (
    <Fond>
      <svg width={1920} height={1080} style={{ position: "absolute" }} opacity={intro}>
        <defs>
          <radialGradient id="flash">
            <stop offset="0%" stopColor="#fffbe6" />
            <stop offset="60%" stopColor="#ffd25a" stopOpacity={0.6} />
            <stop offset="100%" stopColor={COLORS.chaud} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* gaz dans le cylindre */}
        <rect
          x={CX - ALESAGE / 2}
          y={CHAMBRE}
          width={ALESAGE}
          height={hautPiston - CHAMBRE}
          fill={gaz.c}
          opacity={gaz.o}
        />

        {/* vilebrequin */}
        <circle cx={CX} cy={CY} r={110} fill={COLORS.fondClair} stroke={COLORS.argentFonce} strokeWidth={3} />
        <path
          d={`M ${CX - 100 * Math.cos(theta)} ${CY - 100 * Math.sin(theta)} A 100 100 0 0 0 ${CX + 100 * Math.cos(theta)} ${CY + 100 * Math.sin(theta)} Z`}
          fill={COLORS.argentFonce}
          opacity={0.6}
        />
        <circle cx={CX} cy={CY} r={16} fill={COLORS.argent} />

        {/* bielle */}
        <line x1={maneton.x} y1={maneton.y} x2={CX} y2={axePiston} stroke={COLORS.argent} strokeWidth={22} strokeLinecap="round" />
        <circle cx={maneton.x} cy={maneton.y} r={18} fill={COLORS.bleuClair} />

        {/* piston */}
        <rect x={CX - ALESAGE / 2 + 4} y={hautPiston} width={ALESAGE - 8} height={100} rx={8} fill={COLORS.argent} />
        {[14, 28, 42].map((dy) => (
          <line key={dy} x1={CX - ALESAGE / 2 + 4} x2={CX + ALESAGE / 2 - 4} y1={hautPiston + dy} y2={hautPiston + dy} stroke={COLORS.argentFonce} strokeWidth={3} />
        ))}
        <circle cx={CX} cy={axePiston} r={13} fill={COLORS.fondClair} stroke={COLORS.argentFonce} strokeWidth={3} />

        {/* parois du cylindre */}
        <rect x={CX - ALESAGE / 2 - 22} y={CHAMBRE} width={22} height={330} fill="#3a414b" />
        <rect x={CX + ALESAGE / 2} y={CHAMBRE} width={22} height={330} fill="#3a414b" />

        {/* culasse et conduits */}
        <rect x={CX - 190} y={240} width={380} height={130} rx={14} fill="#3a414b" />
        <polyline points={ADMISSION.map((p) => p.join(",")).join(" ")} fill="none" stroke={COLORS.fond} strokeWidth={44} strokeLinejoin="round" />
        <polyline points={ECHAPPEMENT.map((p) => p.join(",")).join(" ")} fill="none" stroke={COLORS.fond} strokeWidth={44} strokeLinejoin="round" />
        {particules(ADMISSION, COLORS.froid, phase === 0 ? Math.sin(Math.PI * u) * 1.4 : 0)}
        {particules(ECHAPPEMENT, COLORS.chaud, phase === 3 ? Math.sin(Math.PI * u) * 1.4 : 0)}

        <Soupape x={CX - 50} levee={leveeAdm} couleur={COLORS.froid} />
        <Soupape x={CX + 50} levee={leveeEch} couleur={COLORS.chaud} />

        {/* bougie */}
        <rect x={CX - 7} y={214} width={14} height={150} fill={COLORS.argentFonce} />
        <rect x={CX - 3} y={360} width={6} height={10} fill={COLORS.argent} />
        <circle cx={CX} cy={380} r={90 * etincelle} fill="url(#flash)" opacity={etincelle} />

        {/* étiquettes */}
        <Etiquette x={510} y={196} vers={{ x: CX - 50, y: 226 }} texte={T.etiquettes.soupapeAdm} aligne="end" />
        <Etiquette x={CX} y={160} vers={{ x: CX, y: 214 }} texte={T.etiquettes.bougie} aligne="middle" />
        <Etiquette x={890} y={196} vers={{ x: CX + 50, y: 226 }} texte={T.etiquettes.soupapeEch} aligne="start" />
        <Etiquette x={440} y={520} vers={{ x: CX - ALESAGE / 2 + 20, y: hautPiston + 60 }} texte={T.etiquettes.piston} aligne="end" />
        <Etiquette
          x={440}
          y={680}
          vers={{ x: (maneton.x + CX) / 2, y: (maneton.y + axePiston) / 2 }}
          texte={T.etiquettes.bielle}
          aligne="end"
        />
        <Etiquette x={440} y={840} vers={{ x: CX - 96, y: CY + 40 }} texte={T.etiquettes.vilebrequin} aligne="end" />
      </svg>

      <TitreScene numero={4} titre={T.titre} />

      {/* Liste des 4 temps */}
      <div style={{ position: "absolute", left: 1180, top: 210, width: 620, opacity: intro }}>
        {T.phases.map((nom, i) => {
          const actif = i === phaseListe;
          return (
            <div
              key={nom}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: "14px 24px",
                marginBottom: 12,
                borderRadius: 14,
                background: actif ? "rgba(47,107,255,0.22)" : "rgba(255,255,255,0.03)",
                border: `2px solid ${actif ? COLORS.bleu : "transparent"}`,
                fontFamily: FONT_TITRE,
                color: actif ? COLORS.texte : COLORS.argentFonce,
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 700, color: actif ? COLORS.bleuClair : COLORS.argentFonce }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 38, fontWeight: 700 }}>{nom}</span>
            </div>
          );
        })}
        <div
          style={{
            marginTop: 36,
            padding: "22px 26px",
            borderRadius: 14,
            background: COLORS.panneau,
            border: `1px solid ${COLORS.bordure}`,
            fontFamily: FONT_TEXTE,
            opacity: badge,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 600, color: COLORS.texte }}>{fr(T.soupapes[0])}</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.bleuClair, marginTop: 6 }}>
            {fr(T.soupapes[1])}
          </div>
        </div>
      </div>

      <SousTitres scene="quatreTemps" items={T.sousTitres} />
    </Fond>
  );
};

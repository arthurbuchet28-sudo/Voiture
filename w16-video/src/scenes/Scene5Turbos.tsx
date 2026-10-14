import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, reperes, TEXTES } from "../config";
import { FONT_TEXTE, FONT_TITRE } from "../fonts";
import { Fond } from "../components/Fond";
import { SousTitres } from "../components/SousTitres";
import { TitreScene } from "../components/TitreScene";
import { surPolyligne } from "../components/geometrie";
import { fr, nombreFr } from "../components/texte";

const T = TEXTES.turbos;
const E = T.etiquettes;
const S = T.sequentiel;
// Phrases de voix off : 0 intro, 1 compression, 2 refroidissement, 3 turbines, 4 séquentiel
const PHRASES = reperes("turbos");
const R = PHRASES.map((r) => r.debut);
// Dans la phrase 4, « Au-delà de 3 800 tours… » commence vers 52 % de la phrase.
const SEUIL_S = R[4] + 0.52 * (PHRASES[4].fin - R[4]);

// Schéma : ligne froide en haut (gauche → droite), ligne chaude en bas (droite → gauche)
const Y_FROID = 270;
const Y_CHAUD = 540;
const X_TURBO = 470;
const MOTEUR = { x: 1220, y: 330, l: 360, h: 170 };
const REFROID = { x: 760, y: Y_FROID - 60, l: 200, h: 120 };

const CHEMIN_FROID: [number, number][] = [
  [110, Y_FROID],
  [MOTEUR.x + MOTEUR.l / 2, Y_FROID],
  [MOTEUR.x + MOTEUR.l / 2, MOTEUR.y + 40],
];
const CHEMIN_CHAUD: [number, number][] = [
  [MOTEUR.x + MOTEUR.l / 2, MOTEUR.y + MOTEUR.h - 40],
  [MOTEUR.x + MOTEUR.l / 2, Y_CHAUD],
  [110, Y_CHAUD],
];

/** Roue à aubes (compresseur ou turbine) qui tourne. */
const Roue: React.FC<{ x: number; y: number; angle: number; couleur: string; r?: number; actif?: number }> = ({
  x,
  y,
  angle,
  couleur,
  r = 58,
  actif = 1,
}) => (
  <g opacity={0.35 + 0.65 * actif}>
    <circle cx={x} cy={y} r={r} fill={COLORS.fondClair} stroke={couleur} strokeWidth={4} />
    <g transform={`rotate(${angle} ${x} ${y})`}>
      {Array.from({ length: 7 }).map((_, i) => (
        <path
          key={i}
          d={`M ${x} ${y} q ${r * 0.35} ${-r * 0.3} ${r * 0.78} ${-r * 0.12}`}
          transform={`rotate(${(i * 360) / 7} ${x} ${y})`}
          stroke={couleur}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
    <circle cx={x} cy={y} r={9} fill={couleur} />
  </g>
);

const Etiquette: React.FC<{ x: number; y: number; texte: string; couleur?: string; taille?: number; actif?: number }> = ({
  x,
  y,
  texte,
  couleur = COLORS.texte,
  taille = 28,
  actif = 1,
}) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fill={couleur}
    fontFamily={FONT_TEXTE}
    fontWeight={600}
    fontSize={taille}
    opacity={0.45 + 0.55 * actif}
  >
    {fr(texte)}
  </text>
);

export const Scene5Turbos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;

  // Mise en avant (0 → 1) des éléments commentés par la voix off. Étapes : 0 compression,
  // 1 refroidissement/cylindres, 2 échappement/turbines. Avant et après, tout est allumé.
  const FENETRES: [number, number][] = [
    [R[1], R[2]],
    [R[2], R[3]],
    [R[3], R[4]],
  ];
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const lisse = (etapes: number[]) =>
    Math.max(
      interpolate(sec, [R[1] - 0.3, R[1]], [1, 0], clamp),
      interpolate(sec, [R[4] - 0.2, R[4] + 0.3], [0, 1], clamp),
      ...etapes.map((e) => {
        const [a, b] = FENETRES[e];
        return interpolate(sec, [a - 0.3, a, b - 0.15, b + 0.15], [0, 1, 1, 0], clamp);
      }),
    );

  const intro = spring({ frame, fps, config: { damping: 200 } });
  const rotation = frame * 14;

  // Particules : air froid bleu, gaz chauds orange
  const particules = (chemin: [number, number][], n: number, vitesse: number, couleur: string, r: number) =>
    Array.from({ length: n }).map((_, i) => {
      const t = (frame * vitesse + i / n) % 1;
      const p = surPolyligne(chemin, t);
      return <circle key={i} cx={p.x} cy={p.y} r={r} fill={couleur} opacity={0.9} />;
    });

  // Panneau séquentiel : le régime monte et franchit le seuil quand la voix l'annonce
  const debutSeq = Math.round(R[4] * fps);
  const panneau = spring({ frame: frame - debutSeq, fps, config: { damping: 200 } });
  const montee = { de: R[4] + 1, seuil: SEUIL_S };
  const regime = interpolate(sec, [montee.de, montee.seuil], [1500, S.seuil], {
    extrapolateLeft: "clamp",
  });
  const regimeAffiche = Math.min(6500, regime);
  const tousActifs = regime >= S.seuil;
  const imageSeuil = Math.round(SEUIL_S * fps);
  const bascule = spring({ frame: frame - imageSeuil, fps, config: { damping: 14 } });
  const BARRE = { x: 720, l: 1060 };

  return (
    <Fond>
      <svg width={1920} height={1080} style={{ position: "absolute" }} opacity={intro}>
        {/* conduits */}
        <polyline
          points={CHEMIN_FROID.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="rgba(92,192,255,0.18)"
          strokeWidth={34}
          strokeLinejoin="round"
        />
        <polyline
          points={CHEMIN_CHAUD.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,138,42,0.18)"
          strokeWidth={34}
          strokeLinejoin="round"
        />
        {particules(CHEMIN_FROID, 26, 0.006, COLORS.froid, 7)}
        {particules(CHEMIN_CHAUD, 26, 0.008, COLORS.chaud, 8)}

        {/* turbo : compresseur (haut) et turbine (bas) sur le même arbre */}
        <line x1={X_TURBO} y1={Y_FROID} x2={X_TURBO} y2={Y_CHAUD} stroke={COLORS.argent} strokeWidth={10} />
        <Roue x={X_TURBO} y={Y_FROID} angle={rotation} couleur={COLORS.froid} actif={lisse([0])} />
        <Roue x={X_TURBO} y={Y_CHAUD} angle={rotation} couleur={COLORS.chaud} actif={lisse([2])} />
        <text
          x={X_TURBO + 22}
          y={(Y_FROID + Y_CHAUD) / 2}
          fill={COLORS.texteDoux}
          fontFamily={FONT_TEXTE}
          fontSize={24}
          dominantBaseline="central"
        >
          {E.arbre}
        </text>
        <g transform={`translate(${X_TURBO - 175} ${(Y_FROID + Y_CHAUD) / 2})`}>
          <rect x={-100} y={-30} width={200} height={60} rx={30} fill={COLORS.bleu} />
          <text
            x={0}
            y={2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={COLORS.texte}
            fontFamily={FONT_TITRE}
            fontWeight={700}
            fontSize={28}
          >
            {fr(E.nombre)}
          </text>
        </g>

        {/* refroidisseurs (échangeurs air/eau) */}
        <g opacity={0.4 + 0.6 * lisse([1])}>
          <rect
            x={REFROID.x}
            y={REFROID.y}
            width={REFROID.l}
            height={REFROID.h}
            rx={10}
            fill={COLORS.fondClair}
            stroke={COLORS.froid}
            strokeWidth={3}
          />
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={i}
              x1={REFROID.x + 18 + i * 16.4}
              x2={REFROID.x + 18 + i * 16.4}
              y1={REFROID.y + 12}
              y2={REFROID.y + REFROID.h - 12}
              stroke={COLORS.froid}
              strokeOpacity={0.6}
              strokeWidth={3}
            />
          ))}
        </g>

        {/* bloc moteur : 16 cylindres */}
        <g opacity={0.4 + 0.6 * lisse([1, 2])}>
          <rect
            x={MOTEUR.x}
            y={MOTEUR.y}
            width={MOTEUR.l}
            height={MOTEUR.h}
            rx={22}
            fill={COLORS.fondClair}
            stroke={COLORS.argent}
            strokeWidth={3}
          />
          {Array.from({ length: 16 }).map((_, i) => {
            const col = i % 4;
            const lig = Math.floor(i / 4);
            const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(frame * 0.5 + i * 1.7));
            return (
              <circle
                key={i}
                cx={MOTEUR.x + 70 + col * 74 + (lig % 2) * 18}
                cy={MOTEUR.y + 31 + lig * 36}
                r={15}
                fill={COLORS.chaud}
                fillOpacity={0.25 * pulse}
                stroke={COLORS.argent}
                strokeWidth={2.5}
              />
            );
          })}
        </g>

        {/* étiquettes */}
        <Etiquette x={150} y={Y_FROID - 40} texte={E.airFrais} couleur={COLORS.froid} actif={lisse([0])} />
        <Etiquette x={X_TURBO} y={Y_FROID - 82} texte={E.compresseur} actif={lisse([0])} />
        <Etiquette x={REFROID.x + REFROID.l / 2} y={REFROID.y - 24} texte={E.refroidisseurs} actif={lisse([1])} />
        <text
          x={MOTEUR.x + MOTEUR.l + 24}
          y={MOTEUR.y + MOTEUR.h / 2}
          fill={COLORS.texte}
          fontFamily={FONT_TEXTE}
          fontWeight={600}
          fontSize={28}
          dominantBaseline="central"
          opacity={0.45 + 0.55 * lisse([1, 2])}
        >
          {E.cylindres}
        </text>
        <Etiquette x={X_TURBO} y={Y_CHAUD + 96} texte={E.turbine} actif={lisse([2])} />
        <Etiquette x={950} y={Y_CHAUD + 56} texte={E.echappement} couleur={COLORS.chaud} actif={lisse([2])} />
        <Etiquette x={150} y={Y_CHAUD + 56} texte={E.sortie} couleur={COLORS.chaud} actif={lisse([2])} />

        {/* Panneau séquentiel */}
        <g opacity={panneau} transform={`translate(0 ${interpolate(panneau, [0, 1], [20, 0])})`}>
          <rect x={96} y={668} width={1728} height={186} rx={20} fill={COLORS.panneau} stroke={COLORS.bordure} />
          <text x={130} y={712} fill={COLORS.texte} fontFamily={FONT_TITRE} fontWeight={700} fontSize={30}>
            {fr(S.titre)}
          </text>
          {[0, 1, 2, 3].map((i) => {
            const actif = i < 2 ? 1 : tousActifs ? bascule : 0;
            const x = 170 + i * 120;
            return (
              <g key={i}>
                <Roue
                  x={x}
                  y={790}
                  r={38}
                  angle={actif > 0.5 ? frame * 20 : 0}
                  couleur={actif > 0.5 ? COLORS.froid : COLORS.argentFonce}
                  actif={actif}
                />
              </g>
            );
          })}
          <text
            x={BARRE.x}
            y={746}
            fill={COLORS.texteDoux}
            fontFamily={FONT_TEXTE}
            fontSize={24}
          >
            {S.regime}
          </text>
          <text
            x={BARRE.x + BARRE.l}
            y={746}
            textAnchor="end"
            fill={COLORS.texte}
            fontFamily={FONT_TITRE}
            fontWeight={700}
            fontSize={30}
          >
            {`${nombreFr(Math.round(regimeAffiche / 50) * 50)} tr/min · ${tousActifs ? S.quatre : S.deux}`}
          </text>
          <rect x={BARRE.x} y={766} width={BARRE.l} height={26} rx={13} fill="rgba(255,255,255,0.06)" />
          <rect
            x={BARRE.x}
            y={766}
            width={(BARRE.l * regimeAffiche) / 7000}
            height={26}
            rx={13}
            fill={tousActifs ? COLORS.bleu : COLORS.bleuProfond}
          />
          <line
            x1={BARRE.x + (BARRE.l * S.seuil) / 7000}
            x2={BARRE.x + (BARRE.l * S.seuil) / 7000}
            y1={758}
            y2={800}
            stroke={COLORS.chaud}
            strokeWidth={4}
          />
          <text
            x={BARRE.x + (BARRE.l * S.seuil) / 7000}
            y={836}
            textAnchor="middle"
            fill={COLORS.chaud}
            fontFamily={FONT_TEXTE}
            fontWeight={600}
            fontSize={24}
          >
            {fr(S.seuilTexte)}
          </text>
        </g>
      </svg>

      <TitreScene numero={5} titre={T.titre} />
      <SousTitres scene="turbos" items={T.sousTitres} />
    </Fond>
  );
};

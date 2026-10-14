import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TEXTES } from "../config";
import { FONT_TEXTE, FONT_TITRE } from "../fonts";
import { ArcAngle } from "../components/ArcAngle";
import { Fond } from "../components/Fond";
import { Carter, Fut } from "../components/MoteurFace";
import { SousTitres } from "../components/SousTitres";
import { TitreScene } from "../components/TitreScene";
import { polaire } from "../components/geometrie";
import { fr } from "../components/texte";

const T = TEXTES.pourquoiW;

// Centre du vilebrequin (vue de face)
const CX = 700;
const CY = 790;

// Couleurs des 4 rangées : VR8 n°1 en bleu, VR8 n°2 en argent
const C_VR1 = [COLORS.bleu, COLORS.bleuClair];
const C_VR2 = [COLORS.argent, "#8f98a6"];

export const Scene2PourquoiW: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (sec: number) => Math.round(sec * fps);

  // Étape A (0–4 s) : V classique ; B (4–8 s) : fermeture à 15° ; C (8–12 s) : ouverture à 90°
  const apparition = spring({ frame, fps, config: { damping: 200 } });
  const fermeture = spring({ frame: frame - s(4.2), fps, config: { damping: 18, mass: 1.2 } });
  const ouverture = spring({ frame: frame - s(8.2), fps, config: { damping: 18, mass: 1.2 } });

  const demiVR = interpolate(fermeture, [0, 1], [30, 7.5]); // demi-angle entre 2 rangées
  const g = interpolate(ouverture, [0, 1], [0, 45]); // demi-angle entre les 2 VR8
  const vr2 = interpolate(frame, [s(8), s(8.4)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const arc15 = interpolate(frame, [s(5.2), s(6.2)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arc90 = interpolate(frame, [s(9.3), s(10.3)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const etape = frame < s(4) ? 0 : frame < s(8) ? 1 : 2;
  const pillule = spring({
    frame: frame - [0, s(4), s(8)][etape],
    fps,
    config: { damping: 200 },
    durationInFrames: 15,
  });

  const rangees = [
    { angle: -g - demiVR, couleur: C_VR1[0], opacite: apparition },
    { angle: -g + demiVR, couleur: C_VR1[1], opacite: apparition },
    { angle: g - demiVR, couleur: C_VR2[0], opacite: vr2 },
    { angle: g + demiVR, couleur: C_VR2[1], opacite: vr2 },
  ];

  // Axes des deux VR8 (pointillés) pour lire l'angle de 90°
  const axe = (a: number) => polaire(CX, CY, 495, a);

  // Vue de dessus : 4 colonnes (rangées) × 4 cylindres, les rangées d'un VR8 sont décalées
  const vueDessus = interpolate(frame, [s(9.5), s(10.2)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const colonnes = [
    { x: 0, dy: 0, c: C_VR1[0] },
    { x: 62, dy: 34, c: C_VR1[1] },
    { x: 196, dy: 0, c: C_VR2[0] },
    { x: 258, dy: 34, c: C_VR2[1] },
  ];

  return (
    <Fond>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {/* axes des VR8 */}
        <g opacity={arc90} stroke={COLORS.argentFonce} strokeWidth={2} strokeDasharray="8 10">
          <line x1={CX} y1={CY} x2={axe(-g).x} y2={axe(-g).y} />
          <line x1={CX} y1={CY} x2={axe(g).x} y2={axe(g).y} />
        </g>
        {rangees.map((r, i) => (
          <Fut key={i} cx={CX} cy={CY} rangee={r} />
        ))}
        <g opacity={apparition}>
          <Carter cx={CX} cy={CY} largeur={interpolate(ouverture, [0, 1], [240, 330])} />
        </g>
        <ArcAngle cx={CX} cy={CY} r={425} de={-g - demiVR} a={-g + demiVR} texte="15°" progression={arc15} />
        <ArcAngle
          cx={CX}
          cy={CY}
          r={495}
          de={-g}
          a={g}
          texte="90°"
          progression={arc90}
          couleur={COLORS.argent}
        />

        {/* Vue de dessus */}
        <g opacity={vueDessus} transform="translate(1330 380)">
          <rect x={-60} y={-60} width={440} height={420} rx={24} fill={COLORS.panneau} stroke={COLORS.bordure} />
          {colonnes.map((col, i) =>
            [0, 1, 2, 3].map((j) => {
              const k = i * 4 + j;
              const p = interpolate(frame, [s(9.8) + k * 2, s(9.8) + k * 2 + 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <circle
                  key={k}
                  cx={col.x + 30}
                  cy={j * 72 + col.dy + 20}
                  r={26 * p}
                  fill={col.c}
                  fillOpacity={0.3}
                  stroke={col.c}
                  strokeWidth={3}
                />
              );
            }),
          )}
        </g>
      </svg>

      <TitreScene numero={2} titre={T.titre} />

      {/* Étape en cours */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 170,
          padding: "12px 26px",
          borderRadius: 999,
          background: "rgba(47,107,255,0.16)",
          border: `1px solid ${COLORS.bleu}`,
          fontFamily: FONT_TITRE,
          fontWeight: 600,
          fontSize: 34,
          color: COLORS.texte,
          opacity: pillule,
          transform: `translateY(${interpolate(pillule, [0, 1], [10, 0])}px)`,
        }}
      >
        {fr(T.etapes[etape])}
      </div>

      {/* Légende de la vue de dessus */}
      <div
        style={{
          position: "absolute",
          left: 1270,
          width: 440,
          top: 230,
          textAlign: "center",
          opacity: vueDessus,
          fontFamily: FONT_TEXTE,
          color: COLORS.texte,
        }}
      >
        <div style={{ fontSize: 26, color: COLORS.texteDoux, fontWeight: 500 }}>{T.vueDessus}</div>
        <div style={{ fontSize: 34, fontWeight: 700, fontFamily: FONT_TITRE }}>{fr(T.vueDessusDetail)}</div>
      </div>

      <SousTitres items={T.sousTitres} />
    </Fond>
  );
};

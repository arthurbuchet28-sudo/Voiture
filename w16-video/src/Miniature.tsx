import { AbsoluteFill } from "remotion";
import { COLORS } from "./config";
import { FONT_TEXTE, FONT_TITRE } from "./fonts";
import { arcPath, polaire } from "./components/geometrie";
import { SilhouetteW16 } from "./components/MoteurFace";

/** Miniature 1280×720 de la vidéo (image fixe, rendue avec `npm run miniature`). */
export const MINIATURE = {
  surtitre: "EXPLIQUÉ EN 2 MIN",
  titre: "W16",
  accroche: ["16 cylindres, 4 turbos :", "comment ça marche ?"],
  badge: ["1 600", "ch"],
} as const;

const CX = 975; // vilebrequin du moteur dessiné
const CY = 610;
const ECHELLE = 0.86;

export const Miniature: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at 72% 55%, #16306f 0%, #0d1424 38%, ${COLORS.fond} 70%)`,
      overflow: "hidden",
    }}
  >
    {/* faisceaux lumineux */}
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(115deg, transparent 52%, rgba(127,176,255,0.10) 56%, transparent 61%), linear-gradient(115deg, transparent 63%, rgba(127,176,255,0.06) 66%, transparent 70%)",
      }}
    />
    <svg width={1280} height={720} style={{ position: "absolute" }}>
      <defs>
        <radialGradient id="halo-bleu">
          <stop offset="0%" stopColor={COLORS.bleu} stopOpacity={0.55} />
          <stop offset="100%" stopColor={COLORS.bleu} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="halo-chaud">
          <stop offset="0%" stopColor={COLORS.chaud} stopOpacity={0.55} />
          <stop offset="100%" stopColor={COLORS.chaud} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g
        transform={`translate(${CX} ${CY}) scale(${ECHELLE}) translate(${-CX} ${-CY})`}
      >
        <ellipse
          cx={CX}
          cy={CY - 170}
          rx={360}
          ry={260}
          fill="url(#halo-bleu)"
        />
        <ellipse
          cx={CX}
          cy={CY + 10}
          rx={220}
          ry={90}
          fill="url(#halo-chaud)"
        />
        {/* arc 90° entre les deux VR8 */}
        <path
          d={arcPath(CX, CY, 440, -45, 45)}
          fill="none"
          stroke={COLORS.bleuClair}
          strokeWidth={5}
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
        {[-45, 45].map((a) => {
          const p = polaire(CX, CY, 440, a);
          return (
            <circle key={a} cx={p.x} cy={p.y} r={7} fill={COLORS.bleuClair} />
          );
        })}
        <SilhouetteW16 cx={CX} cy={CY} />
      </g>
    </svg>

    {/* texte */}
    <div style={{ position: "absolute", left: 64, top: 70, width: 640 }}>
      <div
        style={{
          display: "inline-block",
          padding: "8px 20px",
          borderRadius: 10,
          background: COLORS.bleu,
          fontFamily: FONT_TITRE,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: 2,
          color: "#fff",
        }}
      >
        {MINIATURE.surtitre}
      </div>
      <div
        style={{
          fontFamily: FONT_TITRE,
          fontWeight: 900,
          fontSize: 250,
          lineHeight: 0.95,
          marginTop: 18,
          letterSpacing: -6,
          background:
            "linear-gradient(180deg, #ffffff 0%, #dfe4ea 45%, #8f98a6 70%, #e9edf2 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))",
        }}
      >
        {MINIATURE.titre}
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: FONT_TITRE,
          fontWeight: 800,
          fontSize: 50,
          lineHeight: 1.12,
          color: COLORS.texte,
          textShadow: "0 4px 18px rgba(0,0,0,0.7)",
        }}
      >
        <div>{MINIATURE.accroche[0].replace(" :", " :")}</div>
        <div style={{ color: COLORS.bleuClair }}>
          {MINIATURE.accroche[1].replace(" ?", " ?")}
        </div>
      </div>
    </div>

    {/* badge puissance */}
    <div
      style={{
        position: "absolute",
        right: 46,
        top: 40,
        width: 190,
        height: 190,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 30%, #ffb15c, ${COLORS.chaud} 45%, #c2410c)`,
        boxShadow: "0 10px 40px rgba(255,138,42,0.45)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(8deg)",
        color: "#fff",
      }}
    >
      <div
        style={{
          fontFamily: FONT_TITRE,
          fontWeight: 900,
          fontSize: 56,
          lineHeight: 1,
        }}
      >
        {MINIATURE.badge[0].replace(" ", " ")}
      </div>
      <div style={{ fontFamily: FONT_TEXTE, fontWeight: 700, fontSize: 32 }}>
        {MINIATURE.badge[1]}
      </div>
    </div>
  </AbsoluteFill>
);

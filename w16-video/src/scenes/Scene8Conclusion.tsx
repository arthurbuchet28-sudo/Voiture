import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, reperes, TEXTES } from "../config";
import { FONT_TITRE } from "../fonts";
import { Fond } from "../components/Fond";
import { SilhouetteW16 } from "../components/MoteurFace";
import { fr } from "../components/texte";

const T = TEXTES.conclusion;
const R = reperes("conclusion").map((r) => r.debut);

export const Scene8Conclusion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const l1 = spring({ frame: frame - Math.round(R[0] * fps), fps, config: { damping: 200 } });
  const l2 = spring({ frame: frame - Math.round(R[1] * fps), fps, config: { damping: 200 } });
  // Fondu au noir sur les 20 dernières images
  const noir = interpolate(frame, [durationInFrames - 20, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Fond>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <g opacity={0.18} transform="translate(960 300) scale(0.5) translate(-960 -500)">
          <SilhouetteW16 cx={960} cy={500} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT_TITRE,
        }}
      >
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            color: COLORS.texte,
            opacity: l1,
            transform: `translateY(${interpolate(l1, [0, 1], [20, 0])}px)`,
          }}
        >
          {fr(T.lignes[0])}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: COLORS.argent,
            marginTop: 20,
            opacity: l2,
            transform: `translateY(${interpolate(l2, [0, 1], [20, 0])}px)`,
          }}
        >
          {fr(T.lignes[1])}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: noir }} />
    </Fond>
  );
};

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../config";
import { FONT_TITRE } from "../fonts";
import { fr } from "./texte";

/** Titre de scène en haut à gauche : numéro + intitulé, avec un trait bleu. */
export const TitreScene: React.FC<{ numero: number; titre: string }> = ({ numero, titre }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 64,
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [-40, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT_TITRE,
          fontWeight: 600,
          fontSize: 28,
          color: COLORS.bleuClair,
          letterSpacing: 2,
        }}
      >
        {String(numero).padStart(2, "0")}
      </div>
      <div style={{ width: 4, height: 52, background: COLORS.bleu, borderRadius: 2 }} />
      <div style={{ fontFamily: FONT_TITRE, fontWeight: 700, fontSize: 52, color: COLORS.texte }}>
        {fr(titre)}
      </div>
    </div>
  );
};

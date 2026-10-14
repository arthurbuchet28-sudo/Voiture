import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONDU_SOUS_TITRE, type SousTitre } from "../config";
import { FONT_TEXTE } from "../fonts";
import { fr } from "./texte";

/** Affiche le sous-titre actif en bas de l'écran, avec fondu d'entrée et de sortie. */
export const SousTitres: React.FC<{ items: readonly SousTitre[] }> = ({ items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {items.map((st, i) => {
        const de = Math.round(st.de * fps);
        const a = Math.round(st.a * fps);
        if (frame < de || frame >= a) return null;
        const opacity = interpolate(
          frame,
          [de, de + FONDU_SOUS_TITRE, a - FONDU_SOUS_TITRE, a],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 48,
              display: "flex",
              justifyContent: "center",
              opacity,
              transform: `translateY(${interpolate(opacity, [0, 1], [12, 0])}px)`,
            }}
          >
            <div
              style={{
                background: COLORS.panneau,
                border: `1px solid ${COLORS.bordure}`,
                borderRadius: 14,
                padding: "18px 40px",
                maxWidth: 1500,
                textAlign: "center",
                fontFamily: FONT_TEXTE,
                fontWeight: 500,
                fontSize: 40,
                lineHeight: 1.35,
                color: COLORS.texte,
              }}
            >
              {st.lignes.map((l, j) => (
                <div key={j} style={{ whiteSpace: "nowrap" }}>
                  {fr(l)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DUREES, FONDU_SOUS_TITRE, reperes, type CleScene, type SousTitre } from "../config";
import { FONT_TEXTE } from "../fonts";
import { fr } from "./texte";

/**
 * Horaires (secondes depuis le début de la scène) de chaque sous-titre : il apparaît au début
 * de sa phrase de voix off et reste jusqu'au sous-titre suivant ou jusqu'à la fin de la scène.
 */
export const horairesSousTitres = (scene: CleScene, items: readonly SousTitre[]) => {
  const r = reperes(scene);
  return items.map((st, i) => ({
    lignes: st.lignes,
    de: r[st.phrase].debut,
    a: i + 1 < items.length ? r[items[i + 1].phrase].debut : DUREES[scene],
  }));
};

/** Affiche le sous-titre actif en bas de l'écran, avec fondu d'entrée et de sortie. */
export const SousTitres: React.FC<{ scene: CleScene; items: readonly SousTitre[] }> = ({ scene, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {horairesSousTitres(scene, items).map((st, i) => {
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

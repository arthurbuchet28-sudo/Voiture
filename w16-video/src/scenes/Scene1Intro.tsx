import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TEXTES } from "../config";
import { FONT_TEXTE, FONT_TITRE } from "../fonts";
import { Fond } from "../components/Fond";
import { SilhouetteW16 } from "../components/MoteurFace";
import { fr } from "../components/texte";

const T = TEXTES.intro;

export const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const silhouette = interpolate(frame, [0, 45], [0, 1], { extrapolateRight: "clamp" });
  const zoom = interpolate(frame, [0, 8 * fps], [0.94, 1.02]);
  const titre1 = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const titre2 = spring({ frame: frame - 32, fps, config: { damping: 200 } });
  const sousTitre = spring({ frame: frame - 60, fps, config: { damping: 200 } });
  const trait = spring({ frame: frame - 50, fps, config: { damping: 200 }, durationInFrames: 40 });

  return (
    <Fond>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <g
          opacity={silhouette * 0.9}
          transform={`translate(960 330) scale(${0.62 * zoom}) translate(-960 -330)`}
        >
          <SilhouetteW16 cx={960} cy={500} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          top: 560,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT_TITRE,
          color: COLORS.texte,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: -1,
            opacity: titre1,
            transform: `translateY(${interpolate(titre1, [0, 1], [30, 0])}px)`,
          }}
        >
          {fr(T.titre[0])}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            marginTop: 8,
            color: COLORS.argent,
            opacity: titre2,
            transform: `translateY(${interpolate(titre2, [0, 1], [30, 0])}px)`,
          }}
        >
          {fr(T.titre[1])}
        </div>
        <div
          style={{
            width: interpolate(trait, [0, 1], [0, 220]),
            height: 4,
            background: COLORS.bleu,
            margin: "36px auto 30px",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontFamily: FONT_TEXTE,
            fontSize: 40,
            fontWeight: 500,
            color: COLORS.bleuClair,
            opacity: sousTitre,
          }}
        >
          {fr(T.sousTitre)}
        </div>
      </div>
    </Fond>
  );
};

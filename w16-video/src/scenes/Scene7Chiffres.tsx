import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { CHIFFRES, COLORS, TEXTES } from "../config";
import { FONT_TEXTE, FONT_TITRE } from "../fonts";
import { Fond } from "../components/Fond";
import { TitreScene } from "../components/TitreScene";
import { fr, nombreFr } from "../components/texte";

const T = TEXTES.chiffres;
const MAX_CH = Math.max(...CHIFFRES.puissances.map((p) => p.ch));

/** Compteur qui défile de 0 à `valeur` entre `debut` et `debut + duree` (en images). */
const useCompteur = (valeur: number, debut: number, duree: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [debut, debut + duree], [0, valeur], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
};

const Tuile: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const item = CHIFFRES.fiche[index];
  const debut = 8 + index * 6;
  const p = spring({ frame: frame - debut, fps, config: { damping: 200 } });
  const v = useCompteur(item.valeur, debut, 40);
  return (
    <div
      style={{
        width: 380,
        padding: "28px 32px",
        borderRadius: 20,
        background: COLORS.panneau,
        border: `1px solid ${COLORS.bordure}`,
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`,
      }}
    >
      <div style={{ fontFamily: FONT_TEXTE, fontSize: 28, color: COLORS.texteDoux, fontWeight: 500 }}>
        {item.label}
      </div>
      <div style={{ fontFamily: FONT_TITRE, fontSize: 84, fontWeight: 800, color: COLORS.texte, lineHeight: 1.1 }}>
        {nombreFr(v, item.decimales)}
        {item.unite ? (
          <span style={{ fontSize: 36, fontWeight: 600, color: COLORS.argent, marginLeft: 12 }}>{item.unite}</span>
        ) : null}
      </div>
    </div>
  );
};

const BarrePuissance: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const item = CHIFFRES.puissances[index];
  const debut = 40 + index * 12;
  const p = spring({ frame: frame - debut, fps, config: { damping: 200 } });
  const v = useCompteur(item.ch, debut, 50);
  const LARGEUR_MAX = 900;
  return (
    <div style={{ display: "flex", alignItems: "center", height: 84, opacity: p }}>
      <div
        style={{
          width: 560,
          fontFamily: FONT_TEXTE,
          fontSize: 32,
          fontWeight: 600,
          color: COLORS.texte,
        }}
      >
        {item.modele}
      </div>
      <div
        style={{
          width: (LARGEUR_MAX * v) / MAX_CH,
          height: 50,
          borderRadius: 12,
          background: `linear-gradient(90deg, ${COLORS.bleuProfond}, ${index === 2 ? COLORS.bleuClair : COLORS.bleu})`,
        }}
      />
      <div
        style={{
          marginLeft: 24,
          fontFamily: FONT_TITRE,
          fontSize: 44,
          fontWeight: 800,
          color: COLORS.texte,
          whiteSpace: "nowrap",
        }}
      >
        {nombreFr(Math.round(v))}
        <span style={{ fontSize: 30, color: COLORS.argent, marginLeft: 10 }}>ch</span>
      </div>
    </div>
  );
};

export const Scene7Chiffres: React.FC = () => (
  <Fond>
    <TitreScene numero={7} titre={T.titre} />
    <div style={{ position: "absolute", left: 96, right: 96, top: 200, display: "flex", justifyContent: "space-between" }}>
      {CHIFFRES.fiche.map((_, i) => (
        <Tuile key={i} index={i} />
      ))}
    </div>
    <div style={{ position: "absolute", left: 96, top: 520 }}>
      <div
        style={{
          fontFamily: FONT_TITRE,
          fontSize: 34,
          fontWeight: 700,
          color: COLORS.bleuClair,
          marginBottom: 24,
          letterSpacing: 1,
        }}
      >
        {fr(T.puissance)}
      </div>
      {CHIFFRES.puissances.map((_, i) => (
        <BarrePuissance key={i} index={i} />
      ))}
    </div>
  </Fond>
);

import { COLORS } from "../config";
import { FONT_TITRE } from "../fonts";
import { arcPath, polaire } from "./geometrie";

/** Arc annoté (ex. « 15° ») tracé progressivement selon `progression` (0 → 1). */
export const ArcAngle: React.FC<{
  cx: number;
  cy: number;
  r: number;
  de: number;
  a: number;
  texte: string;
  progression: number;
  couleur?: string;
  decalageTexte?: number;
}> = ({ cx, cy, r, de, a, texte, progression, couleur = COLORS.bleuClair, decalageTexte = 44 }) => {
  const milieu = polaire(cx, cy, r + decalageTexte, (de + a) / 2);
  return (
    <g opacity={Math.min(1, progression * 3)}>
      <path
        d={arcPath(cx, cy, r, de, a)}
        fill="none"
        stroke={couleur}
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progression}
      />
      <text
        x={milieu.x}
        y={milieu.y}
        fill={couleur}
        fontFamily={FONT_TITRE}
        fontWeight={700}
        fontSize={38}
        textAnchor="middle"
        dominantBaseline="central"
        opacity={progression}
      >
        {texte}
      </text>
    </g>
  );
};

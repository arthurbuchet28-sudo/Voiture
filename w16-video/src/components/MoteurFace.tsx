import { COLORS } from "../config";

/**
 * Vue de face schématique d'un moteur : chaque « rangée » de cylindres est un fût incliné
 * autour du vilebrequin (cx, cy). Les angles sont mesurés depuis la verticale.
 */
export type Rangee = { angle: number; couleur: string; opacite?: number };

const LARGEUR = 78;
const DEBUT = 70; // distance vilebrequin → bas du fût
const LONGUEUR = 250; // longueur du fût
const CULASSE = 46;

export const Fut: React.FC<{ cx: number; cy: number; rangee: Rangee; metal?: boolean }> = ({
  cx,
  cy,
  rangee,
  metal,
}) => {
  const haut = cy - DEBUT - LONGUEUR;
  return (
    <g transform={`rotate(${rangee.angle} ${cx} ${cy})`} opacity={rangee.opacite ?? 1}>
      {/* fût du cylindre */}
      <rect
        x={cx - LARGEUR / 2}
        y={haut}
        width={LARGEUR}
        height={LONGUEUR}
        rx={8}
        fill={metal ? "url(#metal)" : rangee.couleur}
        fillOpacity={metal ? 1 : 0.22}
        stroke={metal ? "#2a3038" : rangee.couleur}
        strokeWidth={3}
      />
      {/* piston */}
      {metal ? null : <rect
        x={cx - LARGEUR / 2 + 10}
        y={haut + 90}
        width={LARGEUR - 20}
        height={56}
        rx={6}
        fill={rangee.couleur}
        fillOpacity={0.85}
      />}
      {/* culasse */}
      <rect
        x={cx - LARGEUR / 2 - 10}
        y={haut - CULASSE}
        width={LARGEUR + 20}
        height={CULASSE}
        rx={10}
        fill={metal ? "url(#metal)" : COLORS.fondClair}
        stroke={metal ? "#2a3038" : rangee.couleur}
        strokeWidth={3}
      />
    </g>
  );
};

/** Carter + vilebrequin, dessiné sous les fûts. */
export const Carter: React.FC<{ cx: number; cy: number; largeur: number; metal?: boolean }> = ({
  cx,
  cy,
  largeur,
  metal,
}) => (
  <g>
    <rect
      x={cx - largeur / 2}
      y={cy - 40}
      width={largeur}
      height={120}
      rx={40}
      fill={metal ? "url(#metal)" : COLORS.fondClair}
      stroke={COLORS.argentFonce}
      strokeWidth={3}
    />
    <circle cx={cx} cy={cy} r={22} fill={COLORS.fond} stroke={COLORS.argent} strokeWidth={4} />
  </g>
);

/** Dégradé « métal brossé » à placer une fois dans <defs>. */
export const DefsMetal: React.FC = () => (
  <defs>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#e6e9ee" />
      <stop offset="35%" stopColor="#9aa1ac" />
      <stop offset="60%" stopColor="#d4d8de" />
      <stop offset="100%" stopColor="#5d646f" />
    </linearGradient>
  </defs>
);

/** Silhouette complète du W16 (4 rangées) en métal, pour l'intro et la conclusion. */
export const SilhouetteW16: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => {
  const rangees: Rangee[] = [-52.5, -37.5, 37.5, 52.5].map((angle, i) => ({
    angle,
    couleur: i < 2 ? COLORS.bleuClair : COLORS.argent,
  }));
  return (
    <g>
      <DefsMetal />
      {rangees.map((r, i) => (
        <Fut key={i} cx={cx} cy={cy} rangee={r} metal />
      ))}
      <Carter cx={cx} cy={cy} largeur={300} metal />
    </g>
  );
};

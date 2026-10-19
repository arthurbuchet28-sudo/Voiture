/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURATION DE LA PUB « PERDRISET FUN » (version ludique)
 *  Textes, durées des scènes et des transitions (en frames, 60 fps).
 *  Tempo de référence : 120 BPM → un temps = 30 frames.
 * ─────────────────────────────────────────────────────────────
 */
export const FUN = {
  hook: [["Votre", "jardin"], ["mérite", "le meilleur."]],
  baseline: ["Votre spécialiste motoculture", "à Bourg-en-Bresse"],
  universes: [
    { title: "Tondre", image: "pelouse.jpg", fx: "grass" },
    { title: "Scier & couper", image: "scier-couper.jpg", fx: "chips" },
    { title: "Nettoyer", image: "nettoyer.jpg", fx: "leaves" },
    { title: "Entretenir", image: "balayeuse.jpg", fx: "wrench" },
  ],
  brandsTitle: "Nos marques phares",
  brands: ["Stihl", "Grin", "Pubert", "Cub Cadet", "Iseki", "Ego", "Kress", "Segway"],
  servicesTitle: "Nos services",
  services: ["Réparation toutes marques", "Forfait entretien annuel", "Location", "Occasions"],
  trust: { value: 30, label: "ans d'expertise", mini: ["Une équipe de passionnés", "Particuliers & professionnels"] },
  sites: "Bourg-en-Bresse & Simandre-sur-Suran",
  url: "perdriset.fr",
  phone: "04 74 22 31 26",

  /** Durée de chaque scène (frames), transitions comprises. */
  scenes: {
    hook: 180,
    logo: 210,
    universe: 106,
    brands: 294,
    services: 288,
    trust: 252,
    outro: 290,
  },
  /** Durée de chaque transition (frames). */
  transitions: {
    mower: 36,
    zoomGear: 30,
    saw: 24,
    blow: 24,
    iris: 24,
    whip: 18,
    cards: 36,
    morph: 30,
    leafRain: 36,
  },
  fps: 60,
  width: 1920,
  height: 1080,
} as const;

const S = FUN.scenes;
const T = FUN.transitions;
export const FUN_TOTAL_FRAMES =
  S.hook + S.logo + 4 * S.universe + S.brands + S.services + S.trust + S.outro -
  Object.values(T).reduce((a, b) => a + b, 0);

/** Rectangle de la dernière ligne de services et de la carte « confiance » (pour le morph). */
export const MORPH = {
  row: { x: 820, y: 740, w: 900, h: 118, r: 26 },
  card: { x: 250, y: 220, w: 1420, h: 640, r: 48 },
};

/** Position du logo à l'écran (scène logo) et centre de sa roue dentée. */
export const LOGO_POS = { x: 510, y: 170, w: 900 };
export const GEAR = { cx: LOGO_POS.x + 175 * (900 / 1248), cy: LOGO_POS.y + 160 * (900 / 1248), r: 128 };

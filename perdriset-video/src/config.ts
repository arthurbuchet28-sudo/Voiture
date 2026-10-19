/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURATION DE LA PUB « PERDRISET MOTOCULTURE » — tout se règle ici
 *  (même architecture que la pub Promptly : textes, couleurs, durées)
 * ─────────────────────────────────────────────────────────────
 */
export const CONFIG = {
  // Identité
  name: "Perdriset Motoculture",
  url: "perdriset.fr",
  phone: "04 74 22 31 26",
  sites: "Bourg-en-Bresse & Simandre-sur-Suran",

  // Couleurs extraites du logo (toute la palette en est dérivée)
  accent: "#5ABB47", // vert du logo : glow, traînées, boutons
  accent2: "#187C51", // vert profond de l'herbe du logo : dégradés, particules
  background: {
    center: "#0E2114",
    edge: "#020504",
  },

  fontFamily:
    "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",

  // Scène 1 : accroche
  hook: ["Votre jardin", "mérite le meilleur."],

  // Scène 2 : logo + baseline
  baseline: ["Votre spécialiste motoculture", "à Bourg-en-Bresse"],

  // Scène 3 : les 4 univers (photos du site perdriset.fr, dans public/)
  universes: [
    { title: "Tondre", image: "pelouse.jpg" },
    { title: "Scier & couper", image: "scier-couper.jpg" },
    { title: "Nettoyer", image: "nettoyer.jpg" },
    { title: "Entretenir", image: "balayeuse.jpg" },
  ],

  // Scène 4 : marques (texte stylisé, pas de logos)
  brandsEyebrow: "Nos marques phares",
  brands: ["Stihl", "Honda", "John Deere", "Cub Cadet", "Iseki", "Ego", "Kress", "Segway"],

  // Scène 5 : services
  servicesTitle: "Nos services",
  services: ["Réparation toutes marques", "Forfait entretien annuel", "Location", "Occasions"],

  // Scène 6 : confiance
  trust: {
    value: 30,
    label: "ans d'expertise",
    eyebrow: "Bourg-en-Bresse et sa région",
    mini: ["Une équipe de passionnés", "Particuliers & professionnels"],
  },

  // Durées (secondes) — la durée totale en découle (28 s)
  durations: {
    hook: 3,
    logo: 3,
    universes: 5,
    brands: 4,
    services: 4.8,
    trust: 4,
    outro: 4.2,
  },
  transition: 0.4,

  width: 1920,
  height: 1080,
  fps: 60,
} as const;

export const sec = (s: number) => Math.round(s * CONFIG.fps);

export const TOTAL_FRAMES = Object.values(CONFIG.durations).reduce((acc, s) => acc + sec(s), 0);

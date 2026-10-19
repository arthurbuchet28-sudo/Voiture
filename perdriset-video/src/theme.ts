import { makePalette, mix } from "./lib/utils";
import { CONFIG } from "./config";

/** Palettes dérivées des deux couleurs de la config. */
export const A = makePalette(CONFIG.accent);
export const B = makePalette(CONFIG.accent2);

/** Dégradé signature accent → accent2. */
export const brandGradient = (angle = 135) => `linear-gradient(${angle}deg, ${A.light} 0%, ${A.base} 45%, ${B.base} 120%)`;

export const ui = {
  card: "rgba(255,255,255,0.06)",
  cardSolid: mix(CONFIG.background.center, "#000000", 0.25),
  border: "rgba(255,255,255,0.1)",
  text: "#F5F7F4",
  muted: "#A9B5AC",
  faint: "#6E7C72",
  radius: 22,
};

export const font = {
  fontFamily: CONFIG.fontFamily,
  color: ui.text,
  WebkitFontSmoothing: "antialiased",
} as const;

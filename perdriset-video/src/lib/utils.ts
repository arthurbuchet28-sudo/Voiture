import { Easing } from "remotion";
import { CONFIG } from "../config";

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/** Mélange deux couleurs hex (t = 0 → a, t = 1 → b). */
export const mix = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(lerp(v, cb[i], t)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

/** Palette complète dérivée d'une seule couleur. */
export const makePalette = (hex: string) => ({
  base: hex,
  light: mix(hex, "#ffffff", 0.45),
  pale: mix(hex, "#ffffff", 0.75),
  deep: mix(hex, "#000000", 0.45),
  a: (alpha: number) => rgba(hex, alpha),
});

/** Palette dérivée de la couleur d'accent. */
export const accent = makePalette(CONFIG.accent);

/** Format français : 102.5 → "102,5". */
export const formatNumber = (v: number, decimals: number) =>
  v.toFixed(decimals).replace(".", ",");

export const ease = {
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.45, 0, 0.2, 1),
};

/** Glow néon empilé (bloom) pour box-shadow. */
export const glow = (hex: string, strength = 1) =>
  [
    `0 0 ${8 * strength}px ${rgba(hex, 0.55)}`,
    `0 0 ${28 * strength}px ${rgba(hex, 0.35)}`,
    `0 0 ${80 * strength}px ${rgba(hex, 0.25)}`,
  ].join(", ");

export const textGlow = (hex: string, strength = 1) =>
  [
    `0 0 ${6 * strength}px ${rgba(hex, 0.6)}`,
    `0 0 ${24 * strength}px ${rgba(hex, 0.4)}`,
    `0 0 ${60 * strength}px ${rgba(hex, 0.25)}`,
  ].join(", ");

import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONTS } from "./config";

/**
 * Polices Google Fonts (licence SIL OFL) embarquées dans public/fonts/ pour un rendu
 * identique hors ligne. Ce sont des polices variables : toutes les graisses de 100 à 900.
 */
loadFont({ family: FONTS.titre, url: staticFile("fonts/Montserrat-latin.woff2"), weight: "100 900" });
loadFont({ family: FONTS.texte, url: staticFile("fonts/Inter-latin.woff2"), weight: "100 900" });

export const FONT_TITRE = `"${FONTS.titre}", sans-serif`;
export const FONT_TEXTE = `"${FONTS.texte}", sans-serif`;

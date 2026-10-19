import { loadFont } from "@remotion/google-fonts/Inter";

// Inter ExtraBold / Black : sans-serif grasse et moderne pour toute la typo.
export const { fontFamily } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});

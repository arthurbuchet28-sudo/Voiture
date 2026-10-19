import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import { continueRender, delayRender } from "remotion";

/** Attend que toutes les graisses d'Inter soient chargées avant de rendre la première image. */
export const waitForFonts = () => {
  if (typeof document === "undefined") return;
  const handle = delayRender("Chargement de la police Inter");
  Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Inter`)))
    .then(() => document.fonts.ready)
    .finally(() => continueRender(handle));
};

import { Composition } from "remotion";
import { DUREES, TEXTES, VIDEO, type CleScene } from "./config";
import { horairesSousTitres } from "./components/SousTitres";
import { DUREE_TOTALE_IMAGES, W16Video } from "./W16Video";

const DUREE_ATTENDUE_S = Object.values(DUREES).reduce((s, d) => s + d, 0);
if (Math.abs(DUREE_TOTALE_IMAGES / VIDEO.fps - DUREE_ATTENDUE_S) > 0.05) {
  throw new Error(
    `Durée incohérente : ${DUREE_TOTALE_IMAGES / VIDEO.fps} s calculées pour ${DUREE_ATTENDUE_S} s attendues.`,
  );
}

// Chaque sous-titre doit rester au moins 3 s à l'écran.
for (const [scene, textes] of Object.entries(TEXTES)) {
  if (!("sousTitres" in textes)) continue;
  for (const st of horairesSousTitres(scene as CleScene, textes.sousTitres)) {
    if (st.a - st.de < 3) {
      throw new Error(`Sous-titre trop court (${(st.a - st.de).toFixed(2)} s) : « ${st.lignes.join(" ")} »`);
    }
  }
}

export const RemotionRoot: React.FC = () => (
  <Composition
    id={VIDEO.id}
    component={W16Video}
    durationInFrames={DUREE_TOTALE_IMAGES}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);

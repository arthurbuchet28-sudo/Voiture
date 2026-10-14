import { Composition } from "remotion";
import { DUREES, VIDEO } from "./config";
import { DUREE_TOTALE_IMAGES, W16Video } from "./W16Video";

const DUREE_ATTENDUE_S = Object.values(DUREES).reduce((s, d) => s + d, 0);
if (Math.abs(DUREE_TOTALE_IMAGES / VIDEO.fps - DUREE_ATTENDUE_S) > 0.05) {
  throw new Error(
    `Durée incohérente : ${DUREE_TOTALE_IMAGES / VIDEO.fps} s calculées pour ${DUREE_ATTENDUE_S} s attendues.`,
  );
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

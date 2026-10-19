import React from "react";
import { Composition } from "remotion";
import { CocaColaAd } from "./CocaColaAd";
import { TOTAL_FRAMES, VIDEO } from "./config";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={VIDEO.id}
      component={CocaColaAd}
      durationInFrames={TOTAL_FRAMES}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};

import React from "react";
import { Composition } from "remotion";
import { CONFIG, TOTAL_FRAMES } from "./config";
import { waitForFonts } from "./fonts";
import { Perdriset } from "./Perdriset";

waitForFonts();

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Perdriset"
    component={Perdriset}
    durationInFrames={TOTAL_FRAMES}
    fps={CONFIG.fps}
    width={CONFIG.width}
    height={CONFIG.height}
  />
);

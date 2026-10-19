import React from "react";
import { Composition } from "remotion";
import { CONFIG, TOTAL_FRAMES } from "./config";
import { waitForFonts } from "./fonts";
import { Perdriset } from "./Perdriset";
import { FUN, FUN_TOTAL_FRAMES } from "./fun/config";
import { PerdrisetFun } from "./fun/PerdrisetFun";

waitForFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Perdriset"
      component={Perdriset}
      durationInFrames={TOTAL_FRAMES}
      fps={CONFIG.fps}
      width={CONFIG.width}
      height={CONFIG.height}
    />
    {/* Version ludique et dynamique */}
    <Composition
      id="PerdrisetFun"
      component={PerdrisetFun}
      durationInFrames={FUN_TOTAL_FRAMES}
      fps={FUN.fps}
      width={FUN.width}
      height={FUN.height}
    />
  </>
);

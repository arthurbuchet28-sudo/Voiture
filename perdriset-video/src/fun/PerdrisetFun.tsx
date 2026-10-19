import React from "react";
import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { Background, Grain } from "../components/Background";
import { Camera } from "../lib/timeline";
import { CONFIG } from "../config";
import { FUN } from "./config";
import { Brands } from "./scenes/Brands";
import { Hook } from "./scenes/Hook";
import { Logo } from "./scenes/Logo";
import { Outro } from "./scenes/Outro";
import { Services } from "./scenes/Services";
import { Trust } from "./scenes/Trust";
import { Universe } from "./scenes/Universe";
import { blow, cards, iris, leafRain, morph, mower, saw, whip, zoomGear } from "./transitions/presentations";

const S = FUN.scenes;
const T = FUN.transitions;
const lt = (d: number) => linearTiming({ durationInFrames: d });

/** Version ludique : 7 scènes, 9 transitions toutes différentes (aucun fondu simple). */
export const PerdrisetFun: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CONFIG.background.edge }}>
    <Background center={CONFIG.background.center} edge={CONFIG.background.edge} color={CONFIG.accent} />
    <Camera>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S.hook}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={mower()} timing={lt(T.mower)} />
        <TransitionSeries.Sequence durationInFrames={S.logo}>
          <Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomGear()} timing={lt(T.zoomGear)} />
        <TransitionSeries.Sequence durationInFrames={S.universe}>
          <Universe index={0} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={saw()} timing={lt(T.saw)} />
        <TransitionSeries.Sequence durationInFrames={S.universe}>
          <Universe index={1} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={blow()} timing={lt(T.blow)} />
        <TransitionSeries.Sequence durationInFrames={S.universe}>
          <Universe index={2} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={iris()} timing={lt(T.iris)} />
        <TransitionSeries.Sequence durationInFrames={S.universe}>
          <Universe index={3} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whip()} timing={lt(T.whip)} />
        <TransitionSeries.Sequence durationInFrames={S.brands}>
          <Brands />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={cards()} timing={lt(T.cards)} />
        <TransitionSeries.Sequence durationInFrames={S.services}>
          <Services />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={morph()} timing={lt(T.morph)} />
        <TransitionSeries.Sequence durationInFrames={S.trust}>
          <Trust />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={leafRain()} timing={lt(T.leafRain)} />
        <TransitionSeries.Sequence durationInFrames={S.outro}>
          <Outro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </Camera>
    <Grain />
  </AbsoluteFill>
);

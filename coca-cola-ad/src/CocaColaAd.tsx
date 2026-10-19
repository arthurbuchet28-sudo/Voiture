import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { SoundTrack } from "./components/SoundTrack";
import { COLORS, TRANSITION_FRAMES, VIDEO, sequenceFrames } from "./config";
import { Climax } from "./scenes/Climax";
import { Emotion } from "./scenes/Emotion";
import { Hook } from "./scenes/Hook";
import { Packshot } from "./scenes/Packshot";
import { Reveal } from "./scenes/Reveal";
import { Tension } from "./scenes/Tension";
import { zoom } from "./transitions/zoom";

/** Timing commun : rapide, avec accélération / décélération marquées. */
const timing = (frames: number) =>
  linearTiming({ durationInFrames: frames, easing: Easing.inOut(Easing.cubic) });

/**
 * Composition principale : les six scènes enchaînées par des transitions
 * en mouvement (aucun cut sec). Durées : voir src/config.ts.
 */
export const CocaColaAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={sequenceFrames("hook")}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={timing(TRANSITION_FRAMES.hook)} />

        <TransitionSeries.Sequence durationInFrames={sequenceFrames("tension")}>
          <Tension />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={iris({ width: VIDEO.width, height: VIDEO.height })}
          timing={timing(TRANSITION_FRAMES.tension)}
        />

        <TransitionSeries.Sequence durationInFrames={sequenceFrames("reveal")}>
          <Reveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing(TRANSITION_FRAMES.reveal)} />

        <TransitionSeries.Sequence durationInFrames={sequenceFrames("emotion")}>
          <Emotion />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoom()} timing={timing(TRANSITION_FRAMES.emotion)} />

        <TransitionSeries.Sequence durationInFrames={sequenceFrames("climax")}>
          <Climax />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing(TRANSITION_FRAMES.climax)} />

        <TransitionSeries.Sequence durationInFrames={sequenceFrames("packshot")}>
          <Packshot />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <SoundTrack />
    </AbsoluteFill>
  );
};

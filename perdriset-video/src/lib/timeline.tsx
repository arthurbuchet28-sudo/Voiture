import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneProvider } from "./scene";
import { ease } from "./utils";

export type TransitionStyle = "none" | "dissolve" | "blur";

export type SceneDef = {
  key: string;
  Component: React.FC;
  /** Durée officielle en frames. */
  duration: number;
  enter: TransitionStyle;
  exit: TransitionStyle;
};

/** Gère l'entrée/sortie d'une scène : fondu, flou et léger zoom (jamais de coupe sèche). */
const SceneSlot: React.FC<{
  start: number;
  duration: number;
  padIn: number;
  pad: number;
  enter: TransitionStyle;
  exit: TransitionStyle;
  children: React.ReactNode;
}> = ({ start, duration, padIn, pad, enter, exit, children }) => {
  const seqFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = seqFrame - padIn;
  const opt = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut } as const;

  const e = enter === "none" ? 1 : interpolate(frame, [-pad, pad], [0, 1], opt);
  const x = exit === "none" ? 0 : interpolate(frame, [duration - pad, duration + pad], [0, 1], opt);

  let opacity = e * (1 - interpolate(x, [0.35, 1], [0, 1]));
  let blur = 0;
  let scale = 1;
  if (enter === "blur") {
    blur += (1 - e) * 16;
    scale *= 1.08 - 0.08 * e;
  }
  if (exit === "blur") {
    blur += x * 16;
    scale *= 1 - 0.06 * x;
  }
  if (exit === "dissolve" && enter !== "none") opacity = e * (1 - x);

  return (
    <SceneProvider value={{ frame, duration, absFrame: start + frame, fps }}>
      <AbsoluteFill
        style={{
          opacity,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </SceneProvider>
  );
};

/** Enchaîne les scènes avec un chevauchement de `pad` frames de chaque côté de chaque raccord. */
export const SceneTimeline: React.FC<{ scenes: SceneDef[]; pad: number }> = ({ scenes, pad }) => {
  let cursor = 0;
  return (
    <>
      {scenes.map(({ key, Component, duration, enter, exit }, i) => {
        const start = cursor;
        cursor += duration;
        const padIn = i === 0 ? 0 : pad;
        const padOut = i === scenes.length - 1 ? 0 : pad;
        return (
          <Sequence key={key} name={key} from={start - padIn} durationInFrames={duration + padIn + padOut}>
            <SceneSlot start={start} duration={duration} padIn={padIn} pad={pad} enter={enter} exit={exit}>
              <Component />
            </SceneSlot>
          </Sequence>
        );
      })}
    </>
  );
};

/** Caméra globale : léger zoom et rotation permanents sur toute la vidéo. */
export const Camera: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  const rot = Math.sin(t * 0.35) * 0.7;
  const dx = Math.sin(t * 0.25) * 10;
  const dy = Math.cos(t * 0.3) * 6;
  return (
    <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${zoom}) rotate(${rot}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};

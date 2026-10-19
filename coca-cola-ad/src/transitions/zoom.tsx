import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { CLAMP } from "../lib/motion";

/**
 * Transition « zoom » maison : la scène sortante fonce vers la caméra en
 * floutant, la scène entrante arrive depuis le fond.
 */
type ZoomProps = Record<string, never>;

const ZoomPresentation: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const entering = presentationDirection === "entering";
  const style: React.CSSProperties = entering
    ? {
        transform: `scale(${interpolate(p, [0, 1], [0.55, 1])})`,
        opacity: interpolate(p, [0, 0.45], [0, 1], CLAMP),
        filter: `blur(${(1 - p) * 14}px)`,
      }
    : {
        transform: `scale(${interpolate(p, [0, 1], [1, 2.4])})`,
        opacity: interpolate(p, [0.3, 1], [1, 0], CLAMP),
        filter: `blur(${p * 18}px)`,
      };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const zoom = (): TransitionPresentation<ZoomProps> => ({
  component: ZoomPresentation,
  props: {},
});

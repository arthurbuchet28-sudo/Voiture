import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bubbles } from "../components/Bubbles";
import { Can } from "../components/Can";
import { COLORS, REVEAL, sceneFrames } from "../config";
import { CLAMP } from "../lib/motion";

/**
 * Scène 3 — Révélation (7–11 s)
 * La canette arrive en tournant (rotation 3D simulée) sur fond rouge,
 * entourée de bulles en trois couches de parallaxe. Zoom lent continu.
 */
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const duration = sceneFrames("reveal");

  // Entrée : la canette monte depuis le bas avec un spring.
  const enter = spring({ frame: frame - 2, fps, config: { damping: 15, stiffness: 90, mass: 0.9 } });

  // Rotation : rapide au début, se pose de face, puis respire légèrement.
  const spin = interpolate(frame, [0, REVEAL.spinFrames], [-Math.PI * 2 * REVEAL.turns, 0], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const rotation = spin + Math.sin(frame * 0.05) * 0.12;

  const zoom = interpolate(frame, [0, duration], [1, REVEAL.zoomTo]);
  const shine = interpolate(frame, [REVEAL.shineAt, REVEAL.shineAt + 22], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.quad) });
  const float = Math.sin(frame * 0.08) * 12;
  const canWidth = 520;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: `radial-gradient(circle at 50% 45%, #ff2a4e 0%, ${COLORS.red} 38%, ${COLORS.redDark} 78%, ${COLORS.redDeep} 100%)`,
      }}
    >
      {/* Couche arrière : bulles fines, floues, lentes */}
      <AbsoluteFill style={{ transform: `scale(${1 + (zoom - 1) * 0.4})` }}>
        <Bubbles time={frame} count={40} seed="rev-far" size={[6, 18]} speed={[2, 4]} opacity={0.45} blur={3} />
      </AbsoluteFill>

      {/* Anneaux argentés lents derrière la canette */}
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <svg width={width} height={height} style={{ position: "absolute" }}>
          {[330, 430, 540].map((r, i) => (
            <circle
              key={r}
              cx={width / 2}
              cy={height / 2}
              r={r * interpolate(enter, [0, 1], [0.6, 1])}
              fill="none"
              stroke={COLORS.silverLight}
              strokeOpacity={0.18 - i * 0.04}
              strokeWidth={2}
              strokeDasharray={i === 1 ? "4 18" : undefined}
              transform={`rotate(${frame * (i % 2 ? -0.4 : 0.3)} ${width / 2} ${height / 2})`}
            />
          ))}
        </svg>
      </AbsoluteFill>

      {/* Couche médiane : la canette (zoom lent) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${zoom})` }}>
        {/* Ombre portée douce */}
        <div
          style={{
            position: "absolute",
            top: height / 2 + canWidth * 0.98,
            width: canWidth * 0.95,
            height: 60,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(60,0,10,0.55) 0%, rgba(60,0,10,0) 70%)",
            opacity: enter,
          }}
        />
        <div
          style={{
            transform: `translateY(${interpolate(enter, [0, 1], [1100, 0]) + float}px) rotate(${interpolate(enter, [0, 1], [-14, 0])}deg)`,
          }}
        >
          <Can width={canWidth} rotation={rotation} time={frame} frost={0.35} shine={shine} />
        </div>
      </AbsoluteFill>

      {/* Couche avant : grosses bulles rapides et floues (profondeur) */}
      <AbsoluteFill style={{ transform: `scale(${1 + (zoom - 1) * 1.8})` }}>
        <Bubbles time={frame} count={12} seed="rev-near" size={[50, 110]} speed={[9, 14]} opacity={0.55} blur={5} wobble={30} />
      </AbsoluteFill>
      <Bubbles time={frame} count={26} seed="rev-mid" size={[14, 34]} speed={[5, 8]} opacity={0.8} />
    </AbsoluteFill>
  );
};

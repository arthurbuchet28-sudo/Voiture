import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BubbleBurst, Bubbles } from "../components/Bubbles";
import { Can } from "../components/Can";
import { Particles } from "../components/Particles";
import { CLIMAX, COLORS, sceneFrames } from "../config";
import { CLAMP, shake } from "../lib/motion";

/**
 * Scène 5 — Climax (16–20 s)
 * Anticipation (zoom vers le haut de la canette, tremblement qui monte),
 * l'anneau se soulève, explosion de bulles et de particules, flash blanc,
 * puis montée au blanc pour enchaîner sur le packshot.
 */

const CAN_WIDTH = 560;

export const Climax: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const duration = sceneFrames("climax");
  const sinceOpen = frame - CLIMAX.openAt;

  // Position de la canette et de son ouverture (repère de la caméra).
  const canTop = height / 2 - CAN_WIDTH + 140;
  const lid = { x: width / 2, y: canTop + (51 / 480) * CAN_WIDTH * 2 };

  const tabLift = spring({ frame: frame - CLIMAX.tabAt, fps, config: { damping: 11, stiffness: 140 }, durationInFrames: 14 });

  // Caméra : zoom progressif vers le couvercle, « punch » à l'ouverture, puis recul.
  const approach = interpolate(frame, [0, CLIMAX.openAt], [1, 1.32], { ...CLAMP, easing: Easing.in(Easing.quad) });
  const punch = spring({ frame: sinceOpen, fps, config: { damping: 9, stiffness: 200 } });
  const pullBack = interpolate(sinceOpen, [4, duration - CLIMAX.openAt], [0, 0.22], CLAMP);
  const camScale = approach + Math.sin(punch * Math.PI) * 0.08 - pullBack;

  // Tremblement qui grandit avant l'ouverture, puis secousse d'impact.
  const tension = interpolate(frame, [8, CLIMAX.openAt], [0, 1], CLAMP);
  const jitter = {
    x: sinceOpen < 0 ? Math.sin(frame * 3.1) * tension * tension * 7 : 0,
    y: sinceOpen < 0 ? Math.cos(frame * 2.3) * tension * tension * 4 : 0,
  };
  const impact = shake(frame, CLIMAX.openAt, 26, 5);

  // Flash à l'ouverture + montée au blanc en fin de scène.
  const flash = interpolate(sinceOpen, [0, 2, 12], [0, 0.9, 0], CLAMP);
  const whiteout = interpolate(frame, [duration - CLIMAX.whiteoutFrames, duration], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  });

  const rays = interpolate(sinceOpen, [0, 10], [0.25, 1], CLAMP);
  const bubbleField = interpolate(sinceOpen, [0, 18], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: COLORS.redDeep }}>
      {/* Fond : dégradé + rayons qui tournent */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${(lid.y / height) * 100}%, ${COLORS.red} 0%, ${COLORS.redDark} 45%, ${COLORS.redDeep} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: rays,
          background: `repeating-conic-gradient(from ${frame * 0.6}deg at 50% ${(lid.y / height) * 100}%, rgba(255,255,255,0.07) 0deg 5deg, rgba(255,255,255,0) 5deg 15deg)`,
        }}
      />

      {/* Bulles d'arrière-plan qui s'emballent après l'ouverture */}
      <AbsoluteFill style={{ opacity: 0.35 + bubbleField * 0.65 }}>
        <Bubbles time={frame * (1 + bubbleField * 2.5)} count={45} seed="clx-far" size={[6, 18]} speed={[3, 6]} blur={2} opacity={0.6} />
      </AbsoluteFill>

      {/* Caméra */}
      <AbsoluteFill
        style={{
          transformOrigin: `${lid.x}px ${lid.y}px`,
          transform: `translate(${jitter.x + impact.x}px, ${jitter.y + impact.y}px) scale(${camScale})`,
        }}
      >
        {/* Onde de choc */}
        <svg width={width} height={height} style={{ position: "absolute" }}>
          {[0, 5].map((d) => {
            const p = interpolate(sinceOpen - d, [0, 24], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
            return sinceOpen - d < 0 ? null : (
              <ellipse key={d} cx={lid.x} cy={lid.y} rx={p * 900} ry={p * 900 * 0.55} fill="none" stroke="#fff" strokeWidth={18 * (1 - p) + 1} opacity={1 - p} />
            );
          })}
        </svg>

        <div style={{ position: "absolute", left: width / 2 - CAN_WIDTH / 2, top: canTop }}>
          <Can width={CAN_WIDTH} rotation={Math.sin(frame * 0.04) * 0.08} tabLift={tabLift} time={frame + 80} frost={0.45} />
        </div>

        {/* Geyser de bulles + gerbe de gouttelettes */}
        <BubbleBurst time={sinceOpen} count={110} seed="clx-burst" origin={lid} emitFrames={36} />
        <Particles
          time={sinceOpen}
          count={150}
          seed="clx-spark"
          origin={lid}
          colors={[COLORS.white, COLORS.silverLight, COLORS.silver, "#ff8597"]}
          spread={[-Math.PI * 0.97, -Math.PI * 0.03]}
          speed={[12, 44]}
          size={[4, 12]}
          gravity={0.4}
          drag={0.05}
          life={55}
          streak={1.3}
        />
      </AbsoluteFill>

      {/* Bulles du premier plan (parallaxe) */}
      <AbsoluteFill style={{ opacity: bubbleField }}>
        <Bubbles time={frame * 2} count={16} seed="clx-near" size={[40, 100]} speed={[10, 16]} blur={4} opacity={0.6} wobble={26} />
      </AbsoluteFill>

      <AbsoluteFill style={{ backgroundColor: COLORS.white, opacity: Math.max(flash, whiteout) }} />
    </AbsoluteFill>
  );
};

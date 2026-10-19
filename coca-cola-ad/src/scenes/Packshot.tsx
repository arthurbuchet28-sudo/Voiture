import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bubbles } from "../components/Bubbles";
import { Can } from "../components/Can";
import { KineticWords } from "../components/KineticWords";
import { COLORS, PACKSHOT } from "../config";
import { fontFamily } from "../fonts";
import { CLAMP } from "../lib/motion";

/**
 * Scène 6 — Packshot (20–22 s)
 * « Coca-Cola » en grand, slogan à côté de la canette. Toutes les
 * animations convergent avant PACKSHOT.settleFrames, puis l'image se fige.
 */
export const Packshot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const settle = PACKSHOT.settleFrames;

  // Temps « virtuel » des bulles : il ralentit puis s'arrête → image figée.
  const bubbleTime = interpolate(frame, [0, settle], [0, settle * 0.5], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });

  const canIn = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 110 } });
  const rotation = interpolate(frame, [0, settle - 6], [-1.2, 0], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const line = spring({ frame: frame - 12, fps, config: { damping: 200, stiffness: 120 } });
  const disclaimer = interpolate(frame, [20, 32], [0, 0.55], CLAMP);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: `radial-gradient(circle at 50% 40%, #ff2a4e 0%, ${COLORS.red} 45%, ${COLORS.redDark} 100%)`,
      }}
    >
      <Bubbles time={bubbleTime} count={30} seed="pack" size={[6, 20]} speed={[3, 6]} opacity={0.4} blur={1} />

      {/* Marque */}
      <AbsoluteFill style={{ top: 360, alignItems: "center" }}>
        <KineticWords text={PACKSHOT.brand} split="letters" start={2} stagger={2} mode="pop" fontSize={180} color={COLORS.white} />
        <div
          style={{
            marginTop: 40,
            width: 760,
            height: 6,
            borderRadius: 3,
            transform: `scaleX(${line})`,
            background: `linear-gradient(90deg, ${COLORS.silverDark}, ${COLORS.silverLight}, ${COLORS.silverDark})`,
          }}
        />
      </AbsoluteFill>

      {/* Slogan (gauche) + canette (droite) */}
      <AbsoluteFill style={{ top: 780, flexDirection: "row", alignItems: "flex-start", padding: "0 70px" }}>
        <div style={{ flex: 1, paddingTop: 300 }}>
          <KineticWords
            text={PACKSHOT.slogan.join(" ")}
            direction="column"
            start={14}
            stagger={5}
            mode="rise"
            fontSize={128}
            color={COLORS.white}
            style={{ alignItems: "flex-start", rowGap: 6 }}
          />
        </div>
        <div
          style={{
            position: "relative",
            transform: `translateX(${interpolate(canIn, [0, 1], [500, 0])}px) rotate(${interpolate(canIn, [0, 1], [12, 0])}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "8%",
              bottom: -30,
              width: "84%",
              height: 60,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(60,0,10,0.55) 0%, rgba(60,0,10,0) 70%)",
            }}
          />
          <Can width={420} rotation={rotation} time={0} frost={0.3} tabLift={1} />
        </div>
      </AbsoluteFill>

      {PACKSHOT.showDisclaimer && (
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
          <div style={{ fontFamily, fontWeight: 700, fontSize: 24, letterSpacing: "0.08em", color: COLORS.white, opacity: disclaimer }}>
            Exercice personnel · non officiel
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

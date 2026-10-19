import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { IconBriefcase, IconLeaf, IconUsers } from "../components/icons";
import { LightTrail } from "../components/LightTrail";
import { DirectionalBlur } from "../lib/motionBlur";
import { useScene } from "../lib/scene";
import { clamp, ease, glow, textGlow } from "../lib/utils";
import { CONFIG } from "../config";
import { A, B, font, ui } from "../theme";

const RADIUS = 48;
const CARD_W = 1420;
const CARD_H = 640;

/** Scène 6 (19,8-23,8 s) : compteur 0 → 30 ans sur une grande carte néon, puis les deux arguments. */
export const Scene6Trust: React.FC = () => {
  const { frame, absFrame, fps, duration } = useScene();
  const t = absFrame / fps;
  const { trust } = CONFIG;

  const enter = spring({ frame: frame + 6, fps, config: { damping: 22, stiffness: 60 } });

  const value = (f: number) => interpolate(f, [10, 96], [0, trust.value], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  const v = value(frame);
  const dv = Math.abs(value(frame) - value(frame - 1));
  const digitBlur = clamp((dv / trust.value) * 260, 0, 7);
  const done = spring({ frame: frame - 96, fps, config: { damping: 11, stiffness: 140, mass: 0.7 } });
  const pulse = interpolate(frame, [96, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  const label = spring({ frame: frame - 18, fps, config: { damping: 18, stiffness: 100 } });

  const trailOffset = -interpolate(frame, [-12, duration], [0.05, 1.9], { easing: ease.soft });
  const trailOn = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ry = -4 + Math.sin(t * 0.55) * 4;
  const rx = 6 * (1 - enter) + 4 + Math.sin(t * 0.7) * 1.2;
  const camScale = interpolate(frame, [0, duration], [1, 1.05]);

  const mini = [
    { Icon: IconUsers, label: trust.mini[0] },
    { Icon: IconBriefcase, label: trust.mini[1] },
  ];

  return (
    <AbsoluteFill style={{ perspective: 1800, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 1600, height: 950, borderRadius: "50%", background: `radial-gradient(ellipse, ${A.a(0.18 + 0.12 * done)} 0%, transparent 65%)` }} />
      <div
        style={{
          position: "relative",
          width: CARD_W,
          height: CARD_H,
          transformStyle: "preserve-3d",
          transform: `scale(${camScale}) translateZ(${-500 * (1 - enter)}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: RADIUS,
            border: `2px solid ${A.light}`,
            transform: `scale(${1 + pulse * 0.14})`,
            opacity: pulse > 0 ? (1 - pulse) * 0.8 : 0,
            boxShadow: glow(A.base, 1.2),
          }}
        />
        <div
          style={{
            ...font,
            position: "absolute",
            inset: 0,
            borderRadius: RADIUS,
            overflow: "hidden",
            background: "linear-gradient(150deg, rgba(22,48,30,0.96) 0%, rgba(10,22,14,0.97) 60%, rgba(6,12,8,0.98) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: `0 60px 120px rgba(0,0,0,0.6), 0 0 ${80 + 60 * done}px ${A.a(0.22 + 0.15 * done)}, inset 0 1px 0 rgba(255,255,255,0.08)`,
            padding: "58px 76px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(80% 90% at 10% 0%, ${A.a(0.18)} 0%, transparent 60%), radial-gradient(50% 60% at 100% 100%, ${B.a(0.22)} 0%, transparent 70%)`,
            }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: A.a(0.22),
                border: `1px solid ${A.a(0.5)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: glow(A.base, 0.6),
              }}
            >
              <IconLeaf size={34} color={A.pale} stroke={2.2} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 5, textTransform: "uppercase", color: A.pale, textShadow: textGlow(A.base, 0.7) }}>
              {trust.eyebrow}
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 34, marginTop: 30, height: 230 }}>
            <div style={{ position: "relative", width: 300, height: 230 }}>
              <DirectionalBlur x={0} y={digitBlur}>
                <div
                  style={{
                    fontSize: 250,
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                    lineHeight: 0.92,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    color: "#fff",
                    textShadow: textGlow(A.base, 0.5 + 0.6 * done),
                  }}
                >
                  {Math.round(v)}
                </div>
              </DirectionalBlur>
            </div>
            <div
              style={{
                fontSize: 104,
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1,
                paddingBottom: 18,
                whiteSpace: "nowrap",
                opacity: clamp(label * 1.4),
                transform: `translateX(${(1 - label) * 40}px)`,
                background: `linear-gradient(180deg, #ffffff 20%, ${A.pale} 120%)`,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {trust.label}
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", gap: 22, marginTop: "auto" }}>
            {mini.map(({ Icon, label: l }, i) => {
              const m = spring({ frame: frame - 50 - i * 14, fps, config: { damping: 16, stiffness: 110 } });
              return (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "18px 28px",
                    borderRadius: 999,
                    fontSize: 36,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    background: "rgba(255,255,255,0.07)",
                    border: `1px solid ${ui.border}`,
                    opacity: clamp(m * 1.5),
                    transform: `translateY(${(1 - m) * 24}px)`,
                  }}
                >
                  <Icon size={40} color={A.light} stroke={2.3} />
                  {l}
                </div>
              );
            })}
          </div>
        </div>
        <LightTrail width={CARD_W} height={CARD_H} radius={RADIUS} offset={trailOffset} length={0.16} intensity={trailOn} />
        <LightTrail width={CARD_W} height={CARD_H} radius={RADIUS} offset={trailOffset + 0.5} length={0.07} intensity={trailOn * 0.55} />
      </div>
    </AbsoluteFill>
  );
};

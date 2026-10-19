import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile } from "remotion";
import { Converge } from "../components/Converge";
import { IconPin } from "../components/icons";
import { useScene } from "../lib/scene";
import { clamp, ease } from "../lib/utils";
import { CONFIG } from "../config";
import { A, font, ui } from "../theme";

const LOGO_W = 900;
const LOGO_H = (LOGO_W * 504) / 1248;

/** Scène 2 (3-6 s) : la lumière converge, le logo se révèle, puis la baseline. */
export const Scene2Logo: React.FC = () => {
  const { frame, absFrame, fps } = useScene();
  const t = absFrame / fps;

  const core = interpolate(frame, [18, 36, 90], [0, 1, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoIn = spring({ frame: frame - 22, fps, config: { damping: 18, stiffness: 80 } });
  const reveal = interpolate(frame, [22, 58], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  const sweep = interpolate(frame, [60, 110], [-30, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut });
  const breathe = 1 + Math.sin(t * 2.2) * 0.01 * logoIn;

  return (
    <AbsoluteFill>
      <Converge frame={frame} end={36} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(255,255,255,${0.35 * core}) 0%, ${A.a(0.4 * core)} 7%, ${A.a(
            0.1 * core,
          )} 24%, transparent 45%)`,
        }}
      />
      <AbsoluteFill style={{ ...font, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(-30px) scale(${breathe})` }}>
          {/* Logo : révélation gauche → droite, du flou au net, halo vert */}
          <div
            style={{
              position: "relative",
              width: LOGO_W,
              height: LOGO_H,
              transform: `scale(${0.86 + 0.14 * logoIn})`,
              opacity: clamp(logoIn * 2),
              clipPath: `inset(-60px ${(1 - reveal) * 100}% -60px -60px)`,
              filter: `${reveal < 1 ? `blur(${((1 - reveal) * 10).toFixed(2)}px) ` : ""}drop-shadow(0 0 ${28 * logoIn}px ${A.a(0.45)})`,
            }}
          >
            <Img src={staticFile("logo.png")} style={{ width: LOGO_W, height: LOGO_H }} />
            {/* Reflet qui balaie le logo */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                WebkitMaskImage: `url(${staticFile("logo.png")})`,
                WebkitMaskSize: "100% 100%",
                background: `linear-gradient(105deg, transparent ${sweep - 12}%, rgba(255,255,255,0.75) ${sweep}%, transparent ${sweep + 12}%)`,
              }}
            />
          </div>
          {/* Baseline */}
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            {CONFIG.baseline.map((l, i) => {
              const s = spring({ frame: frame - 62 - i * 8, fps, config: { damping: 18, stiffness: 110 } });
              return (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    fontSize: 60,
                    fontWeight: i === 0 ? 700 : 800,
                    letterSpacing: "-0.02em",
                    color: i === 0 ? ui.text : A.light,
                    opacity: clamp(s * 1.5),
                    transform: `translateY(${(1 - s) * 26}px)`,
                    filter: s < 0.98 ? `blur(${((1 - s) * 8).toFixed(2)}px)` : undefined,
                    textShadow: i === 1 ? `0 0 26px ${A.a(0.35)}` : undefined,
                  }}
                >
                  {i === 1 ? <IconPin size={52} color={A.light} stroke={2.4} /> : null}
                  {l}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

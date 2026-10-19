import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile } from "remotion";
import { Converge } from "../components/Converge";
import { IconGlobe, IconPhone, IconPin } from "../components/icons";
import { useScene } from "../lib/scene";
import { clamp, ease, glow } from "../lib/utils";
import { CONFIG } from "../config";
import { A, brandGradient, font, ui } from "../theme";

const LOGO_W = 820;
const LOGO_H = (LOGO_W * 504) / 1248;

/**
 * Scène 7 (23,8-28 s) : appel à l'action. Tout est lisible dès ~1 s et reste affiché
 * jusqu'à la dernière image (plus de 3 s). Pas de fondu au noir.
 */
export const Scene7Outro: React.FC = () => {
  const { frame, absFrame, fps } = useScene();
  const t = absFrame / fps;

  const core = interpolate(frame, [10, 26, 80], [0, 1, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoIn = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 90 } });
  const sites = spring({ frame: frame - 24, fps, config: { damping: 18, stiffness: 110 } });
  const pop = spring({ frame: frame - 34, fps, config: { damping: 10, stiffness: 150, mass: 0.7 } });
  const pop2 = spring({ frame: frame - 42, fps, config: { damping: 10, stiffness: 150, mass: 0.7 } });
  const shimmer = interpolate(frame, [80, 120], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut });
  const shimmer2 = interpolate(frame, [150, 190], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut });
  const breathe = 1 + Math.sin(t * 2.2) * 0.01 * logoIn;

  const button = (p: number, s: number, primary: boolean, children: React.ReactNode) => (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "26px 50px",
        borderRadius: 999,
        fontSize: 58,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        color: primary ? "#06200d" : "#fff",
        background: primary ? brandGradient(100) : "rgba(255,255,255,0.08)",
        border: primary ? "none" : `2px solid ${A.a(0.6)}`,
        boxShadow: primary ? `${glow(A.base, 1.1 * p)}, inset 0 1px 0 rgba(255,255,255,0.5)` : `0 0 40px ${A.a(0.25 * p)}`,
        transform: `scale(${Math.max(0, p)})`,
        opacity: clamp(p * 3),
        overflow: "hidden",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${s}%`,
          width: "30%",
          background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)",
          transform: "skewX(-20deg)",
        }}
      />
    </div>
  );

  return (
    <AbsoluteFill>
      <Converge frame={frame} end={24} cy={360} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 33%, rgba(255,255,255,${0.35 * core}) 0%, ${A.a(0.4 * core)} 7%, ${A.a(0.1 * core)} 24%, transparent 45%)`,
        }}
      />
      <AbsoluteFill style={{ ...font, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 100, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${breathe})` }}>
          <div
            style={{
              width: LOGO_W,
              height: LOGO_H,
              transform: `scale(${0.8 + 0.2 * logoIn})`,
              opacity: clamp(logoIn * 2),
              filter: `${logoIn < 0.97 ? `blur(${((1 - logoIn) * 10).toFixed(2)}px) ` : ""}drop-shadow(0 0 ${26 * logoIn}px ${A.a(0.45)})`,
            }}
          >
            <Img src={staticFile("logo.png")} style={{ width: LOGO_W, height: LOGO_H }} />
          </div>
          <div
            style={{
              marginTop: 34,
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: ui.text,
              opacity: clamp(sites * 1.5),
              transform: `translateY(${(1 - sites) * 22}px)`,
            }}
          >
            <IconPin size={50} color={A.light} stroke={2.4} />
            {CONFIG.sites}
          </div>
          <div style={{ marginTop: 50, display: "flex", gap: 34 }}>
            {button(
              pop,
              shimmer,
              true,
              <>
                <IconGlobe size={54} color="#06200d" stroke={2.4} />
                {CONFIG.url}
              </>,
            )}
            {button(
              pop2,
              shimmer2,
              false,
              <>
                <IconPhone size={52} color={A.light} stroke={2.4} />
                {CONFIG.phone}
              </>,
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

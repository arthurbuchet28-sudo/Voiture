import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { LightTrail } from "../components/LightTrail";
import { useScene } from "../lib/scene";
import { clamp, ease, textGlow } from "../lib/utils";
import { CONFIG } from "../config";
import { A, font, ui } from "../theme";

const TILE_W = 410;
const TILE_H = 170;
const GAP = 30;
const COLS = 4;
const RADIUS = 28;

/** Scène 4 (11-15 s) : défilé des marques, chaque nom arrive du fond en cascade. */
export const Scene4Brands: React.FC = () => {
  const { frame, absFrame, fps } = useScene();
  const t = absFrame / fps;
  const brands = CONFIG.brands;
  const rows = Math.ceil(brands.length / COLS);
  const gridW = COLS * TILE_W + (COLS - 1) * GAP;
  const gridH = rows * TILE_H + (rows - 1) * GAP;

  const title = spring({ frame: frame + 4, fps, config: { damping: 18, stiffness: 90 } });
  const rule = interpolate(frame, [6, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  // Un projecteur passe de marque en marque après l'arrivée de toutes les tuiles
  const spot = interpolate(frame, [70, 228], [0, brands.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ry = Math.sin(t * 0.5) * 4;
  const rx = 10 + Math.sin(t * 0.6) * 1.5;

  return (
    <AbsoluteFill style={{ ...font, alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 150,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: clamp(title * 1.4),
          transform: `translateY(${(1 - title) * 30}px)`,
        }}
      >
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: 8, textTransform: "uppercase", color: A.pale, textShadow: textGlow(A.base, 0.7) }}>
          {CONFIG.brandsEyebrow}
        </div>
        <div style={{ marginTop: 18, height: 3, width: 420 * rule, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${A.light}, transparent)`, boxShadow: `0 0 16px ${A.base}` }} />
      </div>

      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: "50% 40%" }}>
        <div
          style={{
            position: "absolute",
            left: 960 - gridW / 2,
            top: 600 - gridH / 2,
            width: gridW,
            height: gridH,
            transformStyle: "preserve-3d",
            transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
          }}
        >
          {brands.map((b, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const delay = 6 + i * 6;
            const e = spring({ frame: frame - delay, fps, config: { damping: 19, stiffness: 70, mass: 1 } });
            const ePrev = spring({ frame: frame - 1 - delay, fps, config: { damping: 19, stiffness: 70, mass: 1 } });
            const blur = clamp(Math.abs(e - ePrev) * 260, 0, 9);
            const lit = clamp(1 - Math.abs(spot - i - 0.5) * 1.1);
            const float = Math.sin(t * 1.1 + i * 1.3) * 6;
            return (
              <div
                key={b}
                style={{
                  position: "absolute",
                  left: col * (TILE_W + GAP),
                  top: row * (TILE_H + GAP) + float,
                  width: TILE_W,
                  height: TILE_H,
                  transform: `translateZ(${-900 * (1 - e) + 30 * lit}px) translateX(${(1 - e) * 500}px)`,
                  opacity: clamp(e * 1.6),
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: RADIUS,
                    background: `linear-gradient(150deg, ${A.a(0.1 + 0.22 * lit)} 0%, rgba(255,255,255,0.04) 70%)`,
                    backgroundColor: ui.cardSolid,
                    border: `1px solid ${lit > 0.3 ? A.a(0.6) : ui.border}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 50px rgba(0,0,0,0.45), 0 0 ${60 * lit}px ${A.a(0.35 * lit)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
                  }}
                >
                  <div
                    style={{
                      fontSize: 70,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      whiteSpace: "nowrap",
                      color: "#fff",
                      textShadow: lit > 0.05 ? textGlow(A.base, 0.3 + 0.7 * lit) : "0 4px 20px rgba(0,0,0,0.4)",
                    }}
                  >
                    {b}
                  </div>
                </div>
                <LightTrail width={TILE_W} height={TILE_H} radius={RADIUS} offset={-(spot - i) * 0.9} length={0.22} intensity={lit} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

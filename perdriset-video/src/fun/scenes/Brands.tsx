import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LightTrail } from "../../components/LightTrail";
import { clamp, lerp, textGlow } from "../../lib/utils";
import { A, font, ui } from "../../theme";
import { BOUNCY, drop } from "../components/anim";
import { FUN } from "../config";

const TILE_W = 410;
const TILE_H = 170;
const GAP = 30;
const COLS = 4;
const RADIUS = 28;
const GRID_X = 960 - (COLS * TILE_W + (COLS - 1) * GAP) / 2;
const GRID_Y = 390;
const DEAL = 30; // première carte sur le 1er temps
const EVERY = 15; // une carte par demi-temps

/** Marques : distribuées comme des cartes, grille qui ondule, puis chute vers le bas (transition). */
export const Brands: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fallStart = FUN.scenes.brands - 40;
  const title = drop(frame, fps, 14, -400);
  const rule = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spot = interpolate(frame, [DEAL + 8 * EVERY + 10, fallStart], [0, 8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={font}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#fff",
            transformOrigin: "50% 100%",
            transform: `translateY(${title.y + fallY(frame, fallStart, 9)}px) scale(${title.sx}, ${title.sy})`,
            opacity: title.visible ? 1 : 0,
          }}
        >
          {FUN.brandsTitle}
          <span style={{ color: A.light, textShadow: textGlow(A.base, 0.6) }}>.</span>
        </div>
        <div style={{ marginTop: 14, height: 5, width: 460 * rule, borderRadius: 4, background: `linear-gradient(90deg, transparent, ${A.light}, transparent)`, boxShadow: `0 0 16px ${A.base}`, opacity: 1 - clamp((frame - fallStart) / 10) }} />
      </div>

      {FUN.brands.map((b, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const tx = GRID_X + col * (TILE_W + GAP);
        const ty = GRID_Y + row * (TILE_H + GAP);
        // Distribution : la carte part du paquet (en bas au centre) et vole jusqu'à sa place
        const s = spring({ frame: frame - DEAL - i * EVERY, fps, config: BOUNCY });
        if (frame < DEAL + i * EVERY) return null;
        const x = lerp(960 - TILE_W / 2, tx, s);
        const y = lerp(1250, ty, s) - Math.sin(clamp(s) * Math.PI) * 160;
        const rot = (1 - s) * (random(`br${i}`) - 0.5) * 120;
        // Vague une fois la grille formée
        const wave = Math.sin(frame / 7 - col * 0.9 - row * 0.5) * 12 * clamp((frame - (DEAL + 8 * EVERY)) / 20);
        const lit = clamp(1 - Math.abs(spot - i - 0.5) * 1.1);
        // Chute en fin de scène : petit saut puis gravité
        const fy = fallY(frame, fallStart, i * 2);
        const frot = frame > fallStart + i * 2 ? (frame - fallStart - i * 2) * (random(`fr${i}`) - 0.5) * 6 : 0;
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              left: x,
              top: y + wave + fy,
              width: TILE_W,
              height: TILE_H,
              transform: `rotate(${rot + frot}deg) scale(${1 + 0.06 * lit})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: RADIUS,
                background: lit > 0.2 ? `linear-gradient(150deg, ${A.base} 0%, ${A.a(0.55)} 100%)` : `linear-gradient(150deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))`,
                backgroundColor: ui.cardSolid,
                border: `2px solid ${lit > 0.2 ? A.light : ui.border}`,
                boxShadow: `0 24px 50px rgba(0,0,0,0.5), 0 0 ${60 * lit}px ${A.a(0.5 * lit)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.03em", whiteSpace: "nowrap", color: lit > 0.5 ? "#06200d" : "#fff" }}>{b}</div>
            </div>
            <LightTrail width={TILE_W} height={TILE_H} radius={RADIUS} offset={-(spot - i) * 0.9} length={0.22} intensity={lit * 0.8} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Trajectoire de chute : léger saut vers le haut puis gravité (px). */
const fallY = (frame: number, start: number, delay: number) => {
  const f = frame - start - delay;
  if (f <= 0) return 0;
  return -14 * f + 0.5 * 3.2 * f * f;
};

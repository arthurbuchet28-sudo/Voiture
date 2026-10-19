import React from "react";
import { interpolate, random, useVideoConfig } from "remotion";
import { ease } from "../lib/utils";
import { A, B } from "../theme";

const PARTICLES = 90;

/**
 * Traînées de particules qui convergent vers le centre (reprise de la scène logo de Promptly).
 * Chaque traînée est le segment entre la position à f et à f−3 : c'est le flou de mouvement.
 */
export const Converge: React.FC<{ frame: number; end?: number; cy?: number }> = ({ frame, end = 40, cy }) => {
  const { width: W, height: H } = useVideoConfig();
  const CX = W / 2;
  const CY = cy ?? H / 2;
  const conv = (f: number, i: number) => {
    const delay = random(`d-${i}`) * 18;
    return interpolate(f, [-12 + delay, end + delay * 0.6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease.in,
    });
  };
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="streakBloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const a = random(`a-${i}`) * Math.PI * 2;
        const r0 = 700 + random(`r-${i}`) * 700;
        const p = conv(frame, i);
        const pPrev = conv(frame - 3, i);
        if (p <= 0 || p >= 1) return null;
        const r = r0 * (1 - p);
        const rPrev = r0 * (1 - pPrev);
        const x1 = CX + Math.cos(a) * r;
        const y1 = CY + Math.sin(a) * r;
        const x2 = CX + Math.cos(a) * rPrev;
        const y2 = CY + Math.sin(a) * rPrev;
        const w = 1.5 + random(`w-${i}`) * 2.5;
        return (
          <g key={i} opacity={Math.sin(p * Math.PI) * 0.9 + 0.1}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 3 ? A.base : B.light} strokeWidth={w * 3} strokeLinecap="round" filter="url(#streakBloom)" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 3 ? A.pale : B.pale} strokeWidth={w} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
};

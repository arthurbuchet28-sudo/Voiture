import React from "react";
import { random, useVideoConfig } from "remotion";
import { mix } from "../../lib/utils";
import { A, B } from "../../theme";

/**
 * Rangée de brins d'herbe en SVG qui poussent depuis le bas et ondulent au vent.
 * grow : 0 → 1 (hauteur), t : temps en secondes (vent), height : hauteur max des brins.
 */
export const Grass: React.FC<{ grow: number; t: number; height?: number; density?: number; seed?: string; y?: number; opacity?: number }> = ({
  grow,
  t,
  height = 150,
  density = 150,
  seed = "g",
  y,
  opacity = 1,
}) => {
  const { width: W, height: H } = useVideoConfig();
  const base = y ?? H + 6;
  if (grow <= 0.001) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", opacity }}>
      {Array.from({ length: density }).map((_, i) => {
        const x = (i / density) * (W + 60) - 30 + (random(`${seed}x${i}`) - 0.5) * 18;
        const h = height * (0.45 + random(`${seed}h${i}`) * 0.75);
        // chaque brin pousse avec un léger décalage
        const g = Math.min(1, Math.max(0, grow * 1.4 - random(`${seed}d${i}`) * 0.4));
        const hh = h * g;
        const sway = Math.sin(t * 2.4 + x * 0.012) * 18 + Math.sin(t * 4.1 + i) * 5;
        const lean = (random(`${seed}l${i}`) - 0.5) * 30;
        const tipX = x + (sway + lean) * g;
        const w = 7 + random(`${seed}w${i}`) * 7;
        const color = mix(B.base, A.light, random(`${seed}c${i}`));
        return (
          <path
            key={i}
            d={`M${x - w / 2} ${base} Q${x + (sway + lean) * 0.35} ${base - hh * 0.55} ${tipX} ${base - hh} Q${x + (sway + lean) * 0.35 + 2} ${base - hh * 0.5} ${x + w / 2} ${base} Z`}
            fill={color}
          />
        );
      })}
    </svg>
  );
};

/** Brins d'herbe coupés projetés (particules en arc, avec gravité). */
export const Clippings: React.FC<{ frame: number; from: number; x: number; y: number; count?: number; dir?: number; seed?: string; spread?: number }> = ({
  frame,
  from,
  x,
  y,
  count = 40,
  dir = -1,
  seed = "c",
  spread = 1,
}) => {
  const { width: W, height: H } = useVideoConfig();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const born = from + random(`${seed}b${i}`) * 20;
        const f = frame - born;
        if (f < 0 || f > 50) return null;
        const vx = dir * (4 + random(`${seed}vx${i}`) * 14) * spread;
        const vy = -(8 + random(`${seed}vy${i}`) * 12);
        const px = x + vx * f;
        const py = y + vy * f + 0.5 * 0.7 * f * f;
        const rot = random(`${seed}r${i}`) * 360 + f * 20 * (random(`${seed}s${i}`) - 0.5);
        const len = 12 + random(`${seed}l${i}`) * 16;
        return (
          <rect
            key={i}
            x={-3}
            y={-len / 2}
            width={6}
            height={len}
            rx={3}
            fill={i % 3 ? A.light : B.light}
            opacity={1 - f / 50}
            transform={`translate(${px} ${py}) rotate(${rot})`}
          />
        );
      })}
    </svg>
  );
};

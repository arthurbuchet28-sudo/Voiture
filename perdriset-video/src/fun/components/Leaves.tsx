import React from "react";
import { random, useVideoConfig } from "remotion";
import { mix } from "../../lib/utils";
import { A, B } from "../../theme";

export type LeafState = { x: number; y: number; size: number; rot: number; flip: number; opacity: number; color: string };

/** Une feuille en SVG (forme en amande + nervure). flip simule la rotation 3D (−1 → 1). */
export const LeafShape: React.FC<{ s: LeafState }> = ({ s }) => (
  <g transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(${s.size * Math.max(0.15, Math.abs(s.flip))} ${s.size})`} opacity={s.opacity}>
    <path d="M0 -1 C0.75 -0.55 0.7 0.5 0 1 C-0.7 0.5 -0.75 -0.55 0 -1 Z" fill={s.color} />
    <path d="M0 -0.85 L0 0.95" stroke="rgba(0,0,0,0.25)" strokeWidth={0.07} fill="none" />
    <path d="M0 -1 C0.75 -0.55 0.7 0.5 0 1" stroke="rgba(255,255,255,0.25)" strokeWidth={0.05} fill="none" />
  </g>
);

export const leafColor = (seed: string) => {
  const r = random(seed);
  if (r < 0.35) return A.base;
  if (r < 0.6) return A.light;
  if (r < 0.8) return B.base;
  return mix(A.base, "#d4e86a", 0.5);
};

/** Calque plein écran de feuilles : `fn(i)` renvoie l'état de la feuille i (ou null). */
export const LeafLayer: React.FC<{ count: number; fn: (i: number) => LeafState | null; style?: React.CSSProperties }> = ({ count, fn, style }) => {
  const { width: W, height: H } = useVideoConfig();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", ...style }}>
      <defs>
        <filter id="leafShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#leafShadow)">
        {Array.from({ length: count }).map((_, i) => {
          const s = fn(i);
          return s && s.opacity > 0.01 ? <LeafShape key={i} s={s} /> : null;
        })}
      </g>
    </svg>
  );
};

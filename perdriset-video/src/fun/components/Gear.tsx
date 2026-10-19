import React from "react";
import { A } from "../../theme";

/** Points d'une roue dentée (polygone), centrée en (cx, cy). */
export const gearPoints = (cx: number, cy: number, rOuter: number, teeth = 12, rot = 0, depth = 0.16) => {
  const rInner = rOuter * (1 - depth);
  const pts: [number, number][] = [];
  const step = (Math.PI * 2) / teeth;
  const a0 = (rot * Math.PI) / 180;
  for (let i = 0; i < teeth; i++) {
    const a = a0 + i * step;
    // creux, flanc montant, sommet, flanc descendant
    const seg = [
      [a, rInner],
      [a + step * 0.18, rInner],
      [a + step * 0.28, rOuter],
      [a + step * 0.62, rOuter],
      [a + step * 0.72, rInner],
    ] as const;
    for (const [ang, r] of seg) pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
  }
  return pts;
};

export const gearPath = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z`;
export const gearClip = (pts: [number, number][]) => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(", ")})`;

/** Roue dentée néon (trait lumineux + bloom), dessinée progressivement par `draw`. */
export const NeonGear: React.FC<{ cx: number; cy: number; r: number; rot: number; draw?: number; opacity?: number; teeth?: number; width?: number }> = ({
  cx,
  cy,
  r,
  rot,
  draw = 1,
  opacity = 1,
  teeth = 12,
  width = 7,
}) => {
  if (opacity <= 0.01) return null;
  const d = gearPath(gearPoints(0, 0, r, teeth, 0));
  const dash = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - draw };
  const pad = r + 60;
  return (
    <svg
      width={pad * 2}
      height={pad * 2}
      viewBox={`${-pad} ${-pad} ${pad * 2} ${pad * 2}`}
      style={{ position: "absolute", left: cx - pad, top: cy - pad, overflow: "visible", opacity, pointerEvents: "none" }}
    >
      <defs>
        <filter id={`ng${Math.round(r)}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <g transform={`rotate(${rot})`}>
        <path d={d} fill="none" stroke={A.base} strokeWidth={width * 3} strokeLinejoin="round" filter={`url(#ng${Math.round(r)})`} {...dash} />
        <path d={d} fill="none" stroke={A.light} strokeWidth={width} strokeLinejoin="round" {...dash} />
        <path d={d} fill="none" stroke="#fff" strokeWidth={width * 0.35} strokeLinejoin="round" opacity={0.8} {...dash} />
      </g>
    </svg>
  );
};

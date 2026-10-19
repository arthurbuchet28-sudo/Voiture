import React, { useId } from "react";
import { A } from "../theme";

/**
 * Traînée de lumière néon qui parcourt le contour d'un rectangle arrondi.
 * offset : position (0 → 1 = un tour), length : longueur de la comète (fraction du périmètre).
 */
export const LightTrail: React.FC<{
  width: number;
  height: number;
  radius: number;
  offset: number;
  length: number;
  intensity: number;
  pad?: number;
}> = ({ width, height, radius, offset, length, intensity, pad = 2 }) => {
  const id = "lt" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const w = width + pad * 2;
  const h = height + pad * 2;
  const rect = { x: 0, y: 0, width: w, height: h, rx: radius + pad, pathLength: 1, fill: "none", strokeLinecap: "round" } as const;
  const dash = `${length} ${1 - length}`;
  if (intensity <= 0) return null;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: -pad, top: -pad, overflow: "visible", opacity: intensity, pointerEvents: "none" }}>
      <defs>
        <filter id={`${id}a`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
        <filter id={`${id}b`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
      </defs>
      <rect {...rect} stroke={A.base} strokeWidth={22} strokeDasharray={dash} strokeDashoffset={offset} filter={`url(#${id}a)`} />
      <rect {...rect} stroke={A.light} strokeWidth={8} strokeDasharray={dash} strokeDashoffset={offset} filter={`url(#${id}b)`} />
      <rect {...rect} stroke="#ffffff" strokeWidth={3} strokeDasharray={`${length * 0.55} ${1 - length * 0.55}`} strokeDashoffset={offset - length * 0.45} />
    </svg>
  );
};

import React from "react";
import { mix } from "../../lib/utils";
import { A, B } from "../../theme";

/**
 * Tondeuse stylisée vue de profil (vers la droite), aux couleurs de la marque.
 * Taille de référence : 420 × 300. `wheel` = rotation des roues (degrés), `bump` = petit sautillement.
 */
export const Mower: React.FC<{ size?: number; wheel: number; bump?: number }> = ({ size = 420, wheel, bump = 0 }) => {
  const dark = "#0E1F12";
  const Wheel: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill="#111613" />
      <circle r={r * 0.82} fill="none" stroke="#2a332c" strokeWidth={r * 0.18} />
      <g transform={`rotate(${wheel})`}>
        <circle r={r * 0.45} fill="#c9d3cc" />
        {[0, 72, 144, 216, 288].map((a) => (
          <rect key={a} x={-r * 0.06} y={-r * 0.42} width={r * 0.12} height={r * 0.3} rx={2} fill="#7d877f" transform={`rotate(${a})`} />
        ))}
        <circle r={r * 0.14} fill={A.base} />
      </g>
    </g>
  );
  return (
    <svg width={size} height={(size * 300) / 420} viewBox="0 0 420 300" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="mowerBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={A.light} />
          <stop offset="60%" stopColor={A.base} />
          <stop offset="100%" stopColor={mix(A.base, B.base, 0.6)} />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${bump})`}>
        {/* Guidon */}
        <path d="M120 180 L28 40 L4 40" stroke={dark} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M30 44 L60 70" stroke="#2c3a30" strokeWidth={8} strokeLinecap="round" />
        {/* Bac de ramassage */}
        <path d="M70 150 Q60 108 112 104 L150 104 L160 196 L92 206 Q72 196 70 150 Z" fill={mix(B.base, "#000000", 0.25)} />
        <path d="M86 128 L146 124 M84 152 L150 148 M88 176 L152 172" stroke="rgba(255,255,255,0.12)" strokeWidth={4} />
        {/* Carter */}
        <path d="M130 196 Q130 150 190 146 L350 146 Q400 150 404 200 L404 222 Q404 232 392 232 L142 232 Q130 232 130 220 Z" fill="url(#mowerBody)" />
        <path d="M150 158 L380 158" stroke="rgba(255,255,255,0.45)" strokeWidth={5} strokeLinecap="round" />
        {/* Moteur */}
        <rect x={208} y={92} width={124} height={62} rx={18} fill={dark} />
        <rect x={222} y={74} width={80} height={26} rx={10} fill="#1d2c21" />
        <rect x={226} y={106} width={92} height={10} rx={5} fill={A.base} opacity={0.9} />
        <circle cx={320} cy={84} r={9} fill="#c9d3cc" />
        {/* Roues */}
        <Wheel cx={176} cy={236} r={44} />
        <Wheel cx={362} cy={244} r={36} />
      </g>
    </svg>
  );
};

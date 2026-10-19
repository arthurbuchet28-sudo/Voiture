import { interpolate } from "remotion";

/** Options d'interpolate() les plus utilisées : on bloque aux deux extrémités. */
export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Secousse de caméra amortie déclenchée à la frame `at`.
 * Renvoie un décalage {x, y} en pixels.
 */
export const shake = (
  frame: number,
  at: number,
  amplitude: number,
  decayFrames = 6,
) => {
  const t = frame - at;
  if (t < 0) return { x: 0, y: 0 };
  const decay = Math.exp(-t / decayFrames);
  return {
    x: Math.sin(t * 2.7) * amplitude * decay,
    y: Math.cos(t * 3.4) * amplitude * decay * 0.8,
  };
};

/** Impulsion 1 → 0 sur chaque temps musical (pour faire « pulser » les formes). */
export const beatPulse = (frame: number, beat: number) => {
  const t = ((frame % beat) + beat) % beat;
  return Math.exp(-t / (beat * 0.22));
};

/** Progression linéaire bornée entre deux frames. */
export const progress = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], CLAMP);

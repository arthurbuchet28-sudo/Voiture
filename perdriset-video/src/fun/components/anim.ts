import { spring } from "remotion";
import { clamp } from "../../lib/utils";

/** Ressort nerveux de la version ludique (dépassement marqué). */
export const BOUNCY = { damping: 10, stiffness: 200, mass: 0.9 } as const;
export const SNAPPY = { damping: 12, stiffness: 170, mass: 0.8 } as const;

/**
 * Chute avec rebond et squash & stretch.
 * y : décalage vertical (négatif = au-dessus de la ligne de base) ;
 * sx / sy : échelles à appliquer avec transform-origin en bas.
 */
export const drop = (frame: number, fps: number, delay: number, from = -700, config: typeof BOUNCY = BOUNCY) => {
  const s = (f: number) => spring({ frame: f - delay, fps, config });
  const y = (1 - s(frame)) * from;
  const yPrev = (1 - s(frame - 1)) * from;
  const vy = y - yPrev;
  const squash = y > 0 ? clamp(y / 70, 0, 0.28) : 0;
  const stretch = clamp(Math.abs(vy) / 140, 0, 0.3);
  return {
    y,
    sx: 1 - stretch * 0.45 + squash * 0.9,
    sy: 1 + stretch - squash,
    visible: frame >= delay,
    blur: clamp(Math.abs(vy) / 12, 0, 12),
    progress: s(frame),
  };
};

/** « Pop » : échelle avec dépassement (0 → ~1,15 → 1). */
export const pop = (frame: number, fps: number, delay: number, config: typeof BOUNCY = BOUNCY) =>
  Math.max(0, spring({ frame: frame - delay, fps, config }));

/** Secousse amortie (px) déclenchée à `at`. */
export const shake = (frame: number, at: number, amp = 14, len = 18) => {
  const f = frame - at;
  if (f < 0 || f > len) return { x: 0, y: 0 };
  const k = 1 - f / len;
  return { x: Math.sin(f * 2.7) * amp * k, y: Math.cos(f * 3.3) * amp * 0.6 * k };
};

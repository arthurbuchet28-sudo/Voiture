import React from "react";
import { random, useVideoConfig } from "remotion";

/**
 * Bulles de soda. Tout est déterministe (random(seed)) et piloté par `time`,
 * que l'on passe depuis useCurrentFrame() : on peut ainsi accélérer, ralentir
 * ou figer les bulles. Empiler plusieurs couches de tailles / vitesses / flous
 * différents donne l'effet de parallaxe.
 */

const bubbleStyle = (size: number, opacity: number): React.CSSProperties => ({
  position: "absolute",
  width: size,
  height: size,
  borderRadius: "50%",
  border: `${Math.max(1, size * 0.06)}px solid rgba(255,255,255,0.55)`,
  background:
    "radial-gradient(circle at 32% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.28) 16%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0) 70%)",
  opacity,
});

type Range = [number, number];
const lerp = (r: Range, t: number) => r[0] + (r[1] - r[0]) * t;

type BubblesProps = {
  time: number;
  count: number;
  seed: string;
  size: Range;
  /** Vitesse de montée en px / frame. */
  speed: Range;
  opacity?: number;
  blur?: number;
  wobble?: number;
};

/** Champ de bulles qui montent en boucle sur tout l'écran. */
export const Bubbles: React.FC<BubblesProps> = ({
  time,
  count,
  seed,
  size,
  speed,
  opacity = 1,
  blur = 0,
  wobble = 14,
}) => {
  const { width, height } = useVideoConfig();
  const travel = height + size[1] * 2;

  return (
    <div style={{ position: "absolute", inset: 0, filter: blur ? `blur(${blur}px)` : undefined }}>
      {new Array(count).fill(true).map((_, i) => {
        const d = lerp(size, random(`${seed}-s-${i}`));
        const v = lerp(speed, random(`${seed}-v-${i}`));
        const offset = random(`${seed}-o-${i}`) * travel;
        const y = height + size[1] - ((offset + time * v) % travel);
        const x =
          random(`${seed}-x-${i}`) * width +
          Math.sin(time * 0.06 + i * 1.7) * wobble;
        return (
          <div
            key={i}
            style={{
              ...bubbleStyle(d, opacity * (0.5 + 0.5 * random(`${seed}-a-${i}`))),
              transform: `translate(${x - d / 2}px, ${y - d / 2}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

type BubbleBurstProps = {
  /** Frames écoulées depuis l'ouverture (rien n'est rendu si < 0). */
  time: number;
  count: number;
  seed: string;
  origin: { x: number; y: number };
  /** Durée pendant laquelle de nouvelles bulles sont émises. */
  emitFrames?: number;
};

/** Geyser de bulles qui jaillit d'un point (ouverture de la canette). */
export const BubbleBurst: React.FC<BubbleBurstProps> = ({
  time,
  count,
  seed,
  origin,
  emitFrames = 30,
}) => {
  if (time < 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {new Array(count).fill(true).map((_, i) => {
        const delay = random(`${seed}-d-${i}`) * emitFrames;
        const t = time - delay;
        if (t < 0) return null;
        const angle = -Math.PI / 2 + (random(`${seed}-a-${i}`) - 0.5) * 1.6;
        const v0 = 14 + random(`${seed}-v-${i}`) * 26;
        // Ralentissement par frottement puis montée lente (flottabilité).
        const dist = (v0 * (1 - Math.exp(-t * 0.08))) / 0.08;
        const x = origin.x + Math.cos(angle) * dist + Math.sin(t * 0.15 + i) * 10;
        const y = origin.y + Math.sin(angle) * dist - t * 3;
        const d = (10 + random(`${seed}-s-${i}`) * 50) * Math.min(1, 0.3 + t / 12);
        const fade = Math.max(0, 1 - t / 70);
        return (
          <div
            key={i}
            style={{
              ...bubbleStyle(d, fade),
              transform: `translate(${x - d / 2}px, ${y - d / 2}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

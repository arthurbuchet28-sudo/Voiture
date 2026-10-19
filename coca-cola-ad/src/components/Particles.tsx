import React from "react";
import { random } from "remotion";

/**
 * Explosion de particules (gouttelettes, étincelles, confettis).
 * Physique simple : vitesse initiale avec frottement + gravité. Les gouttes
 * sont étirées dans le sens du mouvement pour simuler un motion blur.
 */

type Range = [number, number];
const lerp = (r: Range, t: number) => r[0] + (r[1] - r[0]) * t;

type ParticlesProps = {
  /** Frames écoulées depuis l'explosion (rien n'est rendu si < 0). */
  time: number;
  count: number;
  seed: string;
  origin: { x: number; y: number };
  colors: string[];
  /** Plage d'angles en radians (0 = droite, -π/2 = haut). */
  spread?: Range;
  speed?: Range;
  size?: Range;
  gravity?: number;
  drag?: number;
  life?: number;
  /** Facteur d'étirement (motion blur). 0 = points ronds. */
  streak?: number;
  shape?: "dot" | "confetti";
};

export const Particles: React.FC<ParticlesProps> = ({
  time,
  count,
  seed,
  origin,
  colors,
  spread = [-Math.PI, Math.PI],
  speed = [8, 30],
  size = [4, 12],
  gravity = 0.3,
  drag = 0.06,
  life = 45,
  streak = 1.2,
  shape = "dot",
}) => {
  if (time < 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {new Array(count).fill(true).map((_, i) => {
        const r = (k: string) => random(`${seed}-${k}-${i}`);
        const lifeI = life * (0.6 + 0.4 * r("l"));
        const t = time;
        if (t > lifeI) return null;

        const angle = lerp(spread, r("a"));
        const v0 = lerp(speed, r("v"));
        const k = Math.exp(-drag * t);
        const travelled = (v0 * (1 - k)) / drag;
        const x = origin.x + Math.cos(angle) * travelled;
        const y = origin.y + Math.sin(angle) * travelled + 0.5 * gravity * t * t;

        // Vitesse instantanée → direction et longueur de la traînée.
        const vx = Math.cos(angle) * v0 * k;
        const vy = Math.sin(angle) * v0 * k + gravity * t;
        const vel = Math.hypot(vx, vy);
        const d = lerp(size, r("s")) * (1 - (t / lifeI) * 0.5);
        const opacity = Math.min(1, (1 - t / lifeI) * 1.6);
        const color = colors[Math.floor(r("c") * colors.length)];

        if (shape === "confetti") {
          const spin = t * (r("r") * 20 - 10);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: d * 0.6,
                height: d * 1.3,
                background: color,
                borderRadius: 2,
                opacity,
                transform: `translate(${x}px, ${y}px) rotate(${spin}deg) scaleY(${Math.cos(spin / 25)})`,
              }}
            />
          );
        }

        const len = d + vel * streak;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: len,
              height: d,
              borderRadius: d,
              background: color,
              opacity,
              transformOrigin: "0 50%",
              transform: `translate(${x}px, ${y - d / 2}px) rotate(${Math.atan2(vy, vx) + Math.PI}rad)`,
            }}
          />
        );
      })}
    </div>
  );
};

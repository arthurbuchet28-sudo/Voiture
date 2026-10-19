import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile } from "remotion";
import { useScene } from "../lib/scene";
import { clamp, ease } from "../lib/utils";
import { CONFIG } from "../config";
import { A, B, font } from "../theme";

const SIZE = 150;

/** Scène 1 (0-3 s) : accroche « Votre jardin mérite le meilleur. » sur fond de pelouse. */
export const Scene1Hook: React.FC = () => {
  const { frame, absFrame, fps } = useScene();
  const t = absFrame / fps;

  // Fond végétal : photo de pelouse floutée, assombrie, teintée de vert, en lent travelling
  const bgIn = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: "clamp", easing: ease.out });
  const bgScale = interpolate(frame, [0, 200], [1.22, 1.08], { easing: ease.soft });

  // Mots : chaque mot monte avec un ressort et passe du flou au net
  const words = CONFIG.hook.map((line) => line.split(" "));
  let k = 0;
  const highlight = new Set(["le", "meilleur."]);

  // Trait lumineux sous « le meilleur. »
  const line = interpolate(frame, [52, 92], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut });
  const comet = interpolate(frame, [70, 150], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.soft });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: bgIn * 0.55 }}>
        <Img
          src={staticFile("pelouse.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bgScale}) translateX(${Math.sin(t * 0.4) * 12}px)`,
            filter: "blur(10px) saturate(1.2) brightness(0.75)",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${B.a(0.25)} 0%, rgba(2,5,4,0.75) 70%, rgba(2,5,4,0.95) 100%)`,
        }}
      />
      <AbsoluteFill style={{ ...font, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {words.map((ws, li) => (
            <div key={li} style={{ display: "flex", gap: SIZE * 0.26, position: "relative" }}>
              {ws.map((w) => {
                const i = k++;
                const s = spring({ frame: frame - 6 - i * 6, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
                const blur = (1 - clamp(s)) * 14;
                const hl = li === 1 && highlight.has(w);
                return (
                  <div
                    key={w}
                    style={{
                      fontSize: SIZE,
                      fontWeight: 800,
                      letterSpacing: "-0.035em",
                      lineHeight: 1.12,
                      whiteSpace: "nowrap",
                      opacity: clamp(s * 1.6),
                      transform: `translateY(${(1 - s) * 70}px) scale(${0.92 + 0.08 * s})`,
                      filter: `${blur > 0.3 ? `blur(${blur.toFixed(2)}px) ` : ""}drop-shadow(0 6px 30px rgba(0,0,0,0.55))${
                        hl ? ` drop-shadow(0 0 22px ${A.a(0.45)})` : ""
                      }`,
                      ...(hl
                        ? {
                            background: `linear-gradient(180deg, ${A.pale} 0%, ${A.light} 45%, ${A.base} 100%)`,
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                          }
                        : { color: "#fff" }),
                    }}
                  >
                    {w}
                  </div>
                );
              })}
              {li === 1 ? <Underline progress={line} comet={comet} /> : null}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Trait néon tracé sous la fin de l'accroche, avec une comète blanche qui le parcourt. */
const Underline: React.FC<{ progress: number; comet: number }> = ({ progress, comet }) => {
  if (progress <= 0) return null;
  const W = 820;
  const d = `M0 14 C ${W * 0.3} 2, ${W * 0.7} 2, ${W} 12`;
  const dash = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - progress };
  return (
    <svg width={W} height={30} style={{ position: "absolute", right: 0, bottom: -16, overflow: "visible" }}>
      <defs>
        <filter id="ulBloom" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      <path d={d} fill="none" stroke={A.base} strokeWidth={18} strokeLinecap="round" filter="url(#ulBloom)" {...dash} />
      <path d={d} fill="none" stroke={A.light} strokeWidth={7} strokeLinecap="round" {...dash} />
      <path
        d={d}
        fill="none"
        stroke="#fff"
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="0.12 0.88"
        strokeDashoffset={0.12 - comet * 1.12}
        opacity={progress * (1 - comet * 0.4)}
      />
    </svg>
  );
};

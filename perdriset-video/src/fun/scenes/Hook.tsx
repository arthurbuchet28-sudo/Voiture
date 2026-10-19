import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ease } from "../../lib/utils";
import { A, B, font } from "../../theme";
import { drop } from "../components/anim";
import { Grass } from "../components/Grass";
import { FUN } from "../config";

const SIZE = 156;
// Le dernier groupe (« le meilleur. ») tombe sur le temps (frame 30)
const DELAYS = [2, 10, 20, 30];

/** Accroche : les mots tombent un par un et rebondissent, l'herbe pousse dessous. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const grow = interpolate(frame, [0, 50], [0, 1], { extrapolateRight: "clamp", easing: ease.out });
  let k = 0;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.5 }}>
        <Img
          src={staticFile("pelouse.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.2 - t * 0.03})`, filter: "blur(12px) saturate(1.2) brightness(0.7)" }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${B.a(0.2)} 0%, rgba(2,5,4,0.7) 70%, rgba(2,5,4,0.92) 100%)` }} />
      <Grass grow={grow} t={t} height={170} seed="hook" />

      <AbsoluteFill style={{ ...font, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: -60 }}>
          {FUN.hook.map((line, li) => (
            <div key={li} style={{ display: "flex", gap: SIZE * 0.26 }}>
              {line.map((w) => {
                const i = k++;
                const d = drop(frame, fps, DELAYS[i], -800);
                if (!d.visible) return <div key={w} style={{ fontSize: SIZE, fontWeight: 800, opacity: 0, whiteSpace: "nowrap", letterSpacing: "-0.035em" }}>{w}</div>;
                const hl = i === 3;
                return (
                  <div
                    key={w}
                    style={{
                      position: "relative",
                      fontSize: SIZE,
                      fontWeight: 800,
                      letterSpacing: "-0.035em",
                      lineHeight: 1.12,
                      whiteSpace: "nowrap",
                      transformOrigin: "50% 100%",
                      transform: `translateY(${d.y}px) scale(${d.sx}, ${d.sy}) rotate(${(1 - clamp(d.progress)) * (i % 2 ? 8 : -8)}deg)`,
                    }}
                  >
                    <span
                      style={{
                        filter: `drop-shadow(0 8px 30px rgba(0,0,0,0.55))${hl ? ` drop-shadow(0 0 24px ${A.a(0.5)})` : ""}`,
                        ...(hl
                          ? { background: `linear-gradient(180deg, ${A.pale} 0%, ${A.light} 45%, ${A.base} 100%)`, WebkitBackgroundClip: "text", color: "transparent" }
                          : { color: "#fff" }),
                      }}
                    >
                      {w}
                    </span>
                    {hl ? <Sparkles frame={frame - 44} /> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Petites étoiles à 4 branches qui scintillent autour de « le meilleur. ». */
const Sparkles: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < 0) return null;
  const spots = [
    [0.04, 0.12],
    [0.96, 0.05],
    [0.62, 0.92],
    [0.3, -0.02],
    [1.02, 0.7],
  ];
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }} viewBox="0 0 100 100" preserveAspectRatio="none">
      {spots.map(([x, y], i) => {
        const f = (frame - i * 9) % 48;
        if (frame - i * 9 < 0) return null;
        const s = Math.sin(clamp(f / 26) * Math.PI);
        const r = 5 + random(`sp${i}`) * 3;
        return (
          <path
            key={i}
            d={`M0 ${-r} Q${r * 0.15} ${-r * 0.15} ${r} 0 Q${r * 0.15} ${r * 0.15} 0 ${r} Q${-r * 0.15} ${r * 0.15} ${-r} 0 Q${-r * 0.15} ${-r * 0.15} 0 ${-r} Z`}
            fill="#fff"
            transform={`translate(${x * 100} ${y * 100}) scale(${s * 0.35} ${s * 0.6}) rotate(${f * 3})`}
            style={{ filter: `drop-shadow(0 0 3px ${A.light})` }}
          />
        );
      })}
    </svg>
  );
};

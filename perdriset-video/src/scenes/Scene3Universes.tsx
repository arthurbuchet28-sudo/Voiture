import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile } from "remotion";
import { LightTrail } from "../components/LightTrail";
import { DirectionalBlur } from "../lib/motionBlur";
import { useScene } from "../lib/scene";
import { clamp, ease, lerp } from "../lib/utils";
import { CONFIG } from "../config";
import { A, B, font, ui } from "../theme";

type Pt = { x: number; y: number };
const bezier = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

const PW = 780;
const PH = 500;
const SPACING = 900;
const RADIUS = 30;

/** Scène 3 (6-11 s) : les 4 univers défilent en perspective, reliés par des lignes de lumière. */
export const Scene3Universes: React.FC = () => {
  const { frame, absFrame, fps, duration } = useScene();
  const t = absFrame / fps;
  const items = CONFIG.universes;
  const n = items.length;

  // Défilement par paliers : chaque univers marque une pause au centre, puis glisse vite vers le suivant
  const travel = ((n - 1) * SPACING) / 2;
  const STEP = 64;
  const MOVE = 26;
  const scroll = (f: number) =>
    travel -
    SPACING *
      Array.from({ length: n - 1 }).reduce<number>(
        (acc, _, k) => acc + interpolate(f, [44 + k * STEP, 44 + k * STEP + MOVE], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut }),
        0,
      );
  const vx = Math.abs(scroll(frame) - scroll(frame - 1));

  // Fin de scène : tout se rassemble vers le centre
  const converge = interpolate(frame, [duration - 36, duration + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease.in,
  });

  const planeX = scroll(frame) * (1 - converge);
  const xs = items.map((_, i) => (i - (n - 1) / 2) * SPACING * (1 - converge * 0.92));
  const ys = items.map((_, i) => (i % 2 ? -26 : 26) * (1 - converge));

  const links = items.slice(0, -1).map((_, i) => {
    const a = { x: xs[i] + PW / 2 + 6, y: ys[i] - 60 };
    const b = { x: xs[i + 1] - PW / 2 - 6, y: ys[i + 1] + 60 };
    const mid = (a.x + b.x) / 2;
    return { p0: a, p1: { x: mid, y: a.y }, p2: { x: mid, y: b.y }, p3: b };
  });
  const pathOf = (l: (typeof links)[number]) => `M${l.p0.x} ${l.p0.y} C${l.p1.x} ${l.p1.y} ${l.p2.x} ${l.p2.y} ${l.p3.x} ${l.p3.y}`;
  const linkDraw = (i: number) =>
    interpolate(frame, [10 + i * 22, 60 + i * 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out }) * (1 - converge);

  const svgW = 3600;
  const svgH = 1400;

  return (
    <AbsoluteFill>
      <DirectionalBlur x={clamp(vx * 0.9 + converge * 6, 0, 10)} y={converge * 6}>
        <AbsoluteFill style={{ perspective: 2000, perspectiveOrigin: "50% 45%" }}>
          <div
            style={{
              position: "absolute",
              left: 960,
              top: 440,
              transformStyle: "preserve-3d",
              transform: `scale(${lerp(1, 0.22, converge)}) translateX(${planeX}px) rotateX(${6 + Math.sin(t * 0.5) * 1.5}deg) rotateY(${
                -14 + Math.sin(t * 0.4) * 3
              }deg)`,
            }}
          >
            {/* Lignes de lumière + particules */}
            <svg
              width={svgW}
              height={svgH}
              viewBox={`${-svgW / 2} ${-svgH / 2} ${svgW} ${svgH}`}
              style={{ position: "absolute", left: -svgW / 2, top: -svgH / 2, overflow: "visible" }}
            >
              <defs>
                <filter id="lineBloom" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation={9} />
                </filter>
                <filter id="dotBloom" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation={5} />
                </filter>
              </defs>
              {links.map((l, i) => {
                const dr = linkDraw(i);
                const d = pathOf(l);
                const flow = -(frame / 90 + i * 0.3);
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke={A.base} strokeWidth={10} filter="url(#lineBloom)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dr} opacity={0.8} />
                    <path d={d} fill="none" stroke={A.light} strokeWidth={2.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - dr} />
                    <path d={d} fill="none" stroke="#fff" strokeWidth={3} pathLength={1} strokeDasharray="0.05 0.28" strokeDashoffset={flow} opacity={dr} strokeLinecap="round" />
                    {Array.from({ length: 7 }).map((_, k) => {
                      const speed = 0.45 + random(`sp-${i}-${k}`) * 0.4;
                      const u = ((((frame / fps) * speed + k / 7 + random(`ph-${i}-${k}`)) % 1) + 1) % 1;
                      if (u > dr) return null;
                      const pt = bezier(l.p0, l.p1, l.p2, l.p3, u);
                      const jitter = (random(`j-${i}-${k}`) - 0.5) * 18;
                      const r = 3 + random(`r-${i}-${k}`) * 3;
                      return (
                        <g key={k} opacity={Math.sin(u * Math.PI)}>
                          <circle cx={pt.x} cy={pt.y + jitter} r={r * 2.4} fill={A.base} filter="url(#dotBloom)" />
                          <circle cx={pt.x} cy={pt.y + jitter} r={r * 0.7} fill="#fff" />
                        </g>
                      );
                    })}
                    {[l.p0, l.p3].map((p, k) => (
                      <circle key={k} cx={p.x} cy={p.y} r={7} fill="#fff" opacity={dr} style={{ filter: `drop-shadow(0 0 8px ${A.base}) drop-shadow(0 0 18px ${B.light})` }} />
                    ))}
                  </g>
                );
              })}
            </svg>

            {/* Cartes photo */}
            {items.map((item, i) => {
              const e = spring({ frame: frame + 10 - i * 9, fps, config: { damping: 20, stiffness: 55, mass: 1 } });
              const float = Math.sin(t * 0.9 + i * 2) * 10;
              // Mise en avant de la carte qui passe au centre de l'image
              const dist = Math.abs(xs[i] + planeX) / SPACING;
              const focus = clamp(1 - dist * 1.4) * (1 - converge);
              const trail = -interpolate(frame, [0, duration], [0.1 + i * 0.25, 1.6 + i * 0.25]);
              return (
                <div
                  key={item.title}
                  style={{
                    position: "absolute",
                    left: xs[i] - PW / 2,
                    top: ys[i] - PH / 2 + float + (1 - e) * 160,
                    width: PW,
                    height: PH,
                    opacity: e,
                    transform: `scale(${1 + 0.06 * focus})`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: RADIUS,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: `0 40px 80px rgba(0,0,0,0.55), 0 0 ${40 + 60 * focus}px ${A.a(0.15 + 0.3 * focus)}`,
                      background: ui.cardSolid,
                    }}
                  >
                    <Img
                      src={staticFile(item.image)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `scale(${1.12 - 0.06 * e}) translateX(${(planeX / 40) % 30}px)`,
                        filter: `brightness(${0.62 + 0.38 * focus}) saturate(${0.85 + 0.25 * focus})`,
                      }}
                    />
                    {/* Reflet vitré qui suit le défilement */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(115deg, transparent ${30 + planeX / 30 - i * 10}%, rgba(255,255,255,0.13) ${
                          42 + planeX / 30 - i * 10
                        }%, transparent ${54 + planeX / 30 - i * 10}%)`,
                      }}
                    />
                  </div>
                  <LightTrail width={PW} height={PH} radius={RADIUS} offset={trail} length={0.16} intensity={focus} />
                  {/* Légende */}
                  <div
                    style={{
                      ...font,
                      position: "absolute",
                      top: PH + 34,
                      left: -120,
                      right: -120,
                      textAlign: "center",
                      opacity: interpolate(e, [0.6, 1], [0, 1], { extrapolateLeft: "clamp" }) * (1 - converge) * (0.55 + 0.45 * focus),
                    }}
                  >
                    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, color: A.light, textShadow: `0 0 18px ${A.a(0.5)}` }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 4, whiteSpace: "nowrap" }}>{item.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </DirectionalBlur>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${A.a(0.5 * converge)} 0%, transparent ${10 + 25 * converge}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

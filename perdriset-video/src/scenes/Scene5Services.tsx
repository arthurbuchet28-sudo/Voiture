import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile } from "remotion";
import { IconCalendar, IconCheck, IconKey, IconTag, IconWrench } from "../components/icons";
import { LightTrail } from "../components/LightTrail";
import { useScene } from "../lib/scene";
import { clamp, ease, glow, textGlow } from "../lib/utils";
import { CONFIG } from "../config";
import { A, font, ui } from "../theme";

const PHOTO_W = 520;
const PHOTO_H = 690;
const ROW_W = 900;
const ROW_H = 118;
const ICONS = [IconWrench, IconCalendar, IconKey, IconTag];

/** Scène 5 (15-19,8 s) : la boutique en 3D à gauche, la liste des services qui s'empile à droite. */
export const Scene5Services: React.FC = () => {
  const { frame, absFrame, fps, duration } = useScene();
  const t = absFrame / fps;

  const photo = spring({ frame: frame + 6, fps, config: { damping: 22, stiffness: 55, mass: 1.1 } });
  const photoTrail = -interpolate(frame, [-10, duration], [0.05, 1.7], { easing: ease.soft });
  const title = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 100 } });
  const camScale = interpolate(frame, [0, duration], [1, 1.04]);

  return (
    <AbsoluteFill style={{ ...font, perspective: 1800, transform: `scale(${camScale})` }}>
      {/* Photo du magasin */}
      <div
        style={{
          position: "absolute",
          left: 170,
          top: 540 - PHOTO_H / 2,
          width: PHOTO_W,
          height: PHOTO_H,
          transformStyle: "preserve-3d",
          transform: `translateZ(${-600 * (1 - photo)}px) rotateY(${22 - 6 * photo + Math.sin(t * 0.6) * 3}deg) rotateX(${4 + Math.sin(t * 0.7) * 1.2}deg) translateY(${
            Math.sin(t * 0.9) * 8
          }px)`,
          opacity: photo,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 34,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: `0 60px 120px rgba(0,0,0,0.6), 0 0 90px ${A.a(0.25)}`,
          }}
        >
          <Img
            src={staticFile("magasin.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.15 - 0.08 * photo})` }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, transparent 35%)" }} />
        </div>
        <LightTrail width={PHOTO_W} height={PHOTO_H} radius={34} offset={photoTrail} length={0.16} intensity={photo} />
        <LightTrail width={PHOTO_W} height={PHOTO_H} radius={34} offset={photoTrail + 0.5} length={0.07} intensity={photo * 0.55} />
      </div>

      {/* Titre + liste */}
      <div style={{ position: "absolute", left: 820, top: 190, width: ROW_W }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            opacity: clamp(title * 1.4),
            transform: `translateY(${(1 - title) * 30}px)`,
            filter: title < 0.98 ? `blur(${((1 - title) * 10).toFixed(2)}px)` : undefined,
          }}
        >
          {CONFIG.servicesTitle}
          <span style={{ color: A.light, textShadow: textGlow(A.base, 0.6) }}>.</span>
        </div>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 22 }}>
          {CONFIG.services.map((s, i) => {
            const d = 22 + i * 16;
            const e = spring({ frame: frame - d, fps, config: { damping: 17, stiffness: 110, mass: 0.9 } });
            const check = spring({ frame: frame - d - 18, fps, config: { damping: 11, stiffness: 160, mass: 0.6 } });
            const trail = -interpolate(frame, [d, d + 70], [0.05, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.soft });
            const trailOn = interpolate(frame, [d, d + 10, d + 60, d + 74], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const Icon = ICONS[i % ICONS.length];
            return (
              <div
                key={s}
                style={{
                  position: "relative",
                  width: ROW_W,
                  height: ROW_H,
                  opacity: clamp(e * 1.5),
                  transform: `translateX(${(1 - e) * 120}px)`,
                  filter: e < 0.97 ? `blur(${((1 - e) * 10).toFixed(2)}px)` : undefined,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 26,
                    background: "linear-gradient(160deg, rgba(255,255,255,0.085), rgba(255,255,255,0.03))",
                    backgroundColor: ui.cardSolid,
                    border: `1px solid ${ui.border}`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.35)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 30px",
                    gap: 28,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      flex: "none",
                      borderRadius: 22,
                      background: A.a(0.2),
                      border: `1px solid ${A.a(0.55)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: glow(A.base, 0.5),
                    }}
                  >
                    <Icon size={40} color={A.pale} stroke={2.2} />
                  </div>
                  <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap", flex: 1 }}>{s}</div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: A.base,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `scale(${Math.max(0, check)})`,
                      boxShadow: glow(A.base, 0.6),
                    }}
                  >
                    <IconCheck size={30} color="#06200d" stroke={3.2} />
                  </div>
                </div>
                <LightTrail width={ROW_W} height={ROW_H} radius={26} offset={trail} length={0.2} intensity={trailOn} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

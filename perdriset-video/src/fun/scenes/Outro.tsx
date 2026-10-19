import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IconGlobe, IconPhone, IconPin } from "../../components/icons";
import { clamp, glow } from "../../lib/utils";
import { A, brandGradient, font, ui } from "../../theme";
import { drop, pop } from "../components/anim";
import { NeonGear } from "../components/Gear";
import { Grass } from "../components/Grass";
import { Mower } from "../components/Mower";
import { FUN } from "../config";

const LOGO_W = 820;
const LOGO_H = (LOGO_W * 504) / 1248;
const LOGO_X = 960 - LOGO_W / 2;
const LOGO_Y = 90;

/**
 * Appel à l'action. Tout est lisible à la frame ~75 de la scène (≈ 24,4 s) et reste affiché jusqu'à la fin.
 * Animation d'attente : herbe au vent, reflet sur le bouton, tondeuse qui passe au fond. Pas de fondu au noir.
 */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const logo = drop(frame, fps, 24, -700);
  const sites = pop(frame, fps, 44);
  const url = pop(frame, fps, 54);
  const phone = pop(frame, fps, 62);
  const shimmer = ((frame - 90) % 90) / 40;
  const breathe = 1 + Math.sin(t * 3) * 0.012;
  // Tondeuse en arrière-plan, derrière l'herbe
  const mx = interpolate(frame, [110, 270], [-460, 1960]);
  const gearRot = interpolate(frame, [40, 70], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) + Math.max(0, frame - 70) * 0.5;
  const gx = LOGO_X + 175 * (LOGO_W / 1248);
  const gy = LOGO_Y + 160 * (LOGO_W / 1248);

  const pill = (p: number, primary: boolean, children: React.ReactNode) => (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "26px 50px",
        borderRadius: 999,
        fontSize: 62,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        color: primary ? "#06200d" : "#fff",
        background: primary ? brandGradient(100) : "rgba(255,255,255,0.08)",
        border: primary ? "none" : `2px solid ${A.a(0.6)}`,
        boxShadow: primary ? `${glow(A.base, 1.1)}, inset 0 1px 0 rgba(255,255,255,0.5)` : `0 0 40px ${A.a(0.25)}`,
        transform: `scale(${p})`,
        opacity: clamp(p * 3),
        overflow: "hidden",
      }}
    >
      {children}
      {primary && frame > 90 ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${-40 + 180 * clamp(shimmer)}%`,
            width: "30%",
            background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.5), transparent)",
            transform: "skewX(-20deg)",
          }}
        />
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill style={font}>
      <div style={{ position: "absolute", left: mx, top: 860, opacity: 0.55, filter: "blur(1.5px)" }}>
        <Mower size={300} wheel={frame * 14} bump={Math.abs(Math.sin(frame / 3)) * -3} />
      </div>
      <Grass grow={interpolate(frame, [20, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} t={t} height={120} seed="outro" />

      <div style={{ position: "absolute", inset: 0, transform: `scale(${breathe})`, transformOrigin: "50% 40%" }}>
        {logo.visible ? (
          <div
            style={{
              position: "absolute",
              left: LOGO_X,
              top: LOGO_Y,
              width: LOGO_W,
              height: LOGO_H,
              transformOrigin: "50% 100%",
              transform: `translateY(${logo.y}px) scale(${logo.sx}, ${logo.sy})`,
              filter: `drop-shadow(0 0 26px ${A.a(0.45)})`,
            }}
          >
            <Img src={staticFile("logo.png")} style={{ width: LOGO_W, height: LOGO_H }} />
          </div>
        ) : null}
        <NeonGear cx={gx} cy={gy + logo.y} r={142} rot={gearRot} draw={clamp((frame - 40) / 16)} opacity={logo.visible ? 0.85 : 0} width={6} />

        <div style={{ position: "absolute", left: 0, right: 0, top: LOGO_Y + LOGO_H + 34, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: ui.text,
              transform: `scale(${sites})`,
              opacity: clamp(sites * 3),
            }}
          >
            <IconPin size={54} color={A.light} stroke={2.4} />
            {FUN.sites}
          </div>
          <div style={{ marginTop: 44, display: "flex", gap: 34 }}>
            {pill(
              url,
              true,
              <>
                <IconGlobe size={58} color="#06200d" stroke={2.4} />
                {FUN.url}
              </>,
            )}
            {pill(
              phone,
              false,
              <>
                <IconPhone size={56} color={A.light} stroke={2.4} />
                {FUN.phone}
              </>,
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

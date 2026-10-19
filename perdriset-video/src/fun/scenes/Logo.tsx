import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IconPin } from "../../components/icons";
import { clamp, ease } from "../../lib/utils";
import { A, font, ui } from "../../theme";
import { drop, pop } from "../components/anim";
import { NeonGear } from "../components/Gear";
import { FUN, GEAR, LOGO_POS } from "../config";

const LOGO_H = (LOGO_POS.w * 504) / 1248;

/** Logo : gros rebond, la roue dentée du « P » fait un tour, puis la baseline et l'épingle. */
export const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const d = drop(frame, fps, 6, -900);
  // Un tour complet de la roue dentée, sur 1 temps, après l'atterrissage
  const spin = interpolate(frame, [34, 64], [0, 360], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut });
  const gearDraw = interpolate(frame, [26, 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  const gearIdle = frame > 64 ? (frame - 64) * 0.6 : 0;
  const wobble = Math.sin(t * 3) * 1.2 * clamp((frame - 40) / 20);

  const line1 = pop(frame, fps, 60);
  const line2 = pop(frame, fps, 84);
  const pin = drop(frame, fps, 90, -260);

  return (
    <AbsoluteFill style={font}>
      {d.visible ? (
        <div
          style={{
            position: "absolute",
            left: LOGO_POS.x,
            top: LOGO_POS.y,
            width: LOGO_POS.w,
            height: LOGO_H,
            transformOrigin: "50% 100%",
            transform: `translateY(${d.y}px) scale(${d.sx}, ${d.sy}) rotate(${wobble}deg)`,
            filter: `drop-shadow(0 0 26px ${A.a(0.45)}) drop-shadow(0 20px 30px rgba(0,0,0,0.5))`,
          }}
        >
          <Img src={staticFile("logo.png")} style={{ width: LOGO_POS.w, height: LOGO_H }} />
        </div>
      ) : null}
      <NeonGear cx={GEAR.cx} cy={GEAR.cy + d.y} r={GEAR.r + 26} rot={spin + gearIdle} draw={gearDraw} opacity={d.visible ? 0.9 : 0} />

      <div style={{ position: "absolute", left: 0, right: 0, top: LOGO_POS.y + LOGO_H + 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: ui.text,
            transform: `scale(${line1})`,
            opacity: clamp(line1 * 3),
          }}
        >
          {FUN.baseline[0]}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: A.light,
            textShadow: `0 0 26px ${A.a(0.4)}`,
            transform: `scale(${line2})`,
            opacity: clamp(line2 * 3),
          }}
        >
          <div style={{ transformOrigin: "50% 100%", transform: `translateY(${pin.y}px) scale(${pin.sx}, ${pin.sy})`, opacity: pin.visible ? 1 : 0, display: "flex" }}>
            <IconPin size={60} color={A.light} stroke={2.4} />
          </div>
          {FUN.baseline[1]}
        </div>
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IconCalendar, IconCheck, IconKey, IconTag, IconWrench } from "../../components/icons";
import { clamp, ease, glow, lerp, textGlow } from "../../lib/utils";
import { A, font, ui } from "../../theme";
import { BOUNCY, drop, pop } from "../components/anim";
import { FUN, MORPH } from "../config";

const ICONS = [IconWrench, IconCalendar, IconKey, IconTag];
const PHOTO = { x: 170, y: 195, w: 520, h: 690 };
const ROW0 = 320;
const ROW_STEP = 140;
const MORPH_START = FUN.scenes.services - FUN.transitions.morph;

/** Services : la boutique entre en tournant, les services s'empilent en rebondissant ; la dernière ligne devient la carte suivante. */
export const Services: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const photo = spring({ frame: frame - 18, fps, config: { damping: 11, stiffness: 120, mass: 1 } });
  const title = drop(frame, fps, 30, -500);
  // Morph (fin de scène) : tout s'envole sauf la dernière ligne, qui grandit
  const m = interpolate(frame, [MORPH_START, MORPH_START + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut });
  const away = interpolate(frame, [MORPH_START, MORPH_START + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.in });

  return (
    <AbsoluteFill style={font}>
      {/* Photo du magasin */}
      <div
        style={{
          position: "absolute",
          left: PHOTO.x,
          top: PHOTO.y,
          width: PHOTO.w,
          height: PHOTO.h,
          borderRadius: 34,
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.16)",
          boxShadow: `0 50px 100px rgba(0,0,0,0.6), 0 0 80px ${A.a(0.3)}`,
          transform: `translate(${-900 * away}px, ${Math.sin(t * 3) * 8}px) rotate(${(1 - photo) * -200 - 4 + Math.sin(t * 2.2) * 1.5 - 30 * away}deg) scale(${Math.max(0, photo)})`,
        }}
      >
        <Img src={staticFile("magasin.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 820,
          top: 170,
          fontSize: 100,
          fontWeight: 800,
          letterSpacing: "-0.035em",
          transformOrigin: "0% 100%",
          transform: `translateY(${title.y - 500 * away}px) scale(${title.sx}, ${title.sy})`,
          opacity: title.visible ? 1 - away : 0,
        }}
      >
        {FUN.servicesTitle}
        <span style={{ color: A.light, textShadow: textGlow(A.base, 0.6) }}>.</span>
      </div>

      {FUN.services.map((s, i) => {
        const d0 = 52 + i * 18;
        const d = drop(frame, fps, d0, -700);
        if (!d.visible) return null;
        const check = pop(frame, fps, d0 + 16);
        const Icon = ICONS[i];
        const last = i === FUN.services.length - 1;
        const tilt = Math.sin(t * 5 + i * 1.7) * 6 + (1 - clamp(pop(frame, fps, d0 + 4, BOUNCY))) * 30;
        const r = MORPH.row;
        const c = MORPH.card;
        const rect = last
          ? { x: lerp(r.x, c.x, m), y: lerp(r.y, c.y, m), w: lerp(r.w, c.w, m), h: lerp(r.h, c.h, m), rad: lerp(r.r, c.r, m) }
          : { x: r.x, y: ROW0 + i * ROW_STEP, w: r.w, h: r.h, rad: r.r };
        const flyAway = last ? 0 : away;
        return (
          <div
            key={s}
            style={{
              position: "absolute",
              left: rect.x + 900 * flyAway * (i % 2 ? 1 : 1.3),
              top: rect.y,
              width: rect.w,
              height: rect.h,
              transformOrigin: "50% 100%",
              transform: m > 0 ? undefined : `translateY(${d.y}px) scale(${d.sx}, ${d.sy})`,
              opacity: 1 - flyAway,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: rect.rad,
                background: "linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
                backgroundColor: ui.cardSolid,
                border: `1px solid ${m > 0 ? A.a(0.5) : ui.border}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.35), 0 0 ${60 * m}px ${A.a(0.3 * m)}`,
                overflow: "hidden",
              }}
            >
              {/* Fond de la carte « confiance » qui apparaît pendant le morph */}
              <div style={{ position: "absolute", inset: 0, opacity: m, background: "linear-gradient(150deg, rgba(22,48,30,0.98) 0%, rgba(10,22,14,0.98) 60%, rgba(6,12,8,0.99) 100%)" }} />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: r.w,
                  height: r.h,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 30px",
                  gap: 28,
                  boxSizing: "border-box",
                  opacity: 1 - clamp(m * 3),
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    flex: "none",
                    borderRadius: 22,
                    background: A.a(0.22),
                    border: `1px solid ${A.a(0.55)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: glow(A.base, 0.5),
                    transform: `rotate(${tilt}deg)`,
                  }}
                >
                  <Icon size={40} color={A.pale} stroke={2.2} />
                </div>
                <div style={{ fontSize: 54, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap", flex: 1 }}>{s}</div>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    background: A.base,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${check}) rotate(${(1 - clamp(check)) * -90}deg)`,
                    boxShadow: glow(A.base, 0.7),
                  }}
                >
                  <IconCheck size={34} color="#06200d" stroke={3.4} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

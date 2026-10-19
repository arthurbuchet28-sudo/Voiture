import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { IconBriefcase, IconUsers } from "../../components/icons";
import { LightTrail } from "../../components/LightTrail";
import { DirectionalBlur } from "../../lib/motionBlur";
import { clamp, ease, glow, textGlow } from "../../lib/utils";
import { A, B, font, ui } from "../../theme";
import { drop, shake } from "../components/anim";
import { LeafLayer, leafColor } from "../components/Leaves";
import { FUN, MORPH } from "../config";

const C = MORPH.card;
const START = 34;
const CLAC = 94; // sur le temps
const GAUGE = { cx: 270, cy: 330, r: 200 };

/** Confiance : compteur 0 → 30 qui accélère comme un compte-tours, « clac » à 30, puis les pastilles sautent. */
export const Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { trust } = FUN;

  const value = (f: number) => trust.value * Math.pow(clamp((f - START) / (CLAC - START)), 2.2);
  const v = value(frame);
  const dv = Math.abs(v - value(frame - 1));
  const digitBlur = clamp(dv * 2.2, 0, 8);
  const sh = shake(frame, CLAC, 18, 20);
  const wave = interpolate(frame, [CLAC, CLAC + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  const label = spring({ frame: frame - CLAC - 2, fps, config: { damping: 9, stiffness: 220, mass: 0.8 } });
  const trail = -interpolate(frame, [0, FUN.scenes.trust], [0.05, 2.2]);

  // Aiguille du compte-tours : de −225° à +45°
  const gaugeP = v / trust.value;
  const needle = -225 + 270 * gaugeP;
  const arcLen = 0.75;

  return (
    <AbsoluteFill style={font}>
      <div style={{ position: "absolute", left: C.x, top: C.y, width: C.w, height: C.h, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {/* Onde de choc */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: C.r,
            border: `3px solid ${A.light}`,
            transform: `scale(${1 + wave * 0.18})`,
            opacity: wave > 0 ? (1 - wave) * 0.9 : 0,
            boxShadow: glow(A.base, 1.2),
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: C.r,
            overflow: "hidden",
            background: "linear-gradient(150deg, rgba(22,48,30,0.98) 0%, rgba(10,22,14,0.98) 60%, rgba(6,12,8,0.99) 100%)",
            border: `1px solid ${A.a(0.5)}`,
            boxShadow: `0 60px 120px rgba(0,0,0,0.6), 0 0 ${60 + 80 * (1 - wave) * (frame > CLAC ? 1 : 0)}px ${A.a(0.35)}`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 80% at 15% 30%, ${A.a(0.18)} 0%, transparent 60%), radial-gradient(50% 60% at 100% 100%, ${B.a(0.25)} 0%, transparent 70%)` }} />

          {/* Compte-tours */}
          <svg width={500} height={520} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              <filter id="gaugeBloom" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation={8} />
              </filter>
            </defs>
            <g transform={`translate(${GAUGE.cx} ${GAUGE.cy}) rotate(135)`}>
              <circle r={GAUGE.r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={22} pathLength={1} strokeDasharray={`${arcLen} ${1 - arcLen}`} strokeLinecap="round" />
              <circle r={GAUGE.r} fill="none" stroke={A.base} strokeWidth={34} pathLength={1} strokeDasharray={`${arcLen * gaugeP} ${1 - arcLen * gaugeP}`} strokeLinecap="round" filter="url(#gaugeBloom)" opacity={0.8} />
              <circle r={GAUGE.r} fill="none" stroke={A.light} strokeWidth={18} pathLength={1} strokeDasharray={`${arcLen * gaugeP} ${1 - arcLen * gaugeP}`} strokeLinecap="round" />
              {Array.from({ length: 13 }).map((_, i) => {
                const a = (i / 12) * 270;
                return <line key={i} x1={GAUGE.r - 40} y1={0} x2={GAUGE.r - (i % 3 ? 52 : 62)} y2={0} stroke="rgba(255,255,255,0.4)" strokeWidth={4} strokeLinecap="round" transform={`rotate(${a})`} />;
              })}
            </g>
            <g transform={`translate(${GAUGE.cx} ${GAUGE.cy}) rotate(${needle + 90})`} opacity={frame >= START - 10 ? 1 : 0}>
              <path d={`M-9 ${-GAUGE.r + 112} L0 ${-GAUGE.r + 34} L9 ${-GAUGE.r + 112} Z`} fill="#fff" style={{ filter: `drop-shadow(0 0 8px ${A.light})` }} />
            </g>
          </svg>
          <div style={{ position: "absolute", left: GAUGE.cx - 200, top: GAUGE.cy - 104, width: 400, height: 220 }}>
            <DirectionalBlur x={0} y={digitBlur}>
              <div style={{ fontSize: 200, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#fff", textShadow: textGlow(A.base, frame >= CLAC ? 1.1 : 0.5) }}>
                {Math.round(v)}
              </div>
            </DirectionalBlur>
          </div>

          {/* « ans d'expertise » qui claque */}
          <div
            style={{
              position: "absolute",
              left: 540,
              top: 130,
              fontSize: 100,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              transformOrigin: "0% 50%",
              transform: `scale(${frame < CLAC + 2 ? 0 : 2.2 - 1.2 * label}) rotate(${(1 - clamp(label)) * -5}deg)`,
              background: `linear-gradient(180deg, #ffffff 20%, ${A.pale} 120%)`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            {trust.label}
          </div>

          {/* Pastilles qui sautent */}
          <div style={{ position: "absolute", left: 540, top: 290, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
            {[IconUsers, IconBriefcase].map((Icon, i) => {
              const d = drop(frame, fps, 122 + i * 16, -260);
              const hop = frame > 170 ? Math.max(0, Math.sin(((frame - 170 - i * 15) / 30) * Math.PI)) ** 8 * -14 : 0;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 30px",
                    borderRadius: 999,
                    fontSize: 44,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    background: "rgba(255,255,255,0.08)",
                    border: `1px solid ${ui.border}`,
                    transformOrigin: "50% 100%",
                    transform: `translateY(${d.y + hop}px) scale(${d.sx}, ${d.sy})`,
                    opacity: d.visible ? 1 : 0,
                  }}
                >
                  <Icon size={46} color={A.light} stroke={2.3} />
                  {trust.mini[i]}
                </div>
              );
            })}
          </div>
        </div>
        <LightTrail width={C.w} height={C.h} radius={C.r} offset={trail} length={0.16} intensity={1} />
      </div>

      {/* Confettis de feuilles au « clac » */}
      <LeafLayer
        count={40}
        fn={(i) => {
          const f = frame - CLAC;
          if (f < 0 || f > 60) return null;
          const a = random(`tc${i}`) * Math.PI * 2;
          const sp = 12 + random(`tv${i}`) * 18;
          const ox = C.x + GAUGE.cx;
          const oy = C.y + GAUGE.cy + 120;
          return {
            x: ox + Math.cos(a) * sp * f * (1 - f / 140),
            y: oy + Math.sin(a) * sp * f * (1 - f / 140) + 0.35 * f * f,
            size: 18 + random(`ts${i}`) * 18,
            rot: f * 12 + i * 33,
            flip: Math.cos(f / 4 + i),
            opacity: 1 - f / 60,
            color: leafColor(`tcc${i}`),
          };
        }}
      />
    </AbsoluteFill>
  );
};

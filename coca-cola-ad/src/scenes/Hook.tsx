import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Bubbles } from "../components/Bubbles";
import { KineticWords } from "../components/KineticWords";
import { Particles } from "../components/Particles";
import { COLORS, HOOK } from "../config";
import { fontFamily } from "../fonts";
import { CLAMP, shake } from "../lib/motion";

/**
 * Scène 1 — Accroche (0–3 s)
 * Fond noir, « pschhh » visuel (ondes de choc + gouttelettes), puis
 * « Chaud dehors ? » qui claque mot par mot avec secousse de caméra.
 */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2;
  const burst = frame - HOOK.burstAt;

  // Ondes concentriques décalées.
  const rings = [0, 4, 9].map((delay, i) => {
    const p = interpolate(burst - delay, [0, 30], [0, 1], {
      ...CLAMP,
      easing: Easing.out(Easing.cubic),
    });
    return {
      r: p * (1100 - i * 180),
      opacity: burst - delay < 0 ? 0 : (1 - p) * (i === 0 ? 1 : 0.6),
      stroke: interpolate(p, [0, 1], [26, 1.5]),
      color: i === 1 ? COLORS.red : COLORS.silverLight,
    };
  });

  // Le mot « pschhh » s'étire puis s'évapore.
  const pschIn = interpolate(burst, [0, 8], [0, 1], { ...CLAMP, easing: Easing.out(Easing.quad) });
  const pschOut = interpolate(frame, [HOOK.pschhOut - 8, HOOK.pschhOut], [0, 1], CLAMP);

  // Secousses : à l'ouverture puis à chaque mot qui claque.
  const shakes = [
    shake(frame, HOOK.burstAt, 10, 5),
    ...HOOK.words.map((_, i) => shake(frame, HOOK.firstWordAt + i * HOOK.wordStagger + 3, 22, 4)),
  ];
  const cam = shakes.reduce((a, s) => ({ x: a.x + s.x, y: a.y + s.y }), { x: 0, y: 0 });

  // Halo rouge en arrière-plan qui « respire » avec l'onde.
  const glow = interpolate(burst, [0, 6, 40], [0, 0.55, 0.25], CLAMP);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(228,0,43,${glow}) 0%, rgba(228,0,43,0) 55%)`,
        }}
      />
      {/* Bulles lointaines (couche de parallaxe arrière) */}
      <Bubbles time={frame} count={18} seed="hook-far" size={[6, 16]} speed={[2, 4]} opacity={0.25} blur={2} />

      <AbsoluteFill style={{ transform: `translate(${cam.x}px, ${cam.y}px)` }}>
        <svg width={width} height={height} style={{ position: "absolute" }}>
          {rings.map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r.r} fill="none" stroke={r.color} strokeWidth={r.stroke} opacity={r.opacity} />
          ))}
        </svg>

        <Particles
          time={burst}
          count={70}
          seed="hook-spray"
          origin={{ x: cx, y: cy }}
          colors={[COLORS.silverLight, COLORS.silver, COLORS.white]}
          speed={[12, 40]}
          size={[3, 9]}
          gravity={0.25}
          life={34}
          streak={1.4}
        />

        {/* Onomatopée visuelle */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 72,
              color: COLORS.silverLight,
              letterSpacing: `${interpolate(pschIn, [0, 1], [-0.05, 0.35])}em`,
              opacity: pschIn * (1 - pschOut),
              transform: `scale(${1 + pschOut * 0.6})`,
              filter: `blur(${pschOut * 14}px)`,
            }}
          >
            pschhh
          </div>
        </AbsoluteFill>

        {/* « Chaud dehors ? » */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          {HOOK.words.map((w, i) => (
            <KineticWords
              key={w}
              text={w}
              start={HOOK.firstWordAt + i * HOOK.wordStagger}
              mode="slam"
              fontSize={225}
              color={i === 0 ? COLORS.white : COLORS.red}
              style={{ marginTop: i === 0 ? 0 : 10 }}
            />
          ))}
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticWords } from "../components/KineticWords";
import { Particles } from "../components/Particles";
import { BEAT_FRAMES, COLORS, EMOTION, sceneFrames } from "../config";
import { CLAMP, beatPulse } from "../lib/motion";

/**
 * Scène 4 — Émotion (11–16 s)
 * Trois phrases, chacune révélée par un masque circulaire. Des formes
 * abstraites suggèrent le moment (un cercle qui bat), le partage (deux
 * cercles qui se rejoignent) et la fête (une foule de cercles qui dansent,
 * un égaliseur, des confettis).
 */

const SHAPES_Y = 760; // centre vertical des formes
const TEXT_TOP = 1240; // position des phrases

/** Phrase 1 : un cercle rouge qui bat comme un cœur, ondes qui s'en échappent. */
const MomentShapes: React.FC<{ local: number }> = ({ local }) => {
  const { fps, width } = useVideoConfig();
  const grow = spring({ frame: local, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = beatPulse(local, BEAT_FRAMES * 2);
  return (
    <svg width={width} height={1920} style={{ position: "absolute" }}>
      {[0, 1, 2].map((k) => {
        const t = (local - k * 10 + 60) % 30;
        const p = t / 30;
        return (
          <circle key={k} cx={width / 2} cy={SHAPES_Y} r={220 + p * 320} fill="none" stroke={COLORS.red} strokeWidth={4 - p * 3} opacity={(1 - p) * 0.6 * grow} />
        );
      })}
      <defs>
        <radialGradient id="moment-core" cx="0.38" cy="0.35">
          <stop offset="0" stopColor="#ff4d66" />
          <stop offset="1" stopColor={COLORS.red} />
        </radialGradient>
      </defs>
      <circle cx={width / 2} cy={SHAPES_Y} r={210 * grow * (1 + pulse * 0.05)} fill="url(#moment-core)" />
    </svg>
  );
};

/** Phrase 2 : deux cercles (deux amis) qui se rejoignent ; leur intersection se teinte. */
const ShareShapes: React.FC<{ local: number }> = ({ local }) => {
  const { fps, width } = useVideoConfig();
  const meet = spring({ frame: local - 2, fps, config: { damping: 14, stiffness: 80 } });
  const pulse = beatPulse(local, BEAT_FRAMES);
  const gap = interpolate(meet, [0, 1], [760, 120]);
  const r = 175 * (1 + pulse * 0.03);
  const ax = width / 2 - gap / 2;
  const bx = width / 2 + gap / 2;
  return (
    <svg width={width} height={1920} style={{ position: "absolute" }}>
      <defs>
        <clipPath id="share-a">
          <circle cx={ax} cy={SHAPES_Y} r={r} />
        </clipPath>
      </defs>
      <circle cx={ax} cy={SHAPES_Y} r={r} fill={COLORS.white} />
      <circle cx={bx} cy={SHAPES_Y} r={r} fill={COLORS.white} opacity={0.92} />
      <circle cx={bx} cy={SHAPES_Y} r={r} fill={COLORS.black} clipPath="url(#share-a)" />
      {/* petites bulles échangées entre les deux */}
      {[0, 1, 2, 3, 4].map((k) => {
        const t = ((local * 1.2 + k * 14) % 70) / 70;
        return (
          <circle
            key={k}
            cx={ax + (bx - ax) * t}
            cy={SHAPES_Y - 260 - Math.sin(t * Math.PI) * 120}
            r={8 + (k % 3) * 4}
            fill="none"
            stroke={COLORS.white}
            strokeWidth={3}
            opacity={Math.sin(t * Math.PI) * meet}
          />
        );
      })}
    </svg>
  );
};

/** Phrase 3 : une foule de cercles qui dansent sur le temps + égaliseur + confettis. */
const TogetherShapes: React.FC<{ local: number }> = ({ local }) => {
  const { fps, width } = useVideoConfig();
  const crowd = [
    { r: 70, c: COLORS.red },
    { r: 95, c: COLORS.black },
    { r: 120, c: COLORS.red },
    { r: 95, c: COLORS.silverDark },
    { r: 70, c: COLORS.black },
  ];
  const total = crowd.reduce((s, b) => s + b.r * 2, 0) - 40 * (crowd.length - 1);
  let x = width / 2 - total / 2;
  const bars = 16;

  return (
    <>
      <svg width={width} height={1920} style={{ position: "absolute" }}>
        {crowd.map((b, i) => {
          const appear = spring({ frame: local - i * 3, fps, config: { damping: 10, stiffness: 160 } });
          // Chaque cercle rebondit sur le temps, avec un décalage.
          const bounce = Math.abs(Math.sin(((local + i * 4) / BEAT_FRAMES) * Math.PI)) * 50;
          const cx = x + b.r;
          x += b.r * 2 - 40;
          return (
            <circle key={i} cx={cx} cy={SHAPES_Y + 80 - bounce * appear} r={b.r * appear} fill={b.c} opacity={0.95} />
          );
        })}
        {/* Égaliseur (la musique) */}
        {new Array(bars).fill(true).map((_, i) => {
          const h =
            30 +
            Math.abs(Math.sin(local * 0.25 + i * 0.9)) * 90 * (0.5 + 0.5 * beatPulse(local + i, BEAT_FRAMES));
          const bw = 22;
          const bx = width / 2 - (bars * (bw + 14)) / 2 + i * (bw + 14);
          const appear = interpolate(local, [6 + i, 14 + i], [0, 1], CLAMP);
          return <rect key={i} x={bx} y={1700 - h * appear} width={bw} height={h * appear} rx={bw / 2} fill={i % 2 ? COLORS.red : COLORS.black} />;
        })}
      </svg>
      <Particles
        time={local - 4}
        count={80}
        seed="confetti"
        origin={{ x: width / 2, y: SHAPES_Y - 120 }}
        colors={[COLORS.red, COLORS.black, COLORS.silver]}
        spread={[-Math.PI * 0.95, -Math.PI * 0.05]}
        speed={[14, 34]}
        size={[14, 26]}
        gravity={0.55}
        drag={0.05}
        life={60}
        shape="confetti"
      />
    </>
  );
};

const SHAPES = [MomentShapes, ShareShapes, TogetherShapes];

export const Emotion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const per = sceneFrames("emotion") / EMOTION.phrases.length;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {EMOTION.phrases.map((p, i) => {
        const start = i * per;
        const local = frame - start;
        if (local < 0) return null;
        // Masque circulaire qui s'ouvre depuis le centre des formes.
        const reveal = i === 0 ? 1 : spring({ frame: local, fps, config: { damping: 200, stiffness: 140 }, durationInFrames: 14 });
        const Shapes = SHAPES[i];
        // Légère dérive de parallaxe : formes et texte ne bougent pas à la même vitesse.
        const drift = local * 0.6;
        return (
          <AbsoluteFill
            key={p.text}
            style={{
              backgroundColor: p.bg,
              clipPath: i === 0 ? undefined : `circle(${reveal * 115}% at 50% ${(SHAPES_Y / 1920) * 100}%)`,
            }}
          >
            <AbsoluteFill style={{ transform: `translateY(${-drift}px)` }}>
              <Shapes local={local} />
            </AbsoluteFill>
            <AbsoluteFill style={{ top: TEXT_TOP, alignItems: "center", transform: `translateY(${-drift * 0.4}px)` }}>
              <KineticWords text={p.text} start={start + EMOTION.textDelay} stagger={6} mode="rise" fontSize={140} color={p.fg} />
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

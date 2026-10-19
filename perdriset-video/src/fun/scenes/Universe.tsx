import React from "react";
import { AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { IconWrench } from "../../components/icons";
import { clamp } from "../../lib/utils";
import { A, B, font } from "../../theme";
import { shake } from "../components/anim";
import { Clippings, Grass } from "../components/Grass";
import { LeafLayer, leafColor } from "../components/Leaves";
import { FUN } from "../config";

const CARD = { x: 370, y: 120, w: 1180, h: 650 };
const SLAM = 20;

/** Un univers : photo plein cadre dans une carte inclinée qui respire, titre énorme qui claque. */
export const Universe: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const item = FUN.universes[index];
  const tilt = index % 2 ? 2.5 : -2.5;

  const breathe = 1 + Math.sin(t * 4) * 0.012;
  const kb = 1.12 - frame * 0.0006;
  const slam = spring({ frame: frame - SLAM, fps, config: { damping: 9, stiffness: 220, mass: 0.8 } });
  const titleScale = frame < SLAM ? 0 : 2.6 - 1.6 * slam;
  const sh = shake(frame, SLAM + 6, 16);

  return (
    <AbsoluteFill style={font}>
      {/* Fond plein cadre : la même photo, floutée et assombrie */}
      <AbsoluteFill>
        <Img src={staticFile(item.image)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.25 - frame * 0.0008})`, filter: "blur(22px) brightness(0.42) saturate(1.2)" }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(2,5,4,0.75) 100%)` }} />
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 40,
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.16)",
          boxShadow: `0 50px 100px rgba(0,0,0,0.6), 0 0 80px ${A.a(0.3)}`,
          transform: `translate(${sh.x}px, ${sh.y}px) rotate(${tilt + Math.sin(t * 2) * 0.8}deg) scale(${breathe})`,
        }}
      >
        <Img src={staticFile(item.image)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${kb})` }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(2,8,4,0.55) 100%)" }} />
      </div>

      {item.fx === "grass" ? <GrassFx frame={frame} t={t} /> : null}
      {item.fx === "chips" ? <ChipsFx frame={frame} /> : null}
      {item.fx === "leaves" ? <LeavesFx frame={frame} /> : null}

      {/* Titre qui claque */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: "#fff",
            transform: `scale(${titleScale}) rotate(${(1 - clamp(slam)) * -6}deg)`,
            opacity: frame < SLAM ? 0 : clamp(slam * 2.5),
            textShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 30px ${A.a(0.45)}`,
            WebkitTextStroke: `2px ${A.a(0.35)}`,
          }}
        >
          {item.title}
          {item.fx === "wrench" ? <WrenchOrbit frame={frame} /> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const GrassFx: React.FC<{ frame: number; t: number }> = ({ frame, t }) => (
  <>
    <Grass grow={interpolate(frame, [0, 30], [0.3, 1], { extrapolateRight: "clamp" })} t={t} height={130} seed="u0" />
    <Clippings frame={frame} from={14} x={560} y={1060} count={36} dir={1} seed="u0a" />
    <Clippings frame={frame} from={40} x={1360} y={1060} count={36} dir={-1} seed="u0b" />
  </>
);

/** Copeaux qui jaillissent du point de coupe de la tronçonneuse. */
const ChipsFx: React.FC<{ frame: number }> = ({ frame }) => {
  const ox = CARD.x + CARD.w * 0.6;
  const oy = CARD.y + CARD.h * 0.42;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {Array.from({ length: 90 }).map((_, i) => {
        const born = 10 + random(`ch${i}`) * 70;
        const f = frame - born;
        if (f < 0 || f > 40) return null;
        const a = -Math.PI * (0.05 + random(`cha${i}`) * 0.9);
        const v = 9 + random(`chv${i}`) * 16;
        const x = ox + Math.cos(a) * v * f;
        const y = oy + Math.sin(a) * v * f + 0.45 * f * f;
        const s = 5 + random(`chs${i}`) * 9;
        const col = random(`chc${i}`) > 0.5 ? "#E3B579" : "#B98348";
        return <rect key={i} x={-s / 2} y={-s / 3} width={s} height={s * 0.6} rx={1.5} fill={col} opacity={1 - f / 40} transform={`translate(${x} ${y}) rotate(${f * 25 + i * 40})`} />;
      })}
    </svg>
  );
};

/** Feuilles qui s'envolent de gauche à droite en tourbillonnant. */
const LeavesFx: React.FC<{ frame: number }> = ({ frame }) => (
  <LeafLayer
    count={34}
    fn={(i) => {
      const born = random(`lf${i}`) * 70;
      const f = frame - born;
      if (f < 0 || f > 70) return null;
      const y0 = 300 + random(`lfy${i}`) * 750;
      return {
        x: -80 + f * (22 + random(`lfv${i}`) * 14),
        y: y0 - f * (3 + random(`lfu${i}`) * 5) + Math.sin(f / 6 + i) * 30,
        size: 22 + random(`lfs${i}`) * 26,
        rot: f * 9 + i * 50,
        flip: Math.cos(f / 5 + i),
        opacity: Math.min(1, (70 - f) / 15),
        color: leafColor(`lfc${i}`),
      };
    }}
  />
);

/** Clé à molette qui tourne autour du titre. */
const WrenchOrbit: React.FC<{ frame: number }> = ({ frame }) => {
  const a = ((frame - SLAM) / 40) * Math.PI * 2;
  const x = Math.cos(a) * 520;
  const y = Math.sin(a) * 110;
  const front = Math.sin(a) > 0;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 96,
        height: 96,
        marginLeft: -48,
        marginTop: -48,
        borderRadius: 30,
        background: front ? A.base : B.base,
        boxShadow: `0 0 30px ${A.a(0.6)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${x}px, ${y}px) scale(${front ? 1 : 0.7}) rotate(${frame * 6}deg)`,
        zIndex: front ? 2 : -1,
      }}
    >
      <IconWrench size={60} color="#06200d" stroke={2.6} />
    </div>
  );
};

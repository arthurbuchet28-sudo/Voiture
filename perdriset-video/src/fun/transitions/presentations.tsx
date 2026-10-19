import React from "react";
import { AbsoluteFill, Easing, interpolate, random } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { Background } from "../../components/Background";
import { DirectionalBlur } from "../../lib/motionBlur";
import { clamp, ease, lerp } from "../../lib/utils";
import { A } from "../../theme";
import { Clippings } from "../components/Grass";
import { gearClip, gearPoints, NeonGear } from "../components/Gear";
import { LeafLayer, leafColor } from "../components/Leaves";
import { Mower } from "../components/Mower";
import { GEAR, MORPH } from "../config";

/**
 * Présentations personnalisées pour <TransitionSeries>.
 * La scène entrante est rendue au-dessus de la sortante : les effets « par-dessus » sont donc dessinés côté entrant.
 */
type P = Record<string, never>;
type Props = TransitionPresentationComponentProps<P>;
const W = 1920;
const H = 1080;
const make = (component: React.FC<Props>) => (): TransitionPresentation<P> => ({ component, props: {} as P });

/* 1. Passage de tondeuse : la tondeuse traverse l'écran, la scène suivante est révélée derrière elle. */
const MowerComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, presentationDurationInFrames: dur }) => {
  const e = ease.soft(p);
  const mx = lerp(-760, W + 120, e); // bord gauche de la tondeuse
  const edge = mx + 350; // la coupe est au milieu du carter
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const f = p * dur;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${Math.max(0, W - edge)}px 0 0)` }}>
        <Background />
        {children}
      </AbsoluteFill>
      {/* Lisière d'herbe coupée le long de la révélation */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: edge - 40, width: 60, background: `linear-gradient(90deg, transparent, ${A.a(0.55)}, transparent)`, filter: "blur(8px)" }} />
      <Clippings frame={f} from={0} x={mx + 160} y={930} count={70} dir={-1} seed="mw" spread={0.8} />
      <div style={{ position: "absolute", left: mx, top: 520, filter: `drop-shadow(0 30px 30px rgba(0,0,0,0.5))` }}>
        <Mower size={720} wheel={f * 22} bump={Math.abs(Math.sin(f / 2.5)) * -6} />
      </div>
    </AbsoluteFill>
  );
};
export const mower = make(MowerComp);

/* 2. Zoom dans la roue dentée du « P » : on plonge dans la roue, la scène suivante sort d'un cercle denté. */
const ZoomGearComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p }) => {
  const origin = `${GEAR.cx}px ${GEAR.cy}px`;
  if (presentationDirection === "exiting") {
    const e = Easing.in(Easing.cubic)(p);
    return (
      <AbsoluteFill style={{ transformOrigin: origin, transform: `scale(${1 + e * 14}) rotate(${e * 50}deg)`, opacity: 1 - clamp((p - 0.75) / 0.25) }}>
        {children}
      </AbsoluteFill>
    );
  }
  const r = interpolate(p, [0.35, 1], [0, 2300], { extrapolateLeft: "clamp", easing: ease.in });
  const rot = p * 180;
  const pts = gearPoints(GEAR.cx, GEAR.cy, Math.max(1, r), 14, rot, 0.12);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: gearClip(pts), transformOrigin: origin, transform: `scale(${lerp(1.5, 1, ease.out(clamp((p - 0.35) / 0.65)))}) rotate(${(1 - p) * -25}deg)` }}>
        <Background />
        {children}
      </AbsoluteFill>
      <NeonGear cx={GEAR.cx} cy={GEAR.cy} r={Math.max(1, r)} rot={rot} teeth={14} opacity={r > 10 && p < 0.95 ? 1 - p * 0.5 : 0} width={10} />
    </AbsoluteFill>
  );
};
export const zoomGear = make(ZoomGearComp);

/* 3a. Coup de scie : l'image se fend en diagonale, les deux moitiés glissent, la suivante apparaît dans la fente. */
const CUT = { x1: W * 0.62, y1: -100, x2: W * 0.38, y2: H + 100 };
const SawComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p }) => {
  const dx = CUT.x2 - CUT.x1;
  const dy = CUT.y2 - CUT.y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = uy; // normale (vers la droite)
  const ny = -ux;
  const s = interpolate(p, [0.18, 1], [0, 1500], { extrapolateLeft: "clamp", easing: Easing.in(Easing.quad) });
  const slide = s * 0.35;
  // Moitiés : polygones de part et d'autre de la ligne de coupe
  const far = 4000;
  const half = (side: 1 | -1) =>
    `polygon(${CUT.x1 - ux * far}px ${CUT.y1 - uy * far}px, ${CUT.x2 + ux * far}px ${CUT.y2 + uy * far}px, ${CUT.x2 + ux * far + side * nx * far}px ${
      CUT.y2 + uy * far + side * ny * far
    }px, ${CUT.x1 - ux * far + side * nx * far}px ${CUT.y1 - uy * far + side * ny * far}px)`;
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill>
        {([1, -1] as const).map((side) => (
          <AbsoluteFill key={side} style={{ clipPath: half(side), transform: `translate(${side * nx * s + side * ux * slide}px, ${side * ny * s + side * uy * slide}px) rotate(${side * p * 4}deg)` }}>
            {children}
          </AbsoluteFill>
        ))}
      </AbsoluteFill>
    );
  }
  const band = `polygon(${CUT.x1 - ux * far + nx * s}px ${CUT.y1 - uy * far + ny * s}px, ${CUT.x2 + ux * far + nx * s}px ${CUT.y2 + uy * far + ny * s}px, ${
    CUT.x2 + ux * far - nx * s
  }px ${CUT.y2 + uy * far - ny * s}px, ${CUT.x1 - ux * far - nx * s}px ${CUT.y1 - uy * far - ny * s}px)`;
  const flash = interpolate(p, [0, 0.15, 0.4], [0, 1, 0], { extrapolateRight: "clamp" });
  const cutDraw = clamp(p / 0.18);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: s > 0.5 ? band : "polygon(0 0, 0 0, 0 0)" }}>
        <Background />
        {children}
      </AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: flash }}>
        <defs>
          <filter id="cutBloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
        </defs>
        <line x1={CUT.x1} y1={CUT.y1} x2={lerp(CUT.x1, CUT.x2, cutDraw)} y2={lerp(CUT.y1, CUT.y2, cutDraw)} stroke={A.light} strokeWidth={26} filter="url(#cutBloom)" />
        <line x1={CUT.x1} y1={CUT.y1} x2={lerp(CUT.x1, CUT.x2, cutDraw)} y2={lerp(CUT.y1, CUT.y2, cutDraw)} stroke="#fff" strokeWidth={6} />
      </svg>
    </AbsoluteFill>
  );
};
export const saw = make(SawComp);

/* 3b. Souffle : un nuage de feuilles balaie l'écran et emporte l'image. */
const BlowComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, presentationDurationInFrames: dur }) => {
  const e = ease.inOut(p);
  const front = lerp(-300, W + 300, e);
  if (presentationDirection === "exiting") {
    const v = Math.abs(ease.inOut(p) - ease.inOut(Math.max(0, p - 1 / dur))) * 1600;
    return (
      <AbsoluteFill style={{ transform: `translateX(${e * 500}px) skewX(${-10 * e}deg)` }}>
        <DirectionalBlur x={clamp(v * 0.5, 0, 20)} y={0}>
          {children}
        </DirectionalBlur>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${Math.max(0, W - front)}px 0 0)` }}>
        <Background />
        {children}
      </AbsoluteFill>
      <LeafLayer
        count={70}
        fn={(i) => {
          const off = (random(`bl${i}`) - 0.3) * 520;
          const y = random(`bly${i}`) * (H + 100) - 50;
          return {
            x: front + off + Math.sin(p * 8 + i) * 30,
            y: y + Math.sin(p * 10 + i * 2) * 40 - off * 0.15,
            size: 26 + random(`bls${i}`) * 34,
            rot: p * 900 * (random(`blr${i}`) - 0.5) + i * 30,
            flip: Math.cos(p * 14 + i),
            opacity: 1,
            color: leafColor(`blc${i}`),
          };
        }}
      />
    </AbsoluteFill>
  );
};
export const blow = make(BlowComp);

/* 3c. Volet circulaire en forme de roue dentée qui tourne. */
const IrisComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === "exiting") {
    return <AbsoluteFill style={{ transform: `scale(${1 - 0.12 * p}) rotate(${-6 * p}deg)` }}>{children}</AbsoluteFill>;
  }
  const r = lerp(0, 1350, Easing.in(Easing.quad)(p));
  const rot = p * 240;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: gearClip(gearPoints(960, 540, Math.max(1, r), 16, rot, 0.14)) }}>
        <Background />
        {children}
      </AbsoluteFill>
      <NeonGear cx={960} cy={540} r={Math.max(1, r)} rot={rot} teeth={16} opacity={p < 0.92 ? 1 : 0} width={10} />
    </AbsoluteFill>
  );
};
export const iris = make(IrisComp);

/* 4. Whip pan horizontal très rapide, avec flou de mouvement directionnel calculé sur la vitesse. */
const WhipComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p, presentationDurationInFrames: dur }) => {
  const fn = Easing.bezier(0.7, 0, 0.3, 1);
  const e = fn(p);
  const v = Math.abs(fn(p) - fn(Math.max(0, p - 1 / dur))) * W;
  const blur = clamp(v * 0.18, 0, 40);
  const x = presentationDirection === "exiting" ? -W * e : W * (1 - e);
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)` }}>
      <DirectionalBlur x={blur} y={0}>
        {children}
      </DirectionalBlur>
    </AbsoluteFill>
  );
};
export const whip = make(WhipComp);

/* 5. Cartes qui tombent : les tuiles tombent dans la scène sortante ; la suivante surgit du bas avec un rebond. */
const CardsComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  const e = Easing.out(Easing.back(1.6))(clamp((p - 0.3) / 0.7));
  return <AbsoluteFill style={{ transform: `translateY(${(1 - e) * H}px)` }}>{children}</AbsoluteFill>;
};
export const cards = make(CardsComp);

/* 6. Morph : la dernière ligne de services devient la carte (animé dans la scène sortante), la carte prend le relais. */
const MorphComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === "exiting") return <AbsoluteFill>{children}</AbsoluteFill>;
  // La carte d'arrivée est exactement à l'emplacement final du morph : simple relais, sans saut visible
  const c = MORPH.card;
  const k = clamp((p - 0.8) / 0.2);
  return (
    <AbsoluteFill style={{ clipPath: `inset(${c.y}px ${W - c.x - c.w}px ${H - c.y - c.h}px ${c.x}px round ${c.r}px)`, opacity: k }}>
      {children}
    </AbsoluteFill>
  );
};
export const morph = make(MorphComp);

/* 7. Pluie de feuilles : elles remplissent l'écran, puis s'écartent depuis le centre pour révéler la scène suivante. */
const LeafRainComp: React.FC<Props> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === "exiting") return <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * p})` }}>{children}</AbsoluteFill>;
  const reveal = interpolate(p, [0.5, 1], [0, 1400], { extrapolateLeft: "clamp", easing: ease.in });
  const cover = interpolate(p, [0.2, 0.5, 0.62, 1], [0, 0.92, 0.92, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(10,30,15,${cover}) 0%, rgba(4,12,6,${cover}) 100%)` }} />
      <AbsoluteFill style={{ clipPath: `circle(${reveal}px at 50% 42%)` }}>
        <Background />
        {children}
      </AbsoluteFill>
      <LeafLayer
        count={150}
        fn={(i) => {
          const tx = random(`lr${i}`) * (W + 200) - 100;
          const ty = random(`lry${i}`) * (H + 200) - 100;
          const delay = random(`lrd${i}`) * 0.25;
          const fall = clamp((p - delay) / 0.3);
          const out = clamp((p - 0.5) / 0.45);
          if (fall <= 0) return null;
          // Chute depuis le haut jusqu'à la position cible…
          let x = tx + Math.sin(fall * 6 + i) * 30 * (1 - fall);
          let y = lerp(-150 - random(`lrh${i}`) * 300, ty, Easing.out(Easing.quad)(fall));
          // …puis éclatement radial depuis le centre
          const ang = Math.atan2(ty - 454, tx - 960);
          const dist = Easing.in(Easing.quad)(out) * 1400;
          x += Math.cos(ang) * dist;
          y += Math.sin(ang) * dist;
          return {
            x,
            y,
            size: 50 + random(`lrs${i}`) * 60,
            rot: random(`lrr${i}`) * 360 + p * 300 * (random(`lrv${i}`) - 0.5),
            flip: Math.cos(p * 10 + i),
            opacity: 1,
            color: leafColor(`lrc${i}`),
          };
        }}
      />
    </AbsoluteFill>
  );
};
export const leafRain = make(LeafRainComp);

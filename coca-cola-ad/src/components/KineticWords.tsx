import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SpringConfig } from "remotion";
import { fontFamily } from "../fonts";
import { CLAMP } from "../lib/motion";

/**
 * Typographie cinétique : le texte est découpé en mots (ou en lettres) qui
 * arrivent un par un avec un spring. Un léger motion blur est simulé en
 * dessinant des « fantômes » aux positions des frames précédentes.
 */

export type KineticMode = "rise" | "slam" | "pop";

const SPRINGS: Record<KineticMode, Partial<SpringConfig>> = {
  rise: { damping: 14, stiffness: 190, mass: 0.7 }, // monte depuis un masque
  slam: { damping: 13, stiffness: 320, mass: 0.8 }, // claque depuis le premier plan
  pop: { damping: 10, stiffness: 220, mass: 0.6 }, // rebondit
};

type Props = {
  text: string;
  /** Frame d'apparition du premier élément. */
  start?: number;
  /** Écart (frames) entre deux éléments. */
  stagger?: number;
  fontSize: number;
  color: string;
  mode?: KineticMode;
  split?: "words" | "letters";
  /** Disposition des mots : en ligne ou empilés. */
  direction?: "row" | "column";
  fontWeight?: number;
  letterSpacing?: string;
  /** Si défini, les éléments ressortent vers le haut à partir de cette frame. */
  exitAt?: number;
  style?: React.CSSProperties;
};

/** Transformation d'un élément pour une progression de spring donnée. */
const transformFor = (mode: KineticMode, s: number, travel: number) => {
  switch (mode) {
    case "rise":
      return `translateY(${(1 - s) * travel}px)`;
    case "slam":
      return `scale(${interpolate(s, [0, 1], [2.8, 1])})`;
    case "pop":
      return `translateY(${(1 - s) * travel * 0.35}px) scale(${Math.max(0, s)}) rotate(${(1 - s) * -10}deg)`;
  }
};

const Unit: React.FC<{
  content: string;
  index: number;
  props: Props;
}> = ({ content, index, props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    start = 0,
    stagger = 5,
    fontSize,
    mode = "rise",
    exitAt,
  } = props;

  const local = frame - start - index * stagger;
  const config = SPRINGS[mode];
  const s = spring({ frame: local, fps, config });
  const sPrev = spring({ frame: local - 1, fps, config });
  const velocity = s - sPrev;
  const travel = fontSize * 1.15;

  // Sortie optionnelle (glisse vers le haut et disparaît).
  const e =
    exitAt === undefined
      ? 0
      : spring({
          frame: frame - exitAt - index * 2,
          fps,
          config: { damping: 200, stiffness: 180 },
        });

  const opacity =
    (mode === "slam" ? interpolate(local, [0, 2], [0, 1], CLAMP) : 1) *
    (local < 0 ? 0 : 1) *
    (1 - e);

  // Fantômes de motion blur : positions « dans le passé » du spring.
  const blurStrength = Math.min(1, Math.abs(velocity) * 9);
  const ghosts =
    blurStrength > 0.04
      ? [1, 2, 3].map((j) => ({
          s: s - velocity * j * 0.55,
          opacity: (0.32 / j) * blurStrength,
        }))
      : [];

  const exitTransform = `translateY(${-e * travel}px)`;
  const base: React.CSSProperties = {
    gridArea: "1 / 1",
    whiteSpace: "pre",
    willChange: "transform",
  };

  return (
    <span
      style={{
        display: "inline-grid",
        // Masque pour l'effet « rise » : le mot monte depuis une fente invisible.
        overflow: mode === "rise" ? "hidden" : "visible",
        padding: "0.12em 0.03em",
        margin: "-0.12em -0.03em",
        opacity,
      }}
    >
      {ghosts.map((g, j) => (
        <span
          key={j}
          aria-hidden
          style={{
            ...base,
            opacity: g.opacity,
            transform: `${exitTransform} ${transformFor(mode, g.s, travel)}`,
          }}
        >
          {content}
        </span>
      ))}
      <span
        style={{
          ...base,
          transform: `${exitTransform} ${transformFor(mode, s, travel)}`,
          filter: mode === "slam" ? `blur(${Math.min(10, Math.abs(velocity) * 40)}px)` : undefined,
        }}
      >
        {content}
      </span>
    </span>
  );
};

export const KineticWords: React.FC<Props> = (props) => {
  const {
    text,
    fontSize,
    color,
    split = "words",
    direction = "row",
    fontWeight = 900,
    letterSpacing = "-0.045em",
    style,
  } = props;

  const units = split === "letters" ? Array.from(text) : text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        flexWrap: direction === "row" ? "wrap" : "nowrap",
        justifyContent: "center",
        alignItems: "center",
        columnGap: split === "letters" ? 0 : fontSize * 0.24,
        fontFamily,
        fontWeight,
        fontSize,
        lineHeight: 1,
        letterSpacing,
        color,
        ...style,
      }}
    >
      {units.map((u, i) => (
        <Unit key={i} content={u} index={i} props={props} />
      ))}
    </div>
  );
};

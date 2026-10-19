import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticWords } from "../components/KineticWords";
import { COLORS, TENSION, sceneFrames } from "../config";
import { fontFamily } from "../fonts";
import { CLAMP, shake } from "../lib/motion";

/**
 * Scène 2 — Tension (3–7 s)
 * Trois mots plein écran, chacun sur un aplat de couleur qui glisse
 * par-dessus le précédent. Le panneau recouvert recule (parallaxe).
 */

type Direction = (typeof TENSION.words)[number]["from"];

const offsetFor = (dir: Direction, amount: number) => {
  switch (dir) {
    case "right":
      return `translateX(${amount * 100}%)`;
    case "left":
      return `translateX(${-amount * 100}%)`;
    case "bottom":
      return `translateY(${amount * 100}%)`;
  }
};

export const Tension: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const per = sceneFrames("tension") / TENSION.words.length;

  // Progression d'entrée de chaque panneau (le premier est déjà en place,
  // il arrive avec la transition de la scène précédente).
  const enter = TENSION.words.map((_, i) =>
    i === 0
      ? 1
      : spring({ frame: frame - i * per, fps, config: { damping: 200, stiffness: 170 }, durationInFrames: 13 }),
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: COLORS.black }}>
      {TENSION.words.map((w, i) => {
        const start = i * per;
        const local = frame - start;
        const covered = enter[i + 1] ?? 0; // recouvert par le panneau suivant
        const fontSize = Math.min(300, 940 / (w.text.length * 0.55));

        // Personnalité de chaque mot.
        let wordStyle: React.CSSProperties = {};
        if (w.text.startsWith("Fatigue")) {
          // s'affaisse lentement
          wordStyle = { transform: `translateY(${interpolate(local, [12, per], [0, 40], CLAMP)}px) rotate(${interpolate(local, [12, per], [0, -3], CLAMP)}deg)` };
        } else if (w.text.startsWith("Chaleur")) {
          // ondule comme une brume de chaleur
          wordStyle = { transform: `skewX(${Math.sin(local * 0.35) * 4}deg) scaleY(${1 + Math.sin(local * 0.5) * 0.02})` };
        } else {
          // tremble d'agacement
          const s = shake(frame, start + 14, 8, 10);
          wordStyle = { transform: `translate(${s.x}px, ${s.y}px)` };
        }

        return (
          <AbsoluteFill
            key={w.text}
            style={{
              backgroundColor: w.bg,
              transform: offsetFor(w.from, 1 - enter[i]),
              display: local < -20 ? "none" : "flex",
            }}
          >
            {/* Le contenu recule quand le panneau suivant arrive : effet de profondeur */}
            <AbsoluteFill
              style={{
                justifyContent: "center",
                alignItems: "center",
                transform: `scale(${1 - covered * 0.12}) translateY(${-covered * 80}px)`,
                opacity: 1 - covered * 0.5,
              }}
            >
              <div style={wordStyle}>
                <KineticWords
                  text={w.text}
                  split="letters"
                  start={start + (i === 0 ? 4 : 7)}
                  stagger={2}
                  mode="rise"
                  fontSize={fontSize}
                  color={w.fg}
                />
              </div>

              {/* Micro-détail façon lancement tech : compteur + barre de progression */}
              <div
                style={{
                  position: "absolute",
                  bottom: 220,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                  fontFamily,
                  fontWeight: 800,
                  fontSize: 30,
                  letterSpacing: "0.3em",
                  color: w.fg,
                  opacity: 0.6,
                }}
              >
                <div>{`0${i + 1} / 0${TENSION.words.length}`}</div>
                <div style={{ width: 260, height: 4, background: `${w.fg}33`, borderRadius: 2 }}>
                  <div
                    style={{
                      width: `${interpolate(local, [0, per], [0, 100], CLAMP)}%`,
                      height: "100%",
                      background: w.fg,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

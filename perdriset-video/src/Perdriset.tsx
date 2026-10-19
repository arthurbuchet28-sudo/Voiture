import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Background, Grain } from "./components/Background";
import { Camera, SceneDef, SceneTimeline } from "./lib/timeline";
import { CONFIG, sec } from "./config";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Logo } from "./scenes/Scene2Logo";
import { Scene3Universes } from "./scenes/Scene3Universes";
import { Scene4Brands } from "./scenes/Scene4Brands";
import { Scene5Services } from "./scenes/Scene5Services";
import { Scene6Trust } from "./scenes/Scene6Trust";
import { Scene7Outro } from "./scenes/Scene7Outro";

const D = CONFIG.durations;

/** Ordre des scènes et style des fondus enchaînés (mêmes transitions que Promptly). */
const SCENES: SceneDef[] = [
  { key: "hook", Component: Scene1Hook, duration: sec(D.hook), enter: "none", exit: "blur" },
  { key: "logo", Component: Scene2Logo, duration: sec(D.logo), enter: "blur", exit: "blur" },
  { key: "universes", Component: Scene3Universes, duration: sec(D.universes), enter: "blur", exit: "dissolve" },
  { key: "brands", Component: Scene4Brands, duration: sec(D.brands), enter: "dissolve", exit: "blur" },
  { key: "services", Component: Scene5Services, duration: sec(D.services), enter: "blur", exit: "blur" },
  { key: "trust", Component: Scene6Trust, duration: sec(D.trust), enter: "blur", exit: "dissolve" },
  { key: "outro", Component: Scene7Outro, duration: sec(D.outro), enter: "dissolve", exit: "none" },
];

const PAD = Math.round(sec(CONFIG.transition) / 2);

export const Perdriset: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CONFIG.background.edge }}>
    <Background center={CONFIG.background.center} edge={CONFIG.background.edge} color={CONFIG.accent} />
    <Camera>
      <SceneTimeline scenes={SCENES} pad={PAD} />
    </Camera>
    <Grain />
    {/* Musique originale (scripts/musique.py), calée sur les changements de scène */}
    <Audio src={staticFile("musique.wav")} />
  </AbsoluteFill>
);

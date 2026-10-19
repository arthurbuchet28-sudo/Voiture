import React, { createContext, useContext } from "react";

export type SceneInfo = {
  /** Frame locale de la scène (0 = début officiel, négatif pendant le fondu d'entrée). */
  frame: number;
  /** Durée officielle de la scène, en frames. */
  duration: number;
  /** Frame absolue de la vidéo (pour les mouvements continus). */
  absFrame: number;
  fps: number;
};

const SceneContext = createContext<SceneInfo | null>(null);

export const SceneProvider: React.FC<{ value: SceneInfo; children: React.ReactNode }> = ({
  value,
  children,
}) => <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;

export const useScene = (): SceneInfo => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene doit être utilisé dans une scène");
  return ctx;
};

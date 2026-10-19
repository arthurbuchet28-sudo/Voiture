/**
 * Configuration centrale de la pub.
 *
 * Toutes les durées sont ici : modifiez SCENE_SECONDS pour allonger ou
 * raccourcir une scène, TRANSITION_FRAMES pour la vitesse des transitions.
 * La durée totale de la composition est recalculée automatiquement.
 *
 * Fonctionnement des transitions : chaque scène démarre exactement à son
 * horodatage du storyboard. La scène précédente est prolongée de la durée de
 * la transition, qui se joue donc pendant les premières frames de la scène
 * suivante. Total = somme des SCENE_SECONDS (22 s = 660 frames).
 */

export const VIDEO = {
  id: "CocaColaAd",
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/** Palette : rouge, blanc, noir profond, reflets argentés. */
export const COLORS = {
  red: "#E4002B",
  redDark: "#A3001E",
  redDeep: "#5C0012",
  white: "#FFFFFF",
  black: "#070707",
  charcoal: "#151515",
  silver: "#C9CDD2",
  silverLight: "#EEF1F4",
  silverDark: "#7D838A",
} as const;

/** Durée de chaque scène, en secondes (ordre du storyboard). */
export const SCENE_SECONDS = {
  hook: 3, // 0–3 s    Accroche
  tension: 4, // 3–7 s    Tension
  reveal: 4, // 7–11 s   Révélation
  emotion: 5, // 11–16 s  Émotion
  climax: 4, // 16–20 s  Climax
  packshot: 2, // 20–22 s  Packshot
} as const;

export type SceneName = keyof typeof SCENE_SECONDS;

export const SCENE_ORDER: SceneName[] = [
  "hook",
  "tension",
  "reveal",
  "emotion",
  "climax",
  "packshot",
];

/** Durée (frames) de la transition qui SORT de chaque scène. */
export const TRANSITION_FRAMES: Record<SceneName, number> = {
  hook: 10, // wipe
  tension: 14, // masque circulaire (iris)
  reveal: 12, // slide vers le haut
  emotion: 12, // zoom
  climax: 8, // fondu depuis le flash blanc
  packshot: 0, // dernière scène
};

export const sec = (seconds: number) => Math.round(seconds * VIDEO.fps);

/** Durée « storyboard » d'une scène, en frames. */
export const sceneFrames = (name: SceneName) => sec(SCENE_SECONDS[name]);

/** Durée réelle de la <TransitionSeries.Sequence> (scène + transition sortante). */
export const sequenceFrames = (name: SceneName) =>
  sceneFrames(name) + TRANSITION_FRAMES[name];

/** Frame globale de début d'une scène (utile pour caler l'audio). */
export const sceneStart = (name: SceneName) => {
  let start = 0;
  for (const s of SCENE_ORDER) {
    if (s === name) return start;
    start += sceneFrames(s);
  }
  return start;
};

export const TOTAL_FRAMES = SCENE_ORDER.reduce(
  (sum, s) => sum + sceneFrames(s),
  0,
);

/** Tempo des formes « musique / fête » : 120 BPM = un temps toutes les 15 frames. */
export const BEAT_FRAMES = 15;

// ---------------------------------------------------------------------------
// Timings internes (en frames, relatifs au début de chaque scène)
// ---------------------------------------------------------------------------

export const HOOK = {
  burstAt: 2, // l'onde « pschhh » démarre
  pschhOut: 24, // le mot « pschhh » s'efface
  words: ["Chaud", "dehors ?"], // espace insécable avant le « ? »
  firstWordAt: 30, // premier mot qui claque
  wordStagger: 13, // écart entre deux mots
};

export const TENSION = {
  // Un mot plein écran par tiers de scène, chacun sur son aplat.
  words: [
    { text: "Fatigue.", bg: COLORS.charcoal, fg: COLORS.white, from: "right" },
    { text: "Chaleur.", bg: COLORS.red, fg: COLORS.white, from: "bottom" },
    { text: "Lundi.", bg: COLORS.white, fg: COLORS.black, from: "left" },
  ] as const,
};

export const REVEAL = {
  spinFrames: 95, // durée de la rotation de la canette avant stabilisation
  turns: 1.5, // nombre de tours
  zoomTo: 1.14, // zoom lent sur toute la scène
  shineAt: 62, // reflet lumineux qui balaie la canette
};

export const EMOTION = {
  phrases: [
    { text: "Un moment.", bg: COLORS.black, fg: COLORS.white },
    { text: "À partager.", bg: COLORS.red, fg: COLORS.white },
    { text: "Ensemble.", bg: COLORS.white, fg: COLORS.black },
  ] as const,
  textDelay: 5, // délai avant le premier mot de chaque phrase
};

export const CLIMAX = {
  tabAt: 24, // l'anneau commence à se soulever
  openAt: 34, // ouverture : explosion de bulles + flash
  whiteoutFrames: 18, // montée au blanc à la fin de la scène
};

export const PACKSHOT = {
  brand: "Coca-Cola",
  slogan: ["Ouvre", "du", "bonheur."],
  settleFrames: 42, // tout est figé après cette frame
  showDisclaimer: true, // petite mention « exercice non officiel »
};

/** Audio optionnel : fichiers à déposer dans public/. Ignorés s'ils sont absents. */
export const AUDIO = {
  enabled: true,
  music: "music.mp3",
  sfxOpen: "sfx-open.mp3",
  musicVolume: 0.7,
  sfxVolume: 1,
  musicFadeOutFrames: 20,
};

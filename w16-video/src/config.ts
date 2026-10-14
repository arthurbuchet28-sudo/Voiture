/**
 * Tous les réglages modifiables de la vidéo : format, couleurs, durées, textes et chiffres.
 * Les durées sont en secondes. La durée totale de la vidéo est calculée automatiquement.
 */

import TIMINGS from "./voix-off-timings.json";

// ─── Format ──────────────────────────────────────────────────────────────────
export const VIDEO = {
  id: "W16Explication",
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

// ─── Couleurs ────────────────────────────────────────────────────────────────
export const COLORS = {
  fond: "#0b0d10",
  fondClair: "#161a20",
  panneau: "rgba(22, 27, 34, 0.86)",
  bordure: "rgba(201, 206, 214, 0.18)",
  texte: "#eef1f5",
  texteDoux: "#a7afba",
  bleu: "#2f6bff",
  bleuProfond: "#1a3f9e",
  bleuClair: "#7fb0ff",
  argent: "#c9ced6",
  argentFonce: "#7d8591",
  froid: "#5cc0ff",
  chaud: "#ff8a2a",
  brulant: "#ff4a2a",
} as const;

// ─── Polices (fichiers dans public/fonts/, chargés par src/fonts.ts) ─────────
export const FONTS = {
  titre: "Montserrat",
  texte: "Inter",
} as const;

// ─── Voix off et durées des scènes ──────────────────────────────────────────
// Le texte de la voix off est dans src/voix-off.json. Après modification, régénérez l'audio :
//   python3 voix-off/generer.py
// Cela produit public/voix/<scène>.wav et src/voix-off-timings.json (durée et horaire de
// chaque phrase). Les durées des scènes en découlent automatiquement :
//   durée = VOIX_DEBUT + durée de la voix + MARGE_FIN
// Les fondus entre scènes ne raccourcissent pas la vidéo : chaque scène est prolongée de la
// durée du fondu (voir W16Video.tsx), qui commence donc après la marge de fin.

/** Délai entre le début d'une scène et le début de sa voix off, en secondes. */
export const VOIX_DEBUT = 0.4;

/** Silence après la dernière phrase d'une scène, avant le fondu, en secondes. */
export const MARGE_FIN: Record<CleScene, number> = {
  intro: 0.5,
  pourquoiW: 0.5,
  compacite: 0.5,
  quatreTemps: 0.5,
  turbos: 0.5,
  refroidissement: 0.5,
  chiffres: 0.5,
  conclusion: 1.3, // laisse le temps au fondu au noir final
};

export type CleScene = keyof typeof TIMINGS;

const versImage = (s: number) => Math.ceil(s * VIDEO.fps) / VIDEO.fps;

/** Durée de chaque scène en secondes (calculée depuis la voix off). */
export const DUREES = Object.fromEntries(
  (Object.keys(TIMINGS) as CleScene[]).map((cle) => [
    cle,
    versImage(VOIX_DEBUT + TIMINGS[cle].duree + MARGE_FIN[cle]),
  ]),
) as Record<CleScene, number>;

/** Début et fin de chaque phrase de la voix off, en secondes depuis le début de la scène. */
export const reperes = (cle: CleScene) =>
  TIMINGS[cle].segments.map((s) => ({ debut: VOIX_DEBUT + s.debut, fin: VOIX_DEBUT + s.fin }));

/** Durée du fondu entre deux scènes, en secondes. */
export const TRANSITION_S = 0.5;

/** Durée d'apparition/disparition d'un sous-titre, en images. */
export const FONDU_SOUS_TITRE = 8;

// ─── Audio ───────────────────────────────────────────────────────────────────
// La voix off est ajoutée automatiquement (public/voix/). Musique de fond facultative :
// déposez un fichier dans public/ puis indiquez son nom, par exemple musique: "musique.mp3".
// Le volume reste bas pour ne pas couvrir la voix.
export const AUDIO: { voixOff: boolean; volumeVoix: number; musique: string | null; volumeMusique: number } = {
  voixOff: true,
  volumeVoix: 1,
  musique: null,
  volumeMusique: 0.08,
};

// ─── Textes ──────────────────────────────────────────────────────────────────
// Sous-titres : `phrase` = numéro (à partir de 0) de la phrase de voix off (src/voix-off.json)
// sur laquelle le sous-titre apparaît. Il reste affiché jusqu'au sous-titre suivant, ou jusqu'à
// la fin de la scène. Chaque entrée de `lignes` est une ligne à l'écran (12 mots maximum).
// Un contrôle au démarrage vérifie que chaque sous-titre reste au moins 3 s à l'écran.
export type SousTitre = { phrase: number; lignes: string[] };

export const TEXTES = {
  intro: {
    titre: ["Le moteur W16 :", "16 cylindres, une architecture unique"],
    sousTitre: "Comment fonctionne le cœur des hypercars Bugatti ?",
  },
  pourquoiW: {
    titre: "Pourquoi un « W » ?",
    etapes: ["Moteur en V : 2 rangées", "VR8 : 2 rangées à 15°", "W16 : 2 VR8 à 90°"],
    vueDessus: "Vue de dessus",
    vueDessusDetail: "4 rangées × 4 cylindres",
    sousTitres: [
      { phrase: 0, lignes: ["Un moteur en V classique : deux rangées de cylindres."] },
      { phrase: 1, lignes: ["Rapprochées à seulement 15°, deux rangées forment un VR8."] },
      { phrase: 2, lignes: ["Deux VR8 assemblés en V à 90° forment le « W »."] },
      { phrase: 3, lignes: ["4 rangées de 4 cylindres = 16 cylindres."] },
    ] as SousTitre[],
  },
  compacite: {
    titre: "Compacité",
    blocs: [
      { nom: "V16", detail: "16 cylindres, 2 rangées" },
      { nom: "V12", detail: "12 cylindres, 2 rangées" },
      { nom: "W16", detail: "16 cylindres, 4 rangées" },
    ],
    repereV12: "longueur d'un V12",
    message: "Autant de cylindres qu'un V16, dans un encombrement proche d'un V12",
    sousTitres: [
      { phrase: 0, lignes: ["Un V16 aligne 8 cylindres par rangée : il est très long."] },
      { phrase: 1, lignes: ["Le W16 est plus large, mais bien plus court qu'un V16."] },
    ] as SousTitre[],
  },
  quatreTemps: {
    titre: "Le cycle à 4 temps",
    phases: ["Admission", "Compression", "Combustion", "Échappement"],
    etiquettes: {
      piston: "Piston",
      bielle: "Bielle",
      vilebrequin: "Vilebrequin",
      soupapeAdm: "Soupape d'admission",
      soupapeEch: "Soupape d'échappement",
      bougie: "Bougie",
    },
    soupapes: ["4 soupapes par cylindre", "× 16 cylindres = 64 soupapes"],
    sousTitres: [
      { phrase: 1, lignes: ["Admission : le piston descend et aspire l'air et l'essence."] },
      { phrase: 2, lignes: ["Compression : le piston remonte et comprime le mélange."] },
      { phrase: 3, lignes: ["Combustion : l'étincelle enflamme le mélange, le piston est repoussé."] },
      { phrase: 4, lignes: ["Échappement : le piston remonte et chasse les gaz brûlés."] },
      { phrase: 5, lignes: ["4 soupapes par cylindre : 64 soupapes au total."] },
    ] as SousTitre[],
  },
  turbos: {
    titre: "Quatre turbocompresseurs",
    etiquettes: {
      airFrais: "Air frais",
      compresseur: "Compresseurs",
      turbine: "Turbines",
      arbre: "même arbre",
      refroidisseurs: "Refroidisseurs",
      cylindres: "16 cylindres",
      echappement: "Gaz d'échappement",
      sortie: "Sortie",
      nombre: "× 4 turbos",
    },
    sequentiel: {
      titre: "Chiron : fonctionnement séquentiel",
      regime: "Régime moteur",
      seuil: 3800,
      seuilTexte: "≈ 3 800 tr/min",
      deux: "2 turbos actifs",
      quatre: "4 turbos actifs",
    },
    sousTitres: [
      { phrase: 1, lignes: ["L'air frais est aspiré puis comprimé par les turbocompresseurs."] },
      { phrase: 2, lignes: ["Refroidi, l'air plus dense entre dans les cylindres."] },
      {
        phrase: 3,
        lignes: ["Les gaz d'échappement font tourner les turbines,", "qui entraînent les compresseurs."],
      },
      {
        phrase: 4,
        lignes: ["Sur la Chiron : 2 turbos à bas régime,", "puis les 4 au-delà d'environ 3 800 tr/min."],
      },
    ] as SousTitre[],
  },
  refroidissement: {
    titre: "Refroidissement",
    moteur: "Moteur W16",
    compteur: "radiateurs",
    sousTitres: [
      { phrase: 0, lignes: ["Autant de puissance produit énormément de chaleur."] },
      {
        phrase: 1,
        lignes: ["Une dizaine de radiateurs refroidissent le moteur, l'huile,", "la boîte et l'air de suralimentation."],
      },
    ] as SousTitre[],
  },
  chiffres: {
    titre: "Chiffres clés",
    puissance: "Puissance",
  },
  conclusion: {
    lignes: ["Le W16 : un chef-d'œuvre d'ingénierie,", "remplacé en 2024 par le V16 hybride de la Tourbillon."],
  },
} as const;

// ─── Chiffres clés (scène 7) ─────────────────────────────────────────────────
export const CHIFFRES = {
  fiche: [
    { label: "Cylindrée", valeur: 8.0, decimales: 1, unite: "litres" },
    { label: "Cylindres", valeur: 16, decimales: 0, unite: "" },
    { label: "Soupapes", valeur: 64, decimales: 0, unite: "" },
    { label: "Turbos", valeur: 4, decimales: 0, unite: "" },
  ],
  puissances: [
    { modele: "Veyron (2005)", ch: 1001 },
    { modele: "Chiron (2016)", ch: 1500 },
    { modele: "Chiron Super Sport 300+ / Mistral", ch: 1600 },
  ],
} as const;

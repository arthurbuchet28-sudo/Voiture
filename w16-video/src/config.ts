/**
 * Tous les réglages modifiables de la vidéo : format, couleurs, durées, textes et chiffres.
 * Les durées sont en secondes. La durée totale de la vidéo est calculée automatiquement.
 */

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

// ─── Durées des scènes (secondes) ───────────────────────────────────────────
// La somme donne la durée totale (75 s). Les fondus entre scènes ne raccourcissent pas
// la vidéo : chaque scène est prolongée de la durée du fondu (voir W16Video.tsx).
export const DUREES = {
  intro: 8,
  pourquoiW: 12,
  compacite: 10,
  quatreTemps: 12,
  turbos: 14,
  refroidissement: 8,
  chiffres: 7,
  conclusion: 4,
} as const;

/** Durée du fondu entre deux scènes, en secondes. */
export const TRANSITION_S = 0.5;

/** Durée d'apparition/disparition d'un sous-titre, en images. */
export const FONDU_SOUS_TITRE = 8;

// ─── Audio ───────────────────────────────────────────────────────────────────
// Piste prévue mais vide. Déposez vos fichiers dans public/ puis indiquez leur nom ici,
// par exemple musique: "musique.mp3". null = pas de son.
export const AUDIO: { musique: string | null; voixOff: string | null; volumeMusique: number } = {
  musique: null,
  voixOff: null,
  volumeMusique: 0.35,
};

// ─── Textes ──────────────────────────────────────────────────────────────────
// Sous-titres : `de` et `a` en secondes depuis le début de la scène (au moins 3 s d'affichage).
// Gardez `a` ≤ durée de la scène pour éviter qu'il chevauche le sous-titre suivant pendant le fondu.
// Chaque entrée de `lignes` est une ligne à l'écran (12 mots maximum).
export type SousTitre = { de: number; a: number; lignes: string[] };

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
      { de: 0, a: 4, lignes: ["Un moteur en V classique : deux rangées de cylindres."] },
      {
        de: 4,
        a: 8,
        lignes: ["Rapprochées à seulement 15°, deux rangées forment un VR8."],
      },
      {
        de: 8,
        a: 12,
        lignes: ["Deux VR8 assemblés en V à 90° forment le « W ».", "4 rangées de 4 cylindres = 16 cylindres."],
      },
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
      { de: 0, a: 5, lignes: ["Un V16 aligne 8 cylindres par rangée : il est très long."] },
      {
        de: 5,
        a: 10,
        lignes: ["Le W16 est plus large, mais bien plus court qu'un V16."],
      },
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
      { de: 0, a: 3, lignes: ["Admission : le piston descend et aspire l'air et l'essence."] },
      { de: 3, a: 6, lignes: ["Compression : le piston remonte et comprime le mélange."] },
      { de: 6, a: 9, lignes: ["Combustion : l'étincelle enflamme le mélange, le piston est repoussé."] },
      { de: 9, a: 12, lignes: ["Échappement : le piston remonte et chasse les gaz brûlés."] },
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
      { de: 0, a: 3.5, lignes: ["L'air frais est aspiré puis comprimé par les turbocompresseurs."] },
      { de: 3.5, a: 7, lignes: ["Refroidi, l'air plus dense entre dans les cylindres."] },
      {
        de: 7,
        a: 10.5,
        lignes: ["Les gaz d'échappement font tourner les turbines,", "qui entraînent les compresseurs."],
      },
      {
        de: 10.5,
        a: 14,
        lignes: ["Sur la Chiron : 2 turbos à bas régime,", "puis les 4 au-delà d'environ 3 800 tr/min."],
      },
    ] as SousTitre[],
  },
  refroidissement: {
    titre: "Refroidissement",
    moteur: "Moteur W16",
    compteur: "radiateurs",
    sousTitres: [
      { de: 0, a: 4, lignes: ["Autant de puissance produit énormément de chaleur."] },
      {
        de: 4,
        a: 8,
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

// Schéma de données partagé entre les scripts de collecte et l'application.

export type Carrosserie =
  | "citadine"
  | "berline"
  | "break"
  | "SUV"
  | "monospace"
  | "coupé"
  | "cabriolet"
  | "pick-up"
  | "utilitaire";

export type Segment = "A" | "B" | "C" | "D" | "E" | "F";

export type Energie =
  | "essence"
  | "diesel"
  | "hybride"
  | "hybride rechargeable"
  | "électrique"
  | "GPL"
  | "E85";

export interface Marque {
  id: string;
  nom: string;
  pays: string;
  logoUrl: string | null;
}

export interface Photo {
  url: string;
  auteur: string;
  licence: string;
  /** Page de description sur Wikimedia Commons (lien du crédit). */
  page?: string;
}

export interface Version {
  nom: string;
  energie: Energie;
  puissanceCh: number | null;
  boite: "manuelle" | "automatique";
  transmission: "traction" | "propulsion" | "intégrale" | null;
  prixNeufEuros: number | null;
  consommation: number | null; // L/100 km ou kWh/100 km selon l'énergie
  co2: number | null; // g/km
  autonomieKm: number | null;
  places: number | null;
  portes: number | null;
  coffreLitres: number | null;
  zeroCentSecondes: number | null;
  vitesseMaxKmh: number | null;
  poidsKg: number | null;
  critAir: string | null;
}

export interface Modele {
  id: string;
  marqueId: string;
  nom: string;
  anneeDebut: number | null;
  anneeFin: number | null; // null = encore produit
  carrosserie: Carrosserie;
  segment: Segment | null;
  photos: Photo[];
  couleursDisponibles: string[];
  versions: Version[];
  source: string;
  dateMiseAJour: string;
}

export const CARROSSERIES: Carrosserie[] = [
  "citadine",
  "SUV",
  "berline",
  "break",
  "coupé",
  "cabriolet",
  "monospace",
  "pick-up",
  "utilitaire",
];

export const ENERGIES: Energie[] = [
  "essence",
  "diesel",
  "hybride",
  "hybride rechargeable",
  "électrique",
  "GPL",
  "E85",
];

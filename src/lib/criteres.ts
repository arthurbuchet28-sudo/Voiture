// Critères de recherche, valeurs par défaut, profils rapides et (dé)sérialisation dans l'URL.
import type { Carrosserie, Energie } from "../types";
import { CARROSSERIES, ENERGIES } from "../types";

export interface Criteres {
  budgetMin: number | null;
  budgetMax: number | null;
  marques: string[];
  carrosseries: Carrosserie[];
  energies: Energie[];
  puissanceMin: number | null;
  puissanceMax: number | null;
  zeroCentMax: number | null;
  boite: "manuelle" | "automatique" | null;
  transmission: "traction" | "propulsion" | "intégrale" | null;
  placesMin: number | null;
  coffreMin: number | null;
  consoMax: number | null; // L/100 km (thermiques et hybrides)
  consoElecMax: number | null; // kWh/100 km (électriques)
  autonomieMin: number | null;
  critAirMax: number | null; // 0 à 3
  couleurs: string[];
  neuveUniquement: boolean;
  anneeMin: number | null;
  anneeMax: number | null;
  inclureIncompletes: boolean;
}

export type Tri = "score" | "prix-asc" | "prix-desc" | "puissance" | "conso";

export const ANNEE_COURANTE = new Date().getFullYear();
export const ANNEE_MIN = 1950;
export const BUDGET_MIN = 5000;
export const BUDGET_MAX = 300000;
export const PUISSANCE_MIN = 50;
export const PUISSANCE_MAX = 1000;

export const CRITERES_VIDES: Criteres = {
  budgetMin: null,
  budgetMax: null,
  marques: [],
  carrosseries: [],
  energies: [],
  puissanceMin: null,
  puissanceMax: null,
  zeroCentMax: null,
  boite: null,
  transmission: null,
  placesMin: null,
  coffreMin: null,
  consoMax: null,
  consoElecMax: null,
  autonomieMin: null,
  critAirMax: null,
  couleurs: [],
  neuveUniquement: true,
  anneeMin: null,
  anneeMax: null,
  inclureIncompletes: false,
};

export const COULEURS: { nom: string; hex: string }[] = [
  { nom: "Blanc", hex: "#f8f8f6" },
  { nom: "Noir", hex: "#16181c" },
  { nom: "Gris", hex: "#7c838d" },
  { nom: "Argent", hex: "#c4c9d0" },
  { nom: "Rouge", hex: "#c8261d" },
  { nom: "Bleu", hex: "#1f4fa8" },
  { nom: "Vert", hex: "#2f7a4b" },
  { nom: "Jaune", hex: "#f2c230" },
  { nom: "Orange", hex: "#f07f1d" },
  { nom: "Beige", hex: "#d9c7a5" },
  { nom: "Marron", hex: "#6b4a2f" },
  { nom: "Violet", hex: "#6c3d9a" },
  { nom: "Rose", hex: "#e48bb0" },
];

export interface Profil {
  id: string;
  nom: string;
  description: string;
  icone: string;
  criteres: Partial<Criteres>;
}

export const PROFILS: Profil[] = [
  {
    id: "jeune",
    nom: "Premier véhicule",
    description: "Jeune conducteur : petite, abordable, puissance raisonnable",
    icone: "🔰",
    criteres: { budgetMax: 22000, puissanceMax: 110, carrosseries: ["citadine"], energies: ["essence", "hybride", "GPL", "électrique"] },
  },
  {
    id: "famille",
    nom: "Famille",
    description: "5 places et plus, grand coffre, polyvalente",
    icone: "👨‍👩‍👧‍👦",
    criteres: { budgetMax: 45000, placesMin: 5, coffreMin: 500, carrosseries: ["SUV", "monospace", "break"] },
  },
  {
    id: "sportive",
    nom: "Sportive",
    description: "Plus de 250 ch et moins de 6 s de 0 à 100 km/h",
    icone: "🏁",
    criteres: { puissanceMin: 250, zeroCentMax: 6, carrosseries: ["coupé", "cabriolet", "berline"] },
  },
  {
    id: "budget",
    nom: "Petit budget",
    description: "Moins de 18 000 € neuve",
    icone: "💶",
    criteres: { budgetMax: 18000 },
  },
  {
    id: "electrique",
    nom: "100 % électrique",
    description: "Zéro émission, au moins 300 km d'autonomie",
    icone: "⚡",
    criteres: { energies: ["électrique"], autonomieMin: 300 },
  },
  {
    id: "rouleur",
    nom: "Gros rouleur",
    description: "Sobre, confortable, boîte automatique",
    icone: "🛣️",
    criteres: { energies: ["diesel", "hybride", "hybride rechargeable"], consoMax: 5.5, boite: "automatique", coffreMin: 400 },
  },
  {
    id: "ville",
    nom: "Citadin écolo",
    description: "Crit'Air 0 ou 1, compacte, hybride ou électrique",
    icone: "🌿",
    criteres: { critAirMax: 1, carrosseries: ["citadine"], energies: ["hybride", "électrique"] },
  },
];

export function appliquerProfil(p: Profil): Criteres {
  return { ...CRITERES_VIDES, ...p.criteres };
}

// ---------- URL ----------

const nombre = (v: string | null) => {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const plage = (v: string | null): [number | null, number | null] => {
  if (!v) return [null, null];
  const [a, b] = v.split("-");
  return [nombre(a), nombre(b)];
};
const liste = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const fmtPlage = (a: number | null, b: number | null) => (a === null && b === null ? null : `${a ?? ""}-${b ?? ""}`);

export function criteresVersParams(c: Criteres, tri?: Tri): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: string | number | null | undefined) => {
    if (v !== null && v !== undefined && v !== "") p.set(k, String(v));
  };
  set("budget", fmtPlage(c.budgetMin, c.budgetMax));
  set("marques", c.marques.join(","));
  set("carrosseries", c.carrosseries.join(","));
  set("energies", c.energies.join(","));
  set("ch", fmtPlage(c.puissanceMin, c.puissanceMax));
  set("0a100", c.zeroCentMax);
  set("boite", c.boite);
  set("transmission", c.transmission);
  set("places", c.placesMin);
  set("coffre", c.coffreMin);
  set("conso", c.consoMax);
  set("kwh", c.consoElecMax);
  set("autonomie", c.autonomieMin);
  set("critair", c.critAirMax);
  set("couleurs", c.couleurs.join(","));
  if (!c.neuveUniquement) set("annees", fmtPlage(c.anneeMin, c.anneeMax) ?? "-");
  if (c.inclureIncompletes) set("incompletes", 1);
  if (tri && tri !== "score") set("tri", tri);
  return p;
}

export function paramsVersCriteres(p: URLSearchParams): { criteres: Criteres; tri: Tri } {
  const [budgetMin, budgetMax] = plage(p.get("budget"));
  const [puissanceMin, puissanceMax] = plage(p.get("ch"));
  const [anneeMin, anneeMax] = plage(p.get("annees"));
  const boite = p.get("boite");
  const transmission = p.get("transmission");
  const tri = p.get("tri") as Tri | null;
  return {
    criteres: {
      budgetMin,
      budgetMax,
      marques: liste(p.get("marques")),
      carrosseries: liste(p.get("carrosseries")).filter((x): x is Carrosserie => CARROSSERIES.includes(x as Carrosserie)),
      energies: liste(p.get("energies")).filter((x): x is Energie => ENERGIES.includes(x as Energie)),
      puissanceMin,
      puissanceMax,
      zeroCentMax: nombre(p.get("0a100")),
      boite: boite === "manuelle" || boite === "automatique" ? boite : null,
      transmission: transmission === "traction" || transmission === "propulsion" || transmission === "intégrale" ? transmission : null,
      placesMin: nombre(p.get("places")),
      coffreMin: nombre(p.get("coffre")),
      consoMax: nombre(p.get("conso")),
      consoElecMax: nombre(p.get("kwh")),
      autonomieMin: nombre(p.get("autonomie")),
      critAirMax: nombre(p.get("critair")),
      couleurs: liste(p.get("couleurs")),
      neuveUniquement: !p.has("annees"),
      anneeMin,
      anneeMax,
      inclureIncompletes: p.get("incompletes") === "1",
    },
    tri: tri && ["score", "prix-asc", "prix-desc", "puissance", "conso"].includes(tri) ? tri : "score",
  };
}

/** Nombre de critères renseignés (pour l'affichage). */
export function nombreCriteresActifs(c: Criteres): number {
  let n = 0;
  if (c.budgetMin !== null || c.budgetMax !== null) n++;
  if (c.puissanceMin !== null || c.puissanceMax !== null) n++;
  for (const k of ["marques", "carrosseries", "energies", "couleurs"] as const) if (c[k].length) n++;
  for (const k of ["zeroCentMax", "boite", "transmission", "placesMin", "coffreMin", "consoMax", "consoElecMax", "autonomieMin", "critAirMax"] as const)
    if (c[k] !== null) n++;
  if (!c.neuveUniquement) n++;
  return n;
}

export const afficheAutonomie = (c: Criteres) =>
  c.energies.includes("électrique") || c.energies.includes("hybride rechargeable");

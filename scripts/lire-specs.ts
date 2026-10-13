/**
 * Étape 1d — Lecture des fiches techniques saisies (scripts/specs/*.txt).
 * Voir scripts/specs/LISEZMOI.md pour le format.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RACINE } from "./lib/fichiers.ts";
import type { Carrosserie, Energie, Segment, Version } from "../src/types.ts";
import { CARROSSERIES } from "../src/types.ts";

export interface SpecModele {
  marque: string;
  nom: string;
  carrosserie: Carrosserie;
  segment: Segment | null;
  anneeDebut: number | null;
  anneeFin: number | null;
  couleurs: string[];
  versions: Version[];
  fichier: string;
}

const COULEURS: Record<string, string> = {
  B: "Blanc", N: "Noir", G: "Gris", A: "Argent", R: "Rouge", Bl: "Bleu", V: "Vert", J: "Jaune",
  O: "Orange", Be: "Beige", M: "Marron", Vi: "Violet", Ro: "Rose",
};
const ENERGIES: Record<string, Energie> = {
  E: "essence", D: "diesel", HEV: "hybride", PHEV: "hybride rechargeable", EV: "électrique", GPL: "GPL", E85: "E85",
};
const TRANSMISSIONS = { T: "traction", P: "propulsion", "4": "intégrale" } as const;

const num = (s: string | undefined): number | null => {
  if (s === undefined) return null;
  const t = s.trim().replace(",", ".");
  if (t === "" || t === "-" || t === "?") return null;
  const n = Number(t);
  if (Number.isNaN(n)) throw new Error(`nombre invalide « ${s} »`);
  return n;
};

/**
 * Vignette Crit'Air déduite de la réglementation (arrêté du 21 juin 2016) pour un véhicule neuf
 * vendu depuis 2011 : électrique = 0, essence/hybride/GPL/E85 (Euro 5-6) = 1, diesel Euro 5-6 = 2.
 */
export function critAir(energie: Energie, anneeDebut: number | null): string | null {
  if (energie === "électrique") return "0";
  if (anneeDebut === null || anneeDebut < 2011) return null;
  return energie === "diesel" ? "2" : "1";
}

export function lireSpecs(): SpecModele[] {
  const dossier = join(RACINE, "scripts", "specs");
  const modeles: SpecModele[] = [];
  for (const fichier of readdirSync(dossier).filter((f) => f.endsWith(".txt")).sort()) {
    const lignes = readFileSync(join(dossier, fichier), "utf8").split("\n");
    let courant: (SpecModele & { defauts: { places: number | null; portes: number | null; coffre: number | null } }) | null = null;
    lignes.forEach((brute, i) => {
      const ligne = brute.trim();
      if (!ligne || ligne.startsWith("#")) return;
      const ou = `${fichier}:${i + 1}`;
      try {
        if (ligne.startsWith("@")) {
          const [marque, nom, carrosserie, segment, annees, couleurs, dims] = ligne.slice(1).split("|").map((s) => s.trim());
          if (!CARROSSERIES.includes(carrosserie as Carrosserie)) throw new Error(`carrosserie inconnue « ${carrosserie} »`);
          const [debut, fin] = annees.split("-");
          const [places, portes, coffre] = dims.split(/\s+/).map(num);
          courant = {
            marque,
            nom,
            carrosserie: carrosserie as Carrosserie,
            segment: segment === "-" ? null : (segment as Segment),
            anneeDebut: num(debut),
            anneeFin: num(fin),
            couleurs: couleurs.split(/\s+/).filter(Boolean).map((c) => {
              if (!COULEURS[c]) throw new Error(`couleur inconnue « ${c} »`);
              return COULEURS[c];
            }),
            versions: [],
            fichier,
            defauts: { places, portes, coffre },
          };
          modeles.push(courant);
          return;
        }
        if (!courant) throw new Error("version sans modèle");
        const c = ligne.split("|").map((s) => s.trim());
        if (c.length < 12) throw new Error(`${c.length} colonnes au lieu de 12`);
        const [nom, en, ch, bv, tr, prix, conso, co2, autonomie, zeroCent, vmax, poids, surcharges = ""] = c;
        const energie = ENERGIES[en];
        if (!energie) throw new Error(`énergie inconnue « ${en} »`);
        if (bv !== "M" && bv !== "A") throw new Error(`boîte inconnue « ${bv} »`);
        const s: Record<string, number | null> = {};
        for (const o of surcharges.split(/\s+/).filter(Boolean)) {
          const [k, v] = o.split("=");
          s[k] = num(v);
        }
        courant.versions.push({
          nom,
          energie,
          puissanceCh: num(ch),
          boite: bv === "M" ? "manuelle" : "automatique",
          transmission: tr === "-" ? null : TRANSMISSIONS[tr as keyof typeof TRANSMISSIONS] ?? null,
          prixNeufEuros: num(prix),
          consommation: num(conso),
          co2: num(co2),
          autonomieKm: num(autonomie),
          places: "pl" in s ? s.pl : courant.defauts.places,
          portes: "p" in s ? s.p : courant.defauts.portes,
          coffreLitres: "c" in s ? s.c : courant.defauts.coffre,
          zeroCentSecondes: num(zeroCent),
          vitesseMaxKmh: num(vmax),
          poidsKg: num(poids),
          critAir: critAir(energie, courant.anneeDebut),
        });
      } catch (e) {
        throw new Error(`${ou} : ${(e as Error).message}`);
      }
    });
  }
  return modeles.map(({ ...m }) => {
    delete (m as { defauts?: unknown }).defauts;
    return m;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const specs = lireSpecs();
  console.log(`${specs.length} modèles, ${specs.reduce((s, m) => s + m.versions.length, 0)} versions`);
}

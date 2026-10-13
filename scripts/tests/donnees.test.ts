import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lireSpecs } from "../lire-specs.ts";
import { verifierModele } from "../verifier.ts";
import { anneesDescription } from "../fetch-wikidata.ts";
import { idMarque, nomMarque } from "../lib/normaliser.ts";
import { CARROSSERIES, ENERGIES, type Marque, type Modele } from "../../src/types.ts";

describe("fiches techniques", () => {
  const specs = lireSpecs();
  it("se lisent sans erreur et sans erreur de cohérence", () => {
    expect(specs.length).toBeGreaterThan(400);
    const erreurs = specs.flatMap(verifierModele).filter((p) => p.niveau === "erreur");
    expect(erreurs).toEqual([]);
  });
  it("n'ont pas de modèle en double", () => {
    const cles = specs.map((s) => `${idMarque(s.marque)}::${s.nom.toLowerCase()}`);
    expect(new Set(cles).size).toBe(cles.length);
  });
});

describe("base générée (public/data)", () => {
  const dossier = join(import.meta.dirname, "..", "..", "public", "data");
  const modeles: Modele[] = JSON.parse(readFileSync(join(dossier, "voitures.json"), "utf8"));
  const marques: Marque[] = JSON.parse(readFileSync(join(dossier, "marques.json"), "utf8"));
  const ids = new Set(marques.map((m) => m.id));

  it("respecte le schéma", () => {
    for (const m of modeles) {
      expect(ids.has(m.marqueId), m.id).toBe(true);
      expect(CARROSSERIES).toContain(m.carrosserie);
      expect(m.source).toBeTruthy();
      expect(m.dateMiseAJour).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const v of m.versions) expect(ENERGIES).toContain(v.energie);
      for (const p of m.photos) {
        expect(p.url).toMatch(/^https:\/\/(upload|thumb)\.wikimedia\.org\//);
        expect(p.auteur).toBeTruthy();
        expect(p.licence).toBeTruthy();
      }
    }
  });
  it("a des identifiants uniques", () => {
    expect(new Set(modeles.map((m) => m.id)).size).toBe(modeles.length);
    expect(ids.size).toBe(marques.length);
  });
});

describe("normalisation", () => {
  it("extrait les années des descriptions Wikidata", () => {
    expect(anneesDescription("modèle d'automobile (2013-2019)")).toMatchObject({ debut: 2013, fin: 2019 });
    expect(anneesDescription("SUV commercialisé à partir de 2018 par Dacia")).toMatchObject({ debut: 2018, fin: null });
    expect(anneesDescription("Ford car")).toBeNull();
  });
  it("retire les formes juridiques des noms de marques", () => {
    expect(nomMarque("Lincoln Motor Company")).toBe("Lincoln");
    expect(nomMarque("General Motors")).toBe("General Motors");
    expect(idMarque("Renault Group")).toBe("renault");
    expect(idMarque("Citroën")).toBe("citroen");
  });
});

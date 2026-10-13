import { describe, expect, it } from "vitest";
import type { Modele, Version } from "../types";
import { CRITERES_VIDES, type Criteres } from "./criteres";
import { evaluer, rechercher, suggestion, trier } from "./score";

const version = (v: Partial<Version>): Version => ({
  nom: "Test",
  energie: "essence",
  puissanceCh: 100,
  boite: "manuelle",
  transmission: "traction",
  prixNeufEuros: 20000,
  consommation: 5.5,
  co2: 125,
  autonomieKm: null,
  places: 5,
  portes: 5,
  coffreLitres: 350,
  zeroCentSecondes: 11,
  vitesseMaxKmh: 180,
  poidsKg: 1150,
  critAir: "1",
  ...v,
});

const modele = (m: Partial<Modele>): Modele => ({
  id: "m",
  marqueId: "peugeot",
  nom: "Modèle",
  anneeDebut: 2020,
  anneeFin: null,
  carrosserie: "citadine",
  segment: "B",
  photos: [],
  couleursDisponibles: ["Blanc", "Noir"],
  versions: [version({})],
  source: "test",
  dateMiseAJour: "2026-01-01",
  ...m,
});

const c = (p: Partial<Criteres>): Criteres => ({ ...CRITERES_VIDES, ...p });

describe("score de correspondance", () => {
  it("vaut 100 % sans critère", () => {
    const m = modele({});
    expect(evaluer(m, m.versions[0], CRITERES_VIDES).score).toBe(100);
  });

  it("élimine sur les critères stricts : budget, places, énergie", () => {
    const m = modele({});
    const v = m.versions[0];
    expect(evaluer(m, v, c({ budgetMax: 15000 })).elimine).toBe("budget");
    expect(evaluer(m, v, c({ placesMin: 7 })).elimine).toBe("places");
    expect(evaluer(m, v, c({ energies: ["électrique"] })).elimine).toBe("énergie");
    expect(evaluer(m, v, c({ budgetMax: 25000, placesMin: 5, energies: ["essence"] })).elimine).toBeNull();
  });

  it("élimine un prix inconnu quand un budget est demandé (aucune valeur supposée)", () => {
    const m = modele({ versions: [version({ prixNeufEuros: null })] });
    expect(evaluer(m, m.versions[0], c({ budgetMax: 50000 })).elimine).toBe("budget");
  });

  it("retire des points selon l'écart, sans éliminer, sur les critères souples", () => {
    const m = modele({});
    const proche = evaluer(m, m.versions[0], c({ puissanceMin: 120 })).score;
    const loin = evaluer(m, m.versions[0], c({ puissanceMin: 190 })).score;
    expect(proche).toBeLessThan(100);
    expect(loin).toBeLessThan(proche);
    expect(evaluer(m, m.versions[0], c({ carrosseries: ["SUV"] })).elimine).toBeNull();
  });

  it("exclut les modèles plus produits quand « neuves uniquement » est actif", () => {
    const m = modele({ anneeFin: 2019 });
    expect(evaluer(m, m.versions[0], CRITERES_VIDES).elimine).toBe("période");
    expect(evaluer(m, m.versions[0], c({ neuveUniquement: false })).elimine).toBeNull();
  });

  it("une électrique satisfait le critère de consommation de carburant", () => {
    const m = modele({ versions: [version({ energie: "électrique", consommation: 15, co2: 0, autonomieKm: 400 })] });
    expect(evaluer(m, m.versions[0], c({ consoMax: 4 })).score).toBe(100);
  });

  it("trie par prix croissant avec les prix inconnus à la fin", () => {
    const modeles = [
      modele({ id: "a", versions: [version({ prixNeufEuros: 30000 })] }),
      modele({ id: "b", versions: [version({ prixNeufEuros: null })] }),
      modele({ id: "c", versions: [version({ prixNeufEuros: 15000 })] }),
    ];
    const tries = trier(rechercher(modeles, CRITERES_VIDES).resultats, "prix-asc").map((r) => r.modele.id);
    expect(tries).toEqual(["c", "a", "b"]);
  });

  it("suggère le budget minimal qui donne des résultats", () => {
    const modeles = [modele({ versions: [version({ prixNeufEuros: 20400 })] })];
    const s = suggestion(modeles, c({ budgetMax: 15000 }));
    expect(s?.criteres.budgetMax).toBe(21000);
    expect(s?.texte).toContain("21");
  });
});

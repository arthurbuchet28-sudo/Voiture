import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Marque, Modele } from "../types";
import { creerIndex } from "./recherche";

// Recherche sur la vraie base générée.
const dossier = join(import.meta.dirname, "..", "..", "public", "data");
const modeles: Modele[] = JSON.parse(readFileSync(join(dossier, "voitures.json"), "utf8"));
const marques: Marque[] = JSON.parse(readFileSync(join(dossier, "marques.json"), "utf8"));
const rechercher = creerIndex(modeles, new Map(marques.map((m) => [m.id, m])));
const premier = (q: string) => {
  const s = rechercher(q).suggestions[0];
  return s ? `${s.modele.marqueId} ${s.modele.nom}${s.indexVersion !== null ? ` | ${s.modele.versions[s.indexVersion].nom}` : ""}` : null;
};

describe("recherche rapide", () => {
  it.each([
    ["208", "peugeot 208"],
    ["vw golf", "volkswagen Golf"],
    ["Volkswagen Golf", "volkswagen Golf"],
    ["mercedes classe a", "mercedes-benz Classe A"],
    ["golf 8", "volkswagen Golf"],
    ["clio 5", "renault Clio"],
    ["clio 4", "renault Clio IV"],
    ["model y", "tesla Model Y"],
    ["zoé", "renault Zoe"],
    ["ds7", "ds DS 7"],
    ["bmw x1", "bmw X1"],
  ])("« %s » propose d'abord %s", (q, attendu) => {
    expect(premier(q)?.split(" | ")[0]).toBe(attendu);
  });

  it("trouve la version visée", () => {
    expect(premier("polo gti")).toBe("volkswagen Polo | GTI 207 DSG7");
    expect(premier("e-208")).toMatch(/^peugeot 208 \| e-208/);
    expect(premier("208 hybride")).toMatch(/^peugeot 208 \| Hybrid/);
  });

  it("reconnaît les catégories sans lister tous les modèles", () => {
    const r = rechercher("SUV électrique");
    expect(r.carrosseries).toEqual(["SUV"]);
    expect(r.energies).toEqual(["électrique"]);
    // Seuls les modèles dont le nom contient « SUV » (EQE SUV…) sont proposés, pas tous les SUV.
    expect(r.suggestions.every((s) => /suv/i.test(s.modele.nom))).toBe(true);
  });

  it("ne renvoie rien pour un texte sans rapport", () => {
    expect(rechercher("xyzzy").suggestions).toEqual([]);
  });
});

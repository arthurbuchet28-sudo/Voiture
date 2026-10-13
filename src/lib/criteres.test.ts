import { describe, expect, it } from "vitest";
import { CRITERES_VIDES, PROFILS, appliquerProfil, criteresVersParams, paramsVersCriteres, type Criteres } from "./criteres";

describe("critères dans l'URL", () => {
  it("un aller-retour conserve tous les critères", () => {
    const c: Criteres = {
      ...CRITERES_VIDES,
      budgetMin: 10000,
      budgetMax: 35000,
      marques: ["peugeot", "renault"],
      carrosseries: ["SUV", "break"],
      energies: ["hybride", "électrique"],
      puissanceMin: 100,
      puissanceMax: null,
      zeroCentMax: 8,
      boite: "automatique",
      transmission: "intégrale",
      placesMin: 5,
      coffreMin: 450,
      consoMax: 5,
      consoElecMax: 16,
      autonomieMin: 350,
      critAirMax: 1,
      couleurs: ["Bleu"],
      neuveUniquement: false,
      anneeMin: 2015,
      anneeMax: null,
      inclureIncompletes: true,
    };
    const { criteres, tri } = paramsVersCriteres(criteresVersParams(c, "prix-asc"));
    expect(criteres).toEqual(c);
    expect(tri).toBe("prix-asc");
  });

  it("des critères vides donnent une URL vide", () => {
    expect(criteresVersParams(CRITERES_VIDES).toString()).toBe("");
  });

  it("ignore les valeurs invalides", () => {
    const { criteres } = paramsVersCriteres(new URLSearchParams("carrosseries=fusée,SUV&boite=robot&places=abc"));
    expect(criteres.carrosseries).toEqual(["SUV"]);
    expect(criteres.boite).toBeNull();
    expect(criteres.placesMin).toBeNull();
  });

  it("chaque profil rapide survit à l'URL", () => {
    for (const p of PROFILS) {
      const c = appliquerProfil(p);
      expect(paramsVersCriteres(criteresVersParams(c)).criteres).toEqual(c);
    }
  });
});

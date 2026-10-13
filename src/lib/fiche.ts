import type { Version } from "../types";
import { conso, dec, nombre, prix } from "./format";

export const val = (v: number | null, suffixe = "", f: (n: number) => string = nombre) => (v === null ? "—" : `${f(v)}${suffixe}`);

export function lignesTechniques(v: Version): [string, string][] {
  return [
    ["Énergie", v.energie],
    ["Puissance", val(v.puissanceCh, " ch")],
    ["Boîte de vitesses", v.boite],
    ["Transmission", v.transmission ?? "—"],
    ["Prix neuf (indicatif)", prix(v.prixNeufEuros)],
    ["Consommation (WLTP)", conso(v) ?? "—"],
    ["Émissions de CO₂", val(v.co2, " g/km")],
    ["Autonomie électrique (WLTP)", val(v.autonomieKm, " km")],
    ["0 à 100 km/h", val(v.zeroCentSecondes, " s", dec)],
    ["Vitesse maximale", val(v.vitesseMaxKmh, " km/h")],
    ["Places", val(v.places)],
    ["Portes", val(v.portes)],
    ["Volume de coffre", val(v.coffreLitres, " L")],
    ["Poids à vide", val(v.poidsKg, " kg")],
    ["Vignette Crit'Air", v.critAir ?? "—"],
  ];
}


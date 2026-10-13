/**
 * Étape 1b — API NHTSA vPIC (https://vpic.nhtsa.dot.gov/api/)
 * Complète la liste des marques (types « Passenger Car », « MPV », « Truck »)
 * et la liste des modèles de chaque marque.
 * Résultat brut : scripts/cache/nhtsa.json
 */
import { join } from "node:path";
import { fetchJson, pool } from "./lib/http.ts";
import { CACHE, ecrireJson } from "./lib/fichiers.ts";

const API = "https://vpic.nhtsa.dot.gov/api/vehicles";
const TYPES = ["car", "mpv", "truck"] as const;
type TypeNhtsa = (typeof TYPES)[number];

export interface NhtsaMarque {
  nom: string;
  types: TypeNhtsa[];
  modeles: { nom: string; type: TypeNhtsa }[];
}

export interface NhtsaExport {
  date: string;
  marques: NhtsaMarque[];
}

interface Reponse<T> {
  Results: T[];
}

export async function collecterNhtsa(): Promise<NhtsaExport> {
  const marques = new Map<string, NhtsaMarque>();
  for (const type of TYPES) {
    const res = await fetchJson<Reponse<{ MakeName: string }>>(`${API}/GetMakesForVehicleType/${type}?format=json`);
    for (const m of res.Results) {
      const nom = m.MakeName.trim();
      const e = marques.get(nom) ?? { nom, types: [], modeles: [] };
      if (!e.types.includes(type)) e.types.push(type);
      marques.set(nom, e);
    }
  }
  console.log(`[nhtsa] ${marques.size} marques`);

  const taches = [...marques.values()].flatMap((m) => m.types.map((type) => ({ m, type })));
  let faites = 0;
  await pool(taches, 4, async ({ m, type }) => {
    try {
      const res = await fetchJson<Reponse<{ Model_Name: string }>>(
        `${API}/GetModelsForMakeYear/make/${encodeURIComponent(m.nom)}/vehicletype/${type}?format=json`,
      );
      for (const r of res.Results) {
        const nom = r.Model_Name.trim();
        if (!m.modeles.some((x) => x.nom === nom)) m.modeles.push({ nom, type });
      }
    } catch (e) {
      console.warn(`[nhtsa] échec ${m.nom}/${type} : ${(e as Error).message}`);
    }
    if (++faites % 50 === 0) console.log(`[nhtsa] ${faites}/${taches.length} requêtes`);
  });

  const resultat: NhtsaExport = { date: new Date().toISOString().slice(0, 10), marques: [...marques.values()] };
  console.log(`[nhtsa] ${resultat.marques.reduce((s, m) => s + m.modeles.length, 0)} modèles`);
  ecrireJson(join(CACHE, "nhtsa.json"), resultat);
  return resultat;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await collecterNhtsa();
}

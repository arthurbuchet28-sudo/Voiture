import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CACHE = join(RACINE, "scripts", "cache");
export const SORTIE = join(RACINE, "public", "data");

export function ecrireJson(chemin: string, donnees: unknown, indent = 0) {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, JSON.stringify(donnees, null, indent || undefined));
}

export function lireJson<T>(chemin: string, defaut?: T): T {
  if (!existsSync(chemin)) {
    if (defaut !== undefined) return defaut;
    throw new Error(`Fichier manquant : ${chemin}. Lancez d'abord l'étape de collecte correspondante.`);
  }
  return JSON.parse(readFileSync(chemin, "utf8")) as T;
}

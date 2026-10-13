// Recherche rapide par mots-clés : « vw golf », « mercedes classe a », « clio 4 », « polo gti »,
// « 208 hybride », « suv électrique »… Chaque mot doit se retrouver dans le modèle (marque, nom,
// génération) ou dans l'une de ses versions ; les mots désignant une carrosserie ou une énergie
// servent aussi à proposer la page de résultats filtrée.
import type { Carrosserie, Energie, Marque, Modele } from "../types";
import { sansAccents } from "./texte";

const ALIAS_MARQUES: Record<string, string[]> = {
  volkswagen: ["vw"],
  "mercedes-benz": ["mercedes", "merco", "mb"],
  citroen: ["citro"],
  "alfa-romeo": ["alfa"],
  "land-rover": ["range"],
  chevrolet: ["chevy"],
  "rolls-royce": ["rolls"],
  "aston-martin": ["aston"],
};

const MOTS_CARROSSERIE: Record<string, Carrosserie> = {
  citadine: "citadine", citadines: "citadine", citadin: "citadine",
  suv: "SUV", "4x4": "SUV", crossover: "SUV",
  berline: "berline", berlines: "berline", compacte: "berline",
  break: "break", breaks: "break", sw: "break", touring: "break", estate: "break",
  monospace: "monospace", monospaces: "monospace", ludospace: "monospace", familiale: "monospace",
  coupe: "coupé", coupes: "coupé", sportive: "coupé",
  cabriolet: "cabriolet", cabrio: "cabriolet", decapotable: "cabriolet", roadster: "cabriolet",
  pickup: "pick-up", "pick-up": "pick-up",
  utilitaire: "utilitaire", van: "utilitaire", fourgon: "utilitaire",
};
const MOTS_ENERGIE: Record<string, Energie> = {
  essence: "essence",
  diesel: "diesel",
  hybride: "hybride", hybrid: "hybride", hev: "hybride",
  rechargeable: "hybride rechargeable", phev: "hybride rechargeable", "plug-in": "hybride rechargeable",
  electrique: "électrique", electriques: "électrique", ev: "électrique", "100%": "électrique",
  gpl: "GPL",
  e85: "E85", ethanol: "E85", bioethanol: "E85",
};

const ROMAINS: Record<string, string> = { i: "1", ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10" };

const norm = (s: string) => sansAccents(s).toLowerCase();
/** Découpe en mots ; « e-208 » donne « e », « 208 » et la forme collée « e208 ». */
function mots(s: string): string[] {
  const n = norm(s);
  const simples = n.split(/[^a-z0-9%+]+/).filter(Boolean);
  const colles = n.split(/\s+/).map((m) => m.replace(/[^a-z0-9]+/g, "")).filter((m) => m && !simples.includes(m));
  return [...simples, ...colles];
}

interface Entree {
  modele: Modele;
  nom: string[]; // mots de la marque et du modèle (y compris générations converties en chiffres)
  compact: string; // marque + modèle sans séparateurs
  versions: { index: number; mots: string[] }[];
}

export interface Suggestion {
  modele: Modele;
  indexVersion: number | null; // version correspondant le mieux (« polo gti » -> la GTI)
  score: number;
}

export interface ResultatRecherche {
  suggestions: Suggestion[];
  carrosseries: Carrosserie[];
  energies: Energie[];
}

export function creerIndex(modeles: Modele[], marques: Map<string, Marque>) {
  const entrees: Entree[] = modeles.map((m) => {
    const marque = marques.get(m.marqueId)?.nom ?? m.marqueId;
    const nom = [...mots(marque), ...(ALIAS_MARQUES[m.marqueId] ?? []), ...mots(m.nom)];
    for (const w of [...nom]) if (ROMAINS[w]) nom.push(ROMAINS[w]);
    return {
      modele: m,
      nom,
      compact: norm(`${marque}${m.nom}`).replace(/[^a-z0-9]+/g, ""),
      versions: m.versions.map((v, index) => ({ index, mots: [...mots(v.nom), ...mots(v.energie)] })),
    };
  });

  return function rechercher(requete: string, limite = 8): ResultatRecherche {
    const q = mots(requete);
    const carrosseries = [...new Set(q.map((w) => MOTS_CARROSSERIE[w]).filter(Boolean))];
    const energies = [...new Set(q.map((w) => MOTS_ENERGIE[w]).filter(Boolean))];
    if (!q.length) return { suggestions: [], carrosseries, energies };

    const suggestions: Suggestion[] = [];
    for (const e of entrees) {
      let score = 0;
      let motsNom = 0;
      let versionsOk = e.versions.map((v) => v.index);
      let echec = false;
      for (const w of q) {
        const dansNom = e.nom.some((t) => t.startsWith(w)) || (w.length >= 3 && e.compact.includes(w));
        if (dansNom) {
          score += e.nom.includes(w) ? 3 : 2;
          motsNom++;
          continue;
        }
        const versions = e.versions.filter((v) => v.mots.some((t) => t.startsWith(w))).map((v) => v.index);
        if (versions.length) {
          versionsOk = versionsOk.filter((i) => versions.includes(i));
          score += 1;
          continue;
        }
        if (MOTS_CARROSSERIE[w] && e.modele.carrosserie === MOTS_CARROSSERIE[w]) {
          score += 1;
          continue;
        }
        // Un numéro de génération sans correspondance (« clio 5 ») n'élimine pas le modèle.
        if (/^\d{1,2}$/.test(w) && Number(w) <= 12) continue;
        echec = true;
        break;
      }
      // Au moins un mot doit viser le nom : « hybride » seul ne doit pas lister tous les hybrides.
      if (echec || motsNom === 0) continue;
      if (e.modele.versions.length) score += 1;
      if (e.modele.anneeFin === null) score += 1;
      suggestions.push({
        modele: e.modele,
        indexVersion: versionsOk.length && versionsOk.length < e.versions.length ? versionsOk[0] : null,
        score,
      });
    }
    suggestions.sort((a, b) => b.score - a.score || a.modele.nom.length - b.modele.nom.length);
    return { suggestions: suggestions.slice(0, limite), carrosseries, energies };
  };
}

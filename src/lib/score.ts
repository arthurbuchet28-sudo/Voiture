// Calcul du score de correspondance (0 à 100 %) de chaque version.
// - Critères stricts (budget, places, énergie) : éliminent la version si non respectés ou inconnus.
// - Autres critères : chacun a un poids ; la satisfaction (0 à 1) dépend de l'écart avec la demande.
import type { Modele, Version } from "../types";
import { ANNEE_COURANTE, type Criteres, type Tri } from "./criteres";

export interface Resultat {
  cle: string;
  modele: Modele;
  version: Version | null; // null : modèle sans fiche technique
  indexVersion: number;
  score: number;
  details: { critere: string; satisfaction: number; inconnu?: boolean }[];
}

export type CritereStrict = "budget" | "places" | "énergie" | "période";

interface Evaluation {
  elimine: CritereStrict | null;
  score: number;
  details: Resultat["details"];
}

/** Satisfaction décroissante linéairement : 1 dans la cible, 0 à `tolerance` d'écart. */
const decroissance = (ecart: number, tolerance: number) => Math.max(0, Math.min(1, 1 - ecart / tolerance));

function anneesSeChevauchent(m: Modele, c: Criteres): number {
  const min = c.anneeMin ?? 0;
  const max = c.anneeMax ?? ANNEE_COURANTE;
  const debut = m.anneeDebut;
  const fin = m.anneeFin ?? ANNEE_COURANTE;
  if (debut === null) return -1;
  if (fin < min) return min - fin;
  if (debut > max) return debut - max;
  return 0;
}

export function evaluer(m: Modele, v: Version | null, c: Criteres): Evaluation {
  const details: Resultat["details"] = [];

  // --- Périmètre : neuves uniquement / plage d'années ---
  if (c.neuveUniquement) {
    if (m.anneeFin !== null || (v === null && m.anneeDebut === null)) return { elimine: "période", score: 0, details };
  }

  // --- Critères stricts ---
  if (c.budgetMin !== null || c.budgetMax !== null) {
    const p = v?.prixNeufEuros ?? null;
    if (p === null) return { elimine: "budget", score: 0, details };
    if ((c.budgetMin !== null && p < c.budgetMin) || (c.budgetMax !== null && p > c.budgetMax))
      return { elimine: "budget", score: 0, details };
    details.push({ critere: "Budget", satisfaction: 1 });
  }
  if (c.placesMin !== null) {
    const pl = v?.places ?? null;
    if (pl === null || pl < c.placesMin) return { elimine: "places", score: 0, details };
    details.push({ critere: "Places", satisfaction: 1 });
  }
  if (c.energies.length) {
    if (!v || !c.energies.includes(v.energie)) return { elimine: "énergie", score: 0, details };
    details.push({ critere: "Énergie", satisfaction: 1 });
  }

  // --- Critères pondérés ---
  let total = 0;
  let poids = 0;
  const noter = (critere: string, w: number, s: number | null) => {
    const inconnu = s === null;
    const sat = inconnu ? 0.4 : s; // une donnée inconnue rapporte peu de points
    total += w * sat;
    poids += w;
    details.push({ critere, satisfaction: sat, inconnu });
  };

  if (c.marques.length) noter("Marque", 3, c.marques.includes(m.marqueId) ? 1 : 0);
  if (c.carrosseries.length) noter("Carrosserie", 3, c.carrosseries.includes(m.carrosserie) ? 1 : 0);

  if (c.puissanceMin !== null || c.puissanceMax !== null) {
    const ch = v?.puissanceCh ?? null;
    let s: number | null = null;
    if (ch !== null) {
      if (c.puissanceMin !== null && ch < c.puissanceMin) s = decroissance(c.puissanceMin - ch, c.puissanceMin * 0.5);
      else if (c.puissanceMax !== null && ch > c.puissanceMax) s = decroissance(ch - c.puissanceMax, c.puissanceMax * 0.6);
      else s = 1;
    }
    noter("Puissance", 2, s);
  }
  if (c.zeroCentMax !== null) {
    const z = v?.zeroCentSecondes ?? null;
    noter("0 à 100 km/h", 1.5, z === null ? null : z <= c.zeroCentMax ? 1 : decroissance(z - c.zeroCentMax, c.zeroCentMax * 0.6));
  }
  if (c.boite) noter("Boîte", 1.5, v ? (v.boite === c.boite ? 1 : 0) : null);
  if (c.transmission) noter("Transmission", 1, v?.transmission ? (v.transmission === c.transmission ? 1 : 0) : null);
  if (c.coffreMin !== null) {
    const k = v?.coffreLitres ?? null;
    noter("Coffre", 1.5, k === null ? null : k >= c.coffreMin ? 1 : decroissance(c.coffreMin - k, c.coffreMin * 0.6));
  }
  if (c.consoMax !== null) {
    // Une électrique ne consomme pas de carburant : elle satisfait le critère.
    if (v?.energie === "électrique") noter("Consommation", 1.5, 1);
    else {
      const l = v?.consommation ?? null;
      noter("Consommation", 1.5, l === null ? null : l <= c.consoMax ? 1 : decroissance(l - c.consoMax, c.consoMax * 0.6));
    }
  }
  if (c.consoElecMax !== null && v?.energie === "électrique") {
    const k = v.consommation;
    noter("Consommation électrique", 1, k === null ? null : k <= c.consoElecMax ? 1 : decroissance(k - c.consoElecMax, c.consoElecMax * 0.5));
  }
  if (c.autonomieMin !== null && (v === null || v.energie === "électrique" || v.energie === "hybride rechargeable")) {
    const a = v?.autonomieKm ?? null;
    // Pour un hybride rechargeable, l'autonomie électrique est comparée au tiers de la demande.
    const cible = v?.energie === "hybride rechargeable" ? Math.min(c.autonomieMin, 80) : c.autonomieMin;
    noter("Autonomie", 2, a === null ? null : a >= cible ? 1 : decroissance(cible - a, cible * 0.7));
  }
  if (c.critAirMax !== null) {
    const ca = v?.critAir ?? null;
    noter("Crit'Air", 1.5, ca === null ? null : Number(ca) <= c.critAirMax ? 1 : 0);
  }
  if (c.couleurs.length) {
    noter("Couleur", 1, m.couleursDisponibles.length ? (c.couleurs.some((x) => m.couleursDisponibles.includes(x)) ? 1 : 0) : null);
  }
  if (!c.neuveUniquement && (c.anneeMin !== null || c.anneeMax !== null)) {
    const ecart = anneesSeChevauchent(m, c);
    noter("Années", 2, ecart < 0 ? null : decroissance(ecart, 10));
  }

  // Sans critère pondéré, une version qui passe les filtres stricts correspond à 100 %,
  // légèrement moins si sa fiche est incomplète.
  let score = poids ? (total / poids) * 100 : 100;
  if (!v && !poids) score = 60;
  return { elimine: null, score: Math.round(score), details };
}

export function entrees(modeles: Modele[], inclureIncompletes: boolean): { modele: Modele; version: Version | null; index: number }[] {
  const res: { modele: Modele; version: Version | null; index: number }[] = [];
  for (const m of modeles) {
    if (m.versions.length) m.versions.forEach((v, i) => res.push({ modele: m, version: v, index: i }));
    else if (inclureIncompletes) res.push({ modele: m, version: null, index: -1 });
  }
  return res;
}

export interface Recherche {
  resultats: Resultat[];
  elimines: Record<CritereStrict, number>;
}

export function rechercher(modeles: Modele[], c: Criteres): Recherche {
  const resultats: Resultat[] = [];
  const elimines: Record<CritereStrict, number> = { budget: 0, places: 0, énergie: 0, période: 0 };
  for (const { modele, version, index } of entrees(modeles, c.inclureIncompletes)) {
    const e = evaluer(modele, version, c);
    if (e.elimine) {
      elimines[e.elimine]++;
      continue;
    }
    resultats.push({ cle: `${modele.id}#${index}`, modele, version, indexVersion: index, score: e.score, details: e.details });
  }
  return { resultats, elimines };
}

const nulsALaFin = (a: number | null | undefined, b: number | null | undefined, sens: 1 | -1) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * sens;
};

export function trier(r: Resultat[], tri: Tri): Resultat[] {
  const copie = [...r];
  const prix = (x: Resultat) => x.version?.prixNeufEuros;
  switch (tri) {
    case "prix-asc":
      return copie.sort((a, b) => nulsALaFin(prix(a), prix(b), 1) || b.score - a.score);
    case "prix-desc":
      return copie.sort((a, b) => nulsALaFin(prix(a), prix(b), -1) || b.score - a.score);
    case "puissance":
      return copie.sort((a, b) => nulsALaFin(a.version?.puissanceCh, b.version?.puissanceCh, -1) || b.score - a.score);
    case "conso":
      // Électriques (kWh) et thermiques (L) ne sont pas comparables : on classe chaque énergie à part,
      // les thermiques par L/100 km d'abord, puis les électriques par kWh/100 km.
      return copie.sort((a, b) => {
        const ea = a.version?.energie === "électrique" ? 1 : 0;
        const eb = b.version?.energie === "électrique" ? 1 : 0;
        return ea - eb || nulsALaFin(a.version?.consommation, b.version?.consommation, 1) || b.score - a.score;
      });
    default:
      return copie.sort(
        (a, b) =>
          b.score - a.score ||
          Number(!!b.version) - Number(!!a.version) ||
          nulsALaFin(prix(a), prix(b), 1) ||
          a.modele.nom.localeCompare(b.modele.nom, "fr"),
      );
  }
}

/** Suggestion quand il n'y a aucun résultat : le critère strict à assouplir et une valeur proposée. */
export function suggestion(modeles: Modele[], c: Criteres): { texte: string; criteres: Criteres } | null {
  const essais: { texte: (n: number) => string; criteres: Criteres; prioritaire?: boolean }[] = [];
  if (c.budgetMin !== null || c.budgetMax !== null) {
    // Prix le plus proche du budget parmi les versions qui respectent les autres critères stricts.
    const sansBudget = { ...c, budgetMin: null, budgetMax: null };
    const prixPossibles = rechercher(modeles, sansBudget)
      .resultats.map((r) => r.version?.prixNeufEuros)
      .filter((p): p is number => typeof p === "number");
    if (prixPossibles.length) {
      const au_dessus = prixPossibles.filter((p) => c.budgetMax === null || p > c.budgetMax).sort((a, b) => a - b);
      const nouveauMax = c.budgetMax !== null && au_dessus.length ? Math.ceil(au_dessus[0] / 1000) * 1000 : null;
      if (nouveauMax !== null)
        essais.push({
          texte: (n) => `Augmentez votre budget maximum à ${nouveauMax.toLocaleString("fr-FR")} € (${n} résultat${n > 1 ? "s" : ""})`,
          criteres: { ...c, budgetMax: nouveauMax },
          prioritaire: true,
        });
      essais.push({ texte: (n) => `Retirez le critère de budget (${n} résultats)`, criteres: sansBudget });
    }
  }
  if (c.placesMin !== null) essais.push({ texte: (n) => `Retirez le nombre de places minimum (${n} résultats)`, criteres: { ...c, placesMin: null } });
  if (c.energies.length) essais.push({ texte: (n) => `Élargissez à toutes les énergies (${n} résultats)`, criteres: { ...c, energies: [] } });
  if (c.neuveUniquement) essais.push({ texte: (n) => `Incluez les modèles plus anciens (${n} résultats)`, criteres: { ...c, neuveUniquement: false } });

  const possibles = essais
    .map((e) => ({ ...e, n: rechercher(modeles, e.criteres).resultats.length }))
    .filter((e) => e.n > 0);
  if (!possibles.length) return null;
  const choix = possibles.find((e) => e.prioritaire) ?? possibles.sort((a, b) => b.n - a.n)[0];
  return { texte: choix.texte(choix.n), criteres: choix.criteres };
}

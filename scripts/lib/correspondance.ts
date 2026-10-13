// Règles partagées : déduction de la carrosserie depuis Wikidata et rapprochement fiches ↔ Wikidata.
import type { Carrosserie, Segment } from "../../src/types.ts";
import type { WdExport, WdModele } from "../fetch-wikidata.ts";
import type { SpecModele } from "../lire-specs.ts";
import { cleModele, idMarque, nomModeleSansMarque } from "./normaliser.ts";

/** Classes Wikidata (P279) -> carrosserie. L'ordre de priorité est donné par PRIORITE. */
const CARROSSERIE_PAR_CLASSE: Record<string, Carrosserie> = {
  Q215601: "pick-up", Q5178058: "pick-up",
  Q193468: "utilitaire", Q2666883: "utilitaire", Q580939: "utilitaire", Q946479: "utilitaire", Q13222551: "utilitaire",
  Q55989: "cabriolet", Q828170: "cabriolet", Q1779003: "cabriolet",
  Q223189: "monospace", Q1762136: "monospace", Q1780748: "monospace", Q1621751: "monospace", Q225600: "monospace",
  Q188886: "break",
  Q192152: "SUV", Q875600: "SUV", Q10863152: "SUV", Q110818657: "SUV", Q8214696: "SUV", Q67326289: "SUV",
  Q115579744: "SUV", Q946596: "SUV",
  Q213853: "coupé", Q274586: "coupé", Q815679: "coupé", Q744620: "coupé", Q1072763: "coupé", Q1463541: "coupé",
  Q504154: "citadine", Q815423: "citadine", Q2704381: "citadine", Q1059437: "citadine", Q360369: "citadine",
  Q609755: "citadine", Q13267846: "citadine", Q48767604: "citadine", Q65042828: "citadine",
  Q190578: "berline", Q946808: "berline", Q1940287: "berline", Q1357619: "berline", Q4010528: "berline",
  Q304895: "berline", Q5581707: "berline", Q13266730: "berline", Q17105090: "berline", Q384127: "berline",
  Q5155305: "berline", Q188475: "berline", Q216762: "berline", Q1580019: "berline", Q1145550: "berline",
  Q504507: "berline",
};
const PRIORITE: Carrosserie[] = ["pick-up", "utilitaire", "cabriolet", "monospace", "break", "SUV", "coupé", "citadine", "berline"];

const SEGMENT_PAR_CLASSE: Record<string, Segment> = {
  Q504154: "A", Q13267846: "A", Q1059437: "A", Q360369: "A", Q609755: "A",
  Q815423: "B", Q2704381: "B", Q48767604: "B", Q8214696: "B", Q110818657: "B", Q1762136: "B",
  Q946808: "C", Q13266730: "C", Q10863152: "C", Q1780748: "C", Q115579744: "C",
  Q4010528: "D", Q5155305: "D",
  Q1357619: "E", Q17105090: "E", Q304895: "E",
  Q5581707: "F", Q188475: "F",
};

/** Classes qui excluent l'élément : concept-cars, voitures de course, prototypes, engins militaires… */
const EXCLUSIONS = new Set([
  "Q850270", "Q972011", "Q673687", "Q1002954", "Q1402386", "Q207977", "Q3755996", "Q649062", "Q474698",
  "Q16948009", "Q739288", "Q936066", "Q741490", "Q39086077", "Q746448", "Q43193", "Q140402273", "Q1147341",
]);

export interface InfosWd {
  exclu: boolean;
  carrosserie: Carrosserie | null;
  segment: Segment | null;
}

export function analyserClasses(wd: WdExport): Map<string, InfosWd> {
  const parId = new Map(wd.modeles.map((m) => [m.qid, m]));
  const resultat = new Map<string, InfosWd>();
  const analyser = (m: WdModele, profondeur = 0): InfosWd => {
    const deja = resultat.get(m.qid);
    if (deja) return deja;
    let exclu = false;
    const carrosseries = new Set<Carrosserie>();
    let segment: Segment | null = null;
    for (const c of m.classes) {
      if (EXCLUSIONS.has(c)) exclu = true;
      if (CARROSSERIE_PAR_CLASSE[c]) carrosseries.add(CARROSSERIE_PAR_CLASSE[c]);
      segment ??= SEGMENT_PAR_CLASSE[c] ?? null;
      // La classe peut être un autre modèle (ex. « Opel Astra G » sous-classe de « Opel Astra ») : on hérite.
      const parent = parId.get(c);
      if (parent && profondeur < 3) {
        const p = analyser(parent, profondeur + 1);
        if (p.carrosserie) carrosseries.add(p.carrosserie);
        segment ??= p.segment;
      }
    }
    if (/concept|prototype|show car/i.test(m.libelle)) exclu = true;
    const infos: InfosWd = { exclu, carrosserie: PRIORITE.find((c) => carrosseries.has(c)) ?? null, segment };
    resultat.set(m.qid, infos);
    return infos;
  };
  for (const m of wd.modeles) analyser(m);
  return resultat;
}

export interface WdResolu extends WdModele {
  marqueId: string;
  marqueNom: string;
  nomCourt: string;
  cle: string;
}

/** Associe à chaque modèle Wikidata sa marque (P1716, sinon constructeur P176) et sa clé de dédoublonnage. */
export function resoudreWikidata(wd: WdExport): WdResolu[] {
  const marques = new Map(wd.marques.map((m) => [m.qid, m]));
  const res: WdResolu[] = [];
  for (const m of wd.modeles) {
    const marque = (m.marqueQid && marques.get(m.marqueQid)) || (m.constructeurQid && marques.get(m.constructeurQid));
    if (!marque) continue;
    const marqueId = idMarque(marque.nom);
    const nomCourt = nomModeleSansMarque(m.libelle, marque.nom);
    if (!nomCourt) continue;
    res.push({ ...m, marqueId, marqueNom: marque.nom, nomCourt, cle: cleModele(marqueId, nomCourt) });
  }
  return res;
}

const ANNEE_COURANTE = new Date().getFullYear();

export function chevauchement(
  a: { anneeDebut: number | null; anneeFin: number | null },
  b: { anneeDebut: number | null; anneeFin: number | null },
): number {
  if (a.anneeDebut === null || b.anneeDebut === null) return 0.5;
  const fin = Math.min(a.anneeFin ?? ANNEE_COURANTE, b.anneeFin ?? ANNEE_COURANTE);
  const debut = Math.max(a.anneeDebut, b.anneeDebut);
  return Math.max(0, fin - debut + 1);
}

/**
 * Rattache chaque modèle Wikidata à au plus une fiche technique : même marque, même nom de modèle
 * (hors génération) et période de production qui se chevauche le plus.
 * Renvoie, pour chaque fiche (index), la liste des modèles Wikidata rattachés, le meilleur en premier.
 */
export function rattacher(specs: SpecModele[], wds: WdResolu[]): Map<number, WdResolu[]> {
  const parCle = new Map<string, number[]>();
  specs.forEach((s, i) => {
    const k = cleModele(idMarque(s.marque), s.nom);
    parCle.set(k, [...(parCle.get(k) ?? []), i]);
  });
  const rattaches = new Map<number, { wd: WdResolu; score: number }[]>();
  for (const w of wds) {
    const candidats = parCle.get(w.cle);
    if (!candidats) continue;
    let meilleur = -1;
    let score = 0;
    for (const i of candidats) {
      const sc = chevauchement(specs[i], w);
      if (sc > score) {
        score = sc;
        meilleur = i;
      }
    }
    if (meilleur >= 0) rattaches.set(meilleur, [...(rattaches.get(meilleur) ?? []), { wd: w, score }]);
  }
  const res = new Map<number, WdResolu[]>();
  for (const [i, l] of rattaches) {
    // On privilégie l'élément le plus proche de la génération décrite (début de production le plus proche).
    const debut = specs[i].anneeDebut ?? 0;
    l.sort((a, b) => b.score - a.score || Math.abs((a.wd.anneeDebut ?? 0) - debut) - Math.abs((b.wd.anneeDebut ?? 0) - debut));
    res.set(i, l.map((x) => x.wd));
  }
  return res;
}

/**
 * Étape 1a — Wikidata (SPARQL)
 * Récupère tous les éléments « modèle d'automobile » (Q3231690) avec :
 * libellé, marque/constructeur, années de production, image (P18) et classes (P279)
 * qui servent à déduire la carrosserie et le segment. Puis les marques (pays, logo P154).
 * Résultat brut : scripts/cache/wikidata.json
 */
import { join } from "node:path";
import { sparql, qid, fichierCommons } from "./lib/sparql.ts";
import { CACHE, ecrireJson } from "./lib/fichiers.ts";

export interface WdModele {
  qid: string;
  libelle: string;
  marqueQid: string | null;
  constructeurQid: string | null;
  anneeDebut: number | null;
  anneeFin: number | null;
  image: string | null;
  classes: string[];
  categorieCommons: string | null;
}

export interface WdMarque {
  qid: string;
  nom: string;
  pays: string | null;
  logo: string | null;
}

export interface WdExport {
  date: string;
  modeles: WdModele[];
  marques: WdMarque[];
  libellesClasses: Record<string, string>;
  logosParNom: Record<string, string>;
}

/**
 * Ne garde que les vrais logos : SVG/PNG, ou photo dont le nom indique un logo/un badge.
 * (Certaines marques, comme Peugeot, ont une photo de voiture en P154.)
 */
const estLogo = (f: string | undefined) => (f && (/\.(svg|png)$/i.test(f) || /logo|badge|emblem|embl[eè]me|wordmark/i.test(f)) ? f : null);

const annee = (d?: string) => (d ? Number(d.slice(0, d.startsWith("-") ? 5 : 4)) || null : null);

/**
 * Années de production écrites dans la description Wikidata, par ex.
 * « modèle d'automobile (2013-2019) », « (2019-) », « commercialisé à partir de 2018 »,
 * « produced from 2008 to 2015 », « 2020–present ».
 */
export function anneesDescription(desc: string | undefined): { debut: number | null; fin: number | null; ouvert: boolean } | null {
  if (!desc) return null;
  const A = "(19[0-9]{2}|20[0-4][0-9])";
  let m = desc.match(new RegExp(`${A}\\s*[-–—]\\s*${A}`));
  if (m) return { debut: Number(m[1]), fin: Number(m[2]), ouvert: false };
  m = desc.match(new RegExp(`${A}\\s*[-–—]\\s*(\\)|present|aujourd|today|$)`, "i"));
  if (m) return { debut: Number(m[1]), fin: null, ouvert: true };
  m = desc.match(new RegExp(`(?:de|from|between)\\s+${A}\\s+(?:à|to|and|until)\\s+${A}`, "i"));
  if (m) return { debut: Number(m[1]), fin: Number(m[2]), ouvert: false };
  m = desc.match(new RegExp(`(?:depuis|à partir de|since|from|introduced in|launched in|lancée? en|présentée? en)\\s+${A}`, "i"));
  if (m) return { debut: Number(m[1]), fin: null, ouvert: false };
  return null;
}

export async function collecterWikidata(): Promise<WdExport> {
  console.log("[wikidata] modèles…");
  const lignes = await sparql(`SELECT ?m ?fr ?en ?descFr ?descEn ?brand ?manu ?start ?end ?incep ?dissol ?image ?cat WHERE {
    ?m wdt:P31 wd:Q3231690 .
    OPTIONAL { ?m rdfs:label ?fr FILTER(lang(?fr)="fr") }
    OPTIONAL { ?m rdfs:label ?en FILTER(lang(?en)="en") }
    OPTIONAL { ?m wdt:P1716 ?brand }
    OPTIONAL { ?m wdt:P176 ?manu }
    OPTIONAL { ?m schema:description ?descFr FILTER(lang(?descFr)="fr") }
    OPTIONAL { ?m schema:description ?descEn FILTER(lang(?descEn)="en") }
    OPTIONAL { { ?m wdt:P2031 ?start } UNION { ?m wdt:P580 ?start } UNION { ?m wdt:P729 ?start } UNION { ?m wdt:P5204 ?start } }
    OPTIONAL { { ?m wdt:P2032 ?end } UNION { ?m wdt:P582 ?end } UNION { ?m wdt:P730 ?end } }
    OPTIONAL { ?m wdt:P571 ?incep }
    OPTIONAL { ?m wdt:P576 ?dissol }
    OPTIONAL { ?m wdt:P18 ?image }
    OPTIONAL { ?m wdt:P373 ?cat }
  }`);

  const modeles = new Map<string, WdModele>();
  for (const l of lignes) {
    const id = qid(l.m);
    if (!id) continue;
    const libelle = l.fr ?? l.en;
    if (!libelle) continue;
    const existant = modeles.get(id);
    const desc = anneesDescription(l.descFr) ?? anneesDescription(l.descEn);
    const debut = annee(l.start) ?? annee(l.incep) ?? desc?.debut ?? null;
    const fin = annee(l.end) ?? annee(l.dissol) ?? desc?.fin ?? null;
    if (!existant) {
      modeles.set(id, {
        qid: id,
        libelle,
        marqueQid: qid(l.brand) ?? null,
        constructeurQid: qid(l.manu) ?? null,
        anneeDebut: debut,
        anneeFin: fin,
        image: fichierCommons(l.image) ?? null,
        classes: [],
        categorieCommons: l.cat ?? null,
      });
    } else {
      // Plusieurs valeurs possibles : on garde la première marque/image, la plus petite année de début
      // et la plus grande année de fin.
      existant.marqueQid ??= qid(l.brand) ?? null;
      existant.constructeurQid ??= qid(l.manu) ?? null;
      existant.image ??= fichierCommons(l.image) ?? null;
      if (debut && (!existant.anneeDebut || debut < existant.anneeDebut)) existant.anneeDebut = debut;
      if (fin && (!existant.anneeFin || fin > existant.anneeFin)) existant.anneeFin = fin;
    }
  }
  console.log(`[wikidata] ${modeles.size} modèles`);

  console.log("[wikidata] classes (P279)…");
  const classes = await sparql(`SELECT ?m ?cls ?clsLabel WHERE {
    ?m wdt:P31 wd:Q3231690 ; wdt:P279 ?cls .
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
  }`);
  const libellesClasses: Record<string, string> = {};
  for (const c of classes) {
    const m = modeles.get(qid(c.m)!);
    const cls = qid(c.cls);
    if (!cls) continue;
    libellesClasses[cls] = c.clsLabel;
    if (m && !m.classes.includes(cls)) m.classes.push(cls);
  }

  console.log("[wikidata] marques…");
  const idsMarques = new Set<string>();
  for (const m of modeles.values()) {
    if (m.marqueQid) idsMarques.add(m.marqueQid);
    if (m.constructeurQid) idsMarques.add(m.constructeurQid);
  }
  const marques = new Map<string, WdMarque>();
  const liste = [...idsMarques];
  for (let i = 0; i < liste.length; i += 400) {
    const valeurs = liste.slice(i, i + 400).map((q) => `wd:${q}`).join(" ");
    const res = await sparql(`SELECT ?b ?fr ?en ?paysLabel ?logo WHERE {
      VALUES ?b { ${valeurs} }
      OPTIONAL { ?b rdfs:label ?fr FILTER(lang(?fr)="fr") }
      OPTIONAL { ?b rdfs:label ?en FILTER(lang(?en)="en") }
      OPTIONAL { { ?b wdt:P17 ?pays } UNION { ?b wdt:P495 ?pays } UNION { ?b wdt:P176 ?c . ?c wdt:P17 ?pays }
        ?pays rdfs:label ?paysLabel FILTER(lang(?paysLabel)="fr") }
      OPTIONAL { ?b wdt:P154 ?logo }
    }`);
    for (const r of res) {
      const id = qid(r.b);
      // Libellé anglais d'abord : en français, Wikidata nomme parfois la marque « Groupe BMW ».
      const nom = r.en ?? r.fr;
      if (!id || !nom) continue;
      const logo = estLogo(fichierCommons(r.logo));
      const e = marques.get(id);
      if (!e) marques.set(id, { qid: id, nom, pays: r.paysLabel ?? null, logo });
      else {
        e.pays ??= r.paysLabel ?? null;
        if (logo && (!e.logo || (/\.svg$/i.test(logo) && !/\.svg$/i.test(e.logo)))) e.logo = logo;
      }
    }
  }

  // Logos manquants : recherche par nom de marque parmi les entreprises et marques ayant un logo (P154).
  const { lireSpecs } = await import("./lire-specs.ts");
  const nomsSansLogo = new Set<string>(lireSpecs().map((s) => s.marque));
  for (const m of marques.values()) if (!m.logo) nomsSansLogo.add(m.nom);
  for (const m of marques.values()) if (m.logo) nomsSansLogo.delete(m.nom);
  const logosParNom: Record<string, string> = {};
  const nomsListe = [...nomsSansLogo];
  for (let i = 0; i < nomsListe.length; i += 60) {
    const valeurs = nomsListe.slice(i, i + 60).map((n) => `${JSON.stringify(n)}@en`).join(" ");
    try {
      const res = await sparql(`SELECT ?l ?logo WHERE {
        VALUES ?l { ${valeurs} }
        ?b rdfs:label ?l ; wdt:P154 ?logo .
        { ?b wdt:P31/wdt:P279* wd:Q4830453 } UNION { ?b wdt:P31/wdt:P279* wd:Q431289 }
      }`);
      for (const r of res) {
        const logo = estLogo(fichierCommons(r.logo));
        if (logo && (!logosParNom[r.l] || /\.svg$/i.test(logo))) logosParNom[r.l] = logo;
      }
    } catch (e) {
      console.warn(`[wikidata] recherche de logos échouée : ${(e as Error).message.slice(0, 120)}`);
    }
  }
  console.log(`[wikidata] ${Object.keys(logosParNom).length} logos retrouvés par nom de marque`);
  console.log(`[wikidata] ${marques.size} marques/constructeurs`);

  const resultat: WdExport = {
    date: new Date().toISOString().slice(0, 10),
    modeles: [...modeles.values()],
    marques: [...marques.values()],
    libellesClasses,
    logosParNom,
  };
  ecrireJson(join(CACHE, "wikidata.json"), resultat);
  return resultat;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await collecterWikidata();
}

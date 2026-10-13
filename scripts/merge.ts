/**
 * Étape 2 — Fusion et dédoublonnage.
 * Entrées : scripts/cache/{wikidata,commons,nhtsa}.json + scripts/specs/*.txt
 * Sorties : public/data/voitures.json, public/data/marques.json, public/data/stats.json
 *
 * Règles :
 * - une fiche technique (specs) est prioritaire ; les éléments Wikidata de même marque + même modèle
 *   (hors suffixe de génération) dont la période de production chevauche la sienne y sont fusionnés
 *   (photo P18, identifiant Wikidata) ;
 * - les autres éléments Wikidata de même marque + même modèle et de périodes qui se chevauchent sont
 *   fusionnés entre eux (modèles sans fiche technique : versions = []) ;
 * - NHTSA vPIC complète la liste des marques et sert de recoupement des modèles (source) ;
 * - aucune valeur n'est inventée : les inconnues restent à null.
 */
import { join } from "node:path";
import { CACHE, SORTIE, ecrireJson, lireJson } from "./lib/fichiers.ts";
import { analyserClasses, chevauchement, rattacher, resoudreWikidata, type WdResolu } from "./lib/correspondance.ts";
import { cle, cleModele, idMarque, nomMarque, slug } from "./lib/normaliser.ts";
import { lireSpecs } from "./lire-specs.ts";
import type { WdExport } from "./fetch-wikidata.ts";
import type { CommonsExport } from "./fetch-commons.ts";
import type { NhtsaExport } from "./fetch-nhtsa.ts";
import type { Marque, Modele, Photo } from "../src/types.ts";

const MAX_PHOTOS = 5;
const PAYS: Record<string, string> = {
  "république populaire de Chine": "Chine",
  "États-Unis d'Amérique": "États-Unis",
  "Royaume-Uni de Grande-Bretagne et d'Irlande du Nord": "Royaume-Uni",
  "république de Chine": "Taïwan",
};

export function fusionner() {
  const wd = lireJson<WdExport>(join(CACHE, "wikidata.json"));
  const commons = lireJson<CommonsExport>(join(CACHE, "commons.json"));
  const nhtsa = lireJson<NhtsaExport>(join(CACHE, "nhtsa.json"), { date: "", marques: [] });
  const specs = lireSpecs();
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const infos = analyserClasses(wd);
  const resolus = resoudreWikidata(wd);
  const rattaches = rattacher(specs, resolus);
  const rattachesQids = new Set([...rattaches.values()].flat().map((w) => w.qid));

  const photo = (fichier: string | null): Photo | null => (fichier ? commons.fichiers[fichier] ?? null : null);
  const ajouterPhotos = (cible: Photo[], sources: (Photo | null)[]) => {
    for (const p of sources) {
      if (p && cible.length < MAX_PHOTOS && !cible.some((x) => x.url === p.url)) cible.push(p);
    }
  };

  const modeles: Modele[] = [];
  const ids = new Set<string>();
  const nouvelId = (base: string) => {
    let id = slug(base);
    for (let n = 2; ids.has(id); n++) id = `${slug(base)}-${n}`;
    ids.add(id);
    return id;
  };
  const marquesUtilisees = new Map<string, string>(); // id -> nom affiché

  // NHTSA : index des modèles par marque pour le recoupement.
  const nhtsaParMarque = new Map<string, Set<string>>();
  for (const m of nhtsa.marques) {
    const id = idMarque(m.nom);
    const s = nhtsaParMarque.get(id) ?? new Set<string>();
    for (const mod of m.modeles) s.add(cleModele(id, mod.nom));
    nhtsaParMarque.set(id, s);
  }
  const sources = (base: string[], marqueId: string, cleM: string) => {
    if (nhtsaParMarque.get(marqueId)?.has(cleM)) base.push("NHTSA vPIC");
    return base.join(" ; ");
  };

  // 1. Fiches techniques (+ Wikidata/Commons rattachés)
  specs.forEach((s, i) => {
    const marqueId = idMarque(s.marque);
    marquesUtilisees.set(marqueId, s.marque);
    const wds = rattaches.get(i) ?? [];
    const photos: Photo[] = [];
    // Photo Wikidata seulement si l'élément décrit cette génération (et non un modèle plus ancien).
    ajouterPhotos(
      photos,
      wds.filter((w) => s.anneeDebut === null || (w.anneeDebut !== null && w.anneeDebut >= s.anneeDebut - 1)).map((w) => photo(w.image)),
    );
    ajouterPhotos(photos, commons.galeries[`${marqueId}::${cle(s.nom)}`] ?? []);
    // Dernier recours : l'image Wikidata du modèle, si cette fiche en est la génération la plus récente.
    const plusRecente = !specs.some(
      (o) => o !== s && cleModele(idMarque(o.marque), o.nom) === cleModele(marqueId, s.nom) && (o.anneeDebut ?? 0) > (s.anneeDebut ?? 0),
    );
    if (!photos.length && plusRecente) ajouterPhotos(photos, wds.slice(0, 1).map((w) => photo(w.image)));
    const src = ["Caractéristiques : connaissances (catalogues constructeurs, valeurs WLTP, prix indicatifs)"];
    if (wds.length) src.push(`Wikidata ${wds.map((w) => w.qid).join(", ")}`);
    if (photos.length) src.push("photos Wikimedia Commons");
    modeles.push({
      id: nouvelId(`${marqueId}-${s.nom}${s.anneeFin ? `-${s.anneeDebut ?? ""}` : ""}`),
      marqueId,
      nom: s.nom,
      anneeDebut: s.anneeDebut,
      anneeFin: s.anneeFin,
      carrosserie: s.carrosserie,
      segment: s.segment ?? wds.map((w) => infos.get(w.qid)?.segment).find(Boolean) ?? null,
      photos,
      couleursDisponibles: s.couleurs,
      versions: s.versions,
      source: sources(src, marqueId, cleModele(marqueId, s.nom)),
      dateMiseAJour: aujourdhui,
    });
  });

  // 2. Modèles Wikidata seuls : regroupement par marque + modèle, puis par périodes qui se chevauchent.
  const groupes = new Map<string, WdResolu[]>();
  for (const w of resolus) {
    const inf = infos.get(w.qid);
    if (rattachesQids.has(w.qid) || !inf || inf.exclu || !inf.carrosserie) continue;
    groupes.set(w.cle, [...(groupes.get(w.cle) ?? []), w]);
  }
  let wdSeuls = 0;
  for (const groupe of groupes.values()) {
    groupe.sort((a, b) => (a.anneeDebut ?? 9999) - (b.anneeDebut ?? 9999));
    const grappes: WdResolu[][] = [];
    for (const w of groupe) {
      const g = grappes.find((gr) =>
        gr.some((x) => x.anneeDebut === null || w.anneeDebut === null || chevauchement(x, w) >= 1),
      );
      if (g) g.push(w);
      else grappes.push([w]);
    }
    for (const g of grappes) {
      const ref = [...g].sort((a, b) => a.nomCourt.length - b.nomCourt.length)[0];
      const debuts = g.map((x) => x.anneeDebut).filter((x): x is number => x !== null);
      const fins = g.map((x) => x.anneeFin);
      const photos: Photo[] = [];
      ajouterPhotos(photos, g.map((x) => photo(x.image)));
      const inf = infos.get(ref.qid)!;
      marquesUtilisees.set(ref.marqueId, marquesUtilisees.get(ref.marqueId) ?? ref.marqueNom);
      wdSeuls++;
      modeles.push({
        id: nouvelId(`${ref.marqueId}-${ref.nomCourt}${debuts.length ? `-${Math.min(...debuts)}` : ""}`),
        marqueId: ref.marqueId,
        nom: ref.nomCourt,
        anneeDebut: debuts.length ? Math.min(...debuts) : null,
        anneeFin: fins.some((f) => f === null) ? null : Math.max(...(fins as number[])),
        carrosserie: inf.carrosserie!,
        segment: g.map((x) => infos.get(x.qid)?.segment).find(Boolean) ?? null,
        photos,
        couleursDisponibles: [],
        versions: [],
        source: sources(
          [`Wikidata ${g.map((x) => x.qid).join(", ")}`, ...(photos.length ? ["photos Wikimedia Commons"] : [])],
          ref.marqueId,
          ref.cle,
        ),
        dateMiseAJour: aujourdhui,
      });
    }
  }

  // Corrige les années de fin incohérentes venant de Wikidata (fin < début).
  for (const m of modeles) if (m.anneeDebut && m.anneeFin && m.anneeFin < m.anneeDebut) m.anneeFin = null;

  // 3. Marques : Wikidata (pays, logo) + fiches + NHTSA.
  const wdMarques = new Map<string, { pays: string | null; logo: string | null; nom: string; exact: boolean }>();
  for (const b of wd.marques) {
    const id = idMarque(b.nom);
    // Une entrée dont le nom correspond exactement à la marque (« Renault ») passe avant un alias (« Renault Group »).
    const exact = slug(b.nom) === id;
    const logo = b.logo && commons.logos[b.logo] ? commons.logos[b.logo]! : null;
    const e = wdMarques.get(id);
    if (!e) wdMarques.set(id, { pays: b.pays, logo, nom: b.nom, exact });
    else {
      e.pays ??= b.pays;
      if (logo && (!e.logo || (exact && !e.exact))) {
        e.logo = logo;
        e.exact = exact;
      }
    }
  }
  const titre = (s: string) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  let marquesNhtsaSeules = 0;
  for (const m of nhtsa.marques) {
    if (!m.types.includes("car")) continue;
    const id = idMarque(m.nom);
    if (!marquesUtilisees.has(id)) {
      marquesUtilisees.set(id, titre(nomMarque(m.nom)));
      marquesNhtsaSeules++;
    }
  }
  const nbModelesParMarque = new Map<string, number>();
  for (const m of modeles) nbModelesParMarque.set(m.marqueId, (nbModelesParMarque.get(m.marqueId) ?? 0) + 1);
  const logoParNom = new Map<string, string>();
  for (const [nom, f] of Object.entries(wd.logosParNom ?? {})) if (commons.logos[f]) logoParNom.set(idMarque(nom), commons.logos[f]!);
  const marques: Marque[] = [...marquesUtilisees]
    .map(([id, nom]) => {
      const w = wdMarques.get(id);
      return {
        id,
        nom,
        pays: PAYS[w?.pays ?? ""] ?? w?.pays ?? "Inconnu",
        // Logo de la marque elle-même d'abord, logo du groupe (« BMW Group ») en dernier recours.
        logoUrl:
          (w?.exact && !/group/i.test(w.logo ?? "") ? w.logo : null) ??
          commons.logosParMarque?.[id] ??
          w?.logo ??
          logoParNom.get(id) ??
          null,
      };
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  // Tri : modèles avec fiche technique d'abord, puis par marque et nom.
  modeles.sort(
    (a, b) =>
      Number(b.versions.length > 0) - Number(a.versions.length > 0) ||
      a.marqueId.localeCompare(b.marqueId) ||
      a.nom.localeCompare(b.nom, "fr"),
  );

  const stats = {
    dateMiseAJour: aujourdhui,
    marques: marques.length,
    marquesAvecModeles: marques.filter((m) => nbModelesParMarque.has(m.id)).length,
    marquesNhtsaSeules,
    modeles: modeles.length,
    modelesAvecFiche: modeles.filter((m) => m.versions.length).length,
    modelesWikidataSeuls: wdSeuls,
    versions: modeles.reduce((s, m) => s + m.versions.length, 0),
    modelesAvecPhoto: modeles.filter((m) => m.photos.length).length,
    fichesAvecPhoto: modeles.filter((m) => m.versions.length && m.photos.length).length,
    photos: modeles.reduce((s, m) => s + m.photos.length, 0),
    marquesAvecLogo: marques.filter((m) => m.logoUrl).length,
  };
  ecrireJson(join(SORTIE, "voitures.json"), modeles);
  ecrireJson(join(SORTIE, "marques.json"), marques);
  ecrireJson(join(SORTIE, "stats.json"), stats, 2);
  console.log("[fusion] résultat :", stats);
  return stats;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fusionner();
}

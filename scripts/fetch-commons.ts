/**
 * Étape 1c — Wikimedia Commons (https://commons.wikimedia.org/w/api.php)
 * - métadonnées (auteur, licence, miniature) des images P18 des modèles et P154 des logos ;
 * - recherche de photos complémentaires pour chaque fiche technique (galerie).
 * Seules les photos sous licence libre sont conservées.
 * Résultat brut : scripts/cache/commons.json
 */
import { join } from "node:path";
import { fetchJson, pool } from "./lib/http.ts";
import { CACHE, ecrireJson, lireJson } from "./lib/fichiers.ts";
import { analyserClasses, rattacher, resoudreWikidata } from "./lib/correspondance.ts";
import { cle, idMarque, sansAccents } from "./lib/normaliser.ts";
import { lireSpecs, type SpecModele } from "./lire-specs.ts";
import type { WdExport } from "./fetch-wikidata.ts";
import type { Photo } from "../src/types.ts";

const API = "https://commons.wikimedia.org/w/api.php";
const LARGEUR = 800;

export interface CommonsExport {
  date: string;
  fichiers: Record<string, Photo | null>;
  logos: Record<string, string | null>;
  galeries: Record<string, Photo[]>;
}

interface PageImage {
  title: string;
  imageinfo?: {
    thumburl?: string;
    url: string;
    descriptionurl: string;
    extmetadata?: Record<string, { value: string }>;
  }[];
}

const LICENCE_LIBRE = /^(cc[ -]|cc0|cc-by|public domain|pd|gfdl|fal|attribution|no restrictions|copyrighted free use|free art)/i;

const texteBrut = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sansSuivi = (url: string) => url.replace(/\?utm_source=.*$/, "");

export function versPhoto(p: PageImage): Photo | null {
  const ii = p.imageinfo?.[0];
  if (!ii) return null;
  const meta = ii.extmetadata ?? {};
  const licence = texteBrut(meta.LicenseShortName?.value ?? "");
  if (!licence || !LICENCE_LIBRE.test(licence)) return null;
  const auteur = texteBrut(meta.Artist?.value ?? "") || "Auteur inconnu (voir la page Commons)";
  return { url: sansSuivi(ii.thumburl ?? ii.url), auteur: auteur.slice(0, 160), licence, page: ii.descriptionurl };
}

async function infosFichiers(noms: string[], largeur = LARGEUR): Promise<Map<string, Photo | null>> {
  const res = new Map<string, Photo | null>();
  const paquets: string[][] = [];
  for (let i = 0; i < noms.length; i += 50) paquets.push(noms.slice(i, i + 50));
  let faits = 0;
  await pool(paquets, 3, async (paquet) => {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: String(largeur),
      iiextmetadatafilter: "Artist|LicenseShortName",
      titles: paquet.map((n) => `File:${n}`).join("|"),
    });
    const r = await fetchJson<{ query?: { pages: PageImage[]; normalized?: { from: string; to: string }[] } }>(`${API}?${params}`);
    const normalises = new Map((r.query?.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of r.query?.pages ?? []) {
      const titre = normalises.get(p.title) ?? p.title;
      res.set(titre.replace(/^File:/, ""), versPhoto(p));
    }
    if (++faits % 20 === 0) console.log(`[commons] ${faits * 50}/${noms.length} fichiers`);
  });
  return res;
}

/** Termes de recherche anglais pour les noms français (« Série 3 » -> « 3 Series », « Classe A » -> « A-Class »). */
const ALIAS_RECHERCHE: Record<string, string> = {
  "Classe C Break": "C-Class Estate",
  "Classe E Break": "E-Class Estate",
  "Classe CLE Cabriolet": "CLE Cabriolet",
  "Classe CLE": "CLE Coupé",
  "A3 Berline": "A3 Sedan",
  "Golf SW": "Golf Variant",
  "Série 3 Touring": "3 Series Touring",
  "Série 5 Touring": "5 Series Touring",
  "Twingo E-Tech électrique": "Twingo E-Tech",
  "Mazda2 Hybrid": "Mazda2 Hybrid",
};

function termeRecherche(s: SpecModele): string {
  const nom = (ALIAS_RECHERCHE[s.nom] ?? s.nom)
    .replace(/^Série (\d)/, "$1 Series")
    .replace(/^Classe ([A-Z]+)/, "$1-Class")
    .replace(/\s*\(.*\)$/, "")
    .replace(/\s+(I|II|III|IV|V|VI|VII)$/, "");
  // « DS DS 3 », « Polestar Polestar 2 », « Microlino Microlino » : pas de double préfixe.
  const marqueEnTete = cle(nom).startsWith(cle(s.marque.split(" ")[0]));
  return marqueEnTete ? nom : `${s.marque} ${nom}`;
}

const EXCLURE_TITRE = /\b(interior|int[ée]rieur|innenraum|cockpit|dashboard|armaturenbrett|engine|moteur|motorraum|badge|logo|emblem|wheel|felge|seats|sitze|kofferraum|trunk|boot|steering|detail|taillight|tail light|scale model|toy|miniature|modell?auto|diecast|lego|powertrain|cutaway|wrc|rally|rallye|race|racing|gt3|gt4|police|polizei|patrol|military|militär|militärischer|crash|accident|unfall|wreck)\b/i;

const VARIANTE = /^(?:\+|(?:st|cross|verso|sedan|saloon|sportback|touring|sw|combi|estate|break|wagon|variant|cabrio|cabriolet|convertible|roadster|coupe|coupé|x|sport ?tourer|sportstourer|sports tourer|shooting|van|cargo|grand|life|space|aircross|crossback|allroad|avant|limousine|gran|active|xl|l)\b)/i;

export async function rechercherGalerie(s: SpecModele, dejaVus: Set<string>, freres: string[]): Promise<Photo[]> {
  const terme = termeRecherche(s);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `intitle:"${terme}" filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "50",
    // Pour un modèle encore produit, les fichiers les plus récents montrent la génération actuelle.
    ...(s.anneeFin === null ? { gsrsort: "create_timestamp_desc" } : {}),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(LARGEUR),
    iiextmetadatafilter: "Artist|LicenseShortName",
  });
  const r = await fetchJson<{ query?: { pages: (PageImage & { index?: number })[] } }>(`${API}?${params}`);
  const pages = (r.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const cleCherchee = cle(terme);
  const debut = s.anneeDebut ?? 0;
  const fin = s.anneeFin ?? 9999;
  const candidats: { photo: Photo; bonus: number }[] = [];
  for (const p of pages) {
    const titre = p.title.replace(/^File:/, "");
    if (dejaVus.has(titre) || EXCLURE_TITRE.test(titre) || !cle(titre).includes(cleCherchee)) continue;
    // Écarte les variantes (« Yaris Cross » pour « Yaris », « 308 SW » pour « 308 ») et les générations nommées.
    if (freres.some((f) => cle(titre).includes(f))) continue;
    const idx = sansAccents(titre).toLowerCase().indexOf(sansAccents(terme).toLowerCase());
    if (idx >= 0 && VARIANTE.test(titre.slice(idx + terme.length).replace(/^[\s_,-]+/, "")) && !VARIANTE.test(s.nom.split(" ").pop() ?? "")) continue;
    if (/\b(mk|mark)\s?[0-9ivx]+\b/i.test(titre)) continue;
    // Pour éviter d'illustrer une autre génération, le titre doit contenir une année comprise dans la
    // période de production (année-modèle ou date de prise de vue) et aucune année antérieure.
    const annees = [...titre.matchAll(/(?<!\d)(19[5-9]\d|20[0-3]\d)(?!\d)/g)].map((m) => Number(m[1]));
    if (s.anneeDebut !== null) {
      if (!annees.length || annees.some((a) => a < debut) || !annees.some((a) => a <= fin + 1)) continue;
    }
    const photo = versPhoto(p);
    if (photo) candidats.push({ photo, bonus: 0 });
  }
  return candidats.slice(0, 3).map((c) => c.photo);
}

export async function collecterCommons(): Promise<CommonsExport> {
  const wd = lireJson<WdExport>(join(CACHE, "wikidata.json"));
  const specs = lireSpecs();
  const infos = analyserClasses(wd);
  const resolus = resoudreWikidata(wd);
  const rattaches = rattacher(specs, resolus);
  const rattachesQids = new Set([...rattaches.values()].flat().map((w) => w.qid));

  // Images utiles : modèles rattachés à une fiche ou dont la carrosserie est connue.
  const noms = new Set<string>();
  for (const w of resolus) {
    const i = infos.get(w.qid);
    if (w.image && (rattachesQids.has(w.qid) || (i && !i.exclu && i.carrosserie))) noms.add(w.image);
  }
  console.log(`[commons] ${noms.size} images de modèles à documenter`);
  const fichiers = await infosFichiers([...noms]);

  const logosNoms = [...new Set(wd.marques.map((m) => m.logo).filter((l): l is string => !!l))];
  console.log(`[commons] ${logosNoms.length} logos`);
  const logosInfos = await infosFichiers(logosNoms, 120);
  const logos: Record<string, string | null> = {};
  for (const [n, p] of logosInfos) logos[n] = p?.url ?? null;

  console.log(`[commons] recherche de galeries pour ${specs.length} fiches…`);
  const galeries: Record<string, Photo[]> = {};
  let faits = 0;
  const cles = specs.map((s) => cle(termeRecherche(s)));
  await pool(specs, 2, async (s, i) => {
    const vus = new Set((rattaches.get(i) ?? []).map((w) => w.image).filter((x): x is string => !!x));
    const freres = cles.filter((c, j) => j !== i && c.length > cles[i].length && c.startsWith(cles[i]));
    try {
      galeries[`${idMarque(s.marque)}::${cle(s.nom)}`] = await rechercherGalerie(s, vus, freres);
    } catch (e) {
      console.warn(`[commons] recherche échouée pour ${s.marque} ${s.nom} : ${(e as Error).message}`);
    }
    if (++faits % 50 === 0) console.log(`[commons] ${faits}/${specs.length} recherches`);
  });

  const resultat: CommonsExport = {
    date: new Date().toISOString().slice(0, 10),
    fichiers: Object.fromEntries(fichiers),
    logos,
    galeries,
  };
  ecrireJson(join(CACHE, "commons.json"), resultat);
  const ok = [...fichiers.values()].filter(Boolean).length;
  console.log(`[commons] ${ok}/${fichiers.size} images sous licence libre, ${Object.values(galeries).flat().length} photos de galerie`);
  return resultat;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await collecterCommons();
}

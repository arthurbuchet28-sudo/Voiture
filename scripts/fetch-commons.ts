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
  /** Logos trouvés directement sur Commons (« Peugeot logo.svg ») pour les marques des fiches. */
  logosParMarque?: Record<string, string>;
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
// Termes de recherche alternatifs (noms anglais/allemands utilisés dans les titres Commons).
const ALIAS_RECHERCHE: Record<string, string[]> = {
  "Classe C Break": ["C-Class Estate", "C-Klasse T-Modell", "C-Class Wagon"],
  "Classe E Break": ["E-Class Estate", "E-Klasse T-Modell", "E-Class Wagon"],
  "Classe CLE Cabriolet": ["CLE Cabriolet"],
  "Classe CLE": ["CLE Coupé", "CLE Coupe", "CLE"],
  "CLA Shooting Brake": ["CLA Shooting Brake"],
  "GLC Coupé": ["GLC Coupé", "GLC Coupe"],
  "A3 Berline": ["A3 Sedan", "A3 Limousine"],
  "A4 Berline": ["A4 Limousine", "A4 Sedan", "A4"],
  "A6": ["A6 Limousine", "A6 Sedan", "A6"],
  "A6 Sportback e-tron": ["A6 Sportback e-tron", "A6 e-tron"],
  "A3 Sportback 8V": ["A3 Sportback", "A3 8V"],
  "Série 2 Gran Coupé": ["2 Series Gran Coupé", "2 Series Gran Coupe", "2er Gran Coupé"],
  "Golf SW": ["Golf Variant"],
  "Leon Sportstourer": ["Leon Sportstourer", "Leon ST"],
  "Astra Sports Tourer": ["Astra Sports Tourer"],
  "Focus SW": ["Focus Turnier", "Focus Estate", "Focus Wagon"],
  "i30 SW": ["i30 Kombi", "i30 Wagon", "i30 Estate"],
  "Mégane IV Estate": ["Megane Estate", "Mégane Estate", "Megane Grandtour"],
  "Twingo E-Tech électrique": ["Twingo E-Tech", "Twingo"],
  "Scenic E-Tech electric": ["Scenic E-Tech", "Scénic E-Tech"],
  "Mazda2 Hybrid": ["Mazda2 Hybrid"],
  "GR Supra": ["GR Supra", "Supra"],
  "Proace City Verso": ["Proace City Verso", "Proace City"],
  "Tourneo Courier": ["Tourneo Courier"],
  "Grand C4 SpaceTourer": ["Grand C4 SpaceTourer", "C4 SpaceTourer"],
  "Rocks Electric": ["Rocks-e", "Rocks Electric"],
  "N°8": ["N°8", "No8", "N8"],
  "DS 3": ["DS 3", "DS3"],
  "Range Rover": ["Range Rover L460", "Range Rover (L460)", "Range Rover"],
  Ioniq: ["Ioniq Hybrid", "Ioniq Electric", "Ioniq"],
};

function termesRecherche(s: SpecModele): string[] {
  return (ALIAS_RECHERCHE[s.nom] ?? [s.nom]).map((brut) => {
    const nom = brut
      .replace(/^Série (\d)/, "$1 Series")
      .replace(/^Classe ([A-Z]+)/, "$1-Class")
      .replace(/\s*\(.*\)$/, "")
      .replace(/\s+(I|II|III|IV|V|VI|VII)$/, "");
    // « DS DS 3 », « Polestar Polestar 2 », « Microlino Microlino » : pas de double préfixe.
    const marqueEnTete = cle(nom).startsWith(cle(s.marque.split(" ")[0]));
    return marqueEnTete ? nom : `${s.marque} ${nom}`;
  });
}
const termeRecherche = (s: SpecModele) => termesRecherche(s)[0];

const EXCLURE_TITRE = /\b(interior|int[ée]rieur|innenraum|cockpit|dashboard|armaturenbrett|engine|moteur|motorraum|badge|logo|emblem|wheel|felge|seats|sitze|kofferraum|trunk|boot|steering|detail|taillight|tail light|scale model|toy|miniature|modell?auto|diecast|lego|powertrain|cutaway|wrc|rally|rallye|race|racing|gt3|gt4|police|polizei|patrol|military|militär|militärischer|crash|accident|unfall|wreck|concept|prototype|studie|study|show car)\b/i;

const VARIANTE = /^(?:\+|(?:st|cross|verso|sedan|saloon|sportback|touring|sw|combi|estate|break|wagon|variant|cabrio|cabriolet|convertible|roadster|coupe|coupé|x|sport ?tourer|sportstourer|sports tourer|shooting|van|cargo|grand|life|space|aircross|crossback|allroad|avant|limousine|gran|active|xl|l)\b)/i;

async function chercherTitres(terme: string, recents: boolean) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `intitle:"${terme}" filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "50",
    // Pour un modèle encore produit, les fichiers les plus récents montrent la génération actuelle.
    ...(recents ? { gsrsort: "create_timestamp_desc" } : {}),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(LARGEUR),
    iiextmetadatafilter: "Artist|LicenseShortName",
  });
  const r = await fetchJson<{ query?: { pages: (PageImage & { index?: number })[] } }>(`${API}?${params}`);
  return (r.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

export async function rechercherGalerie(s: SpecModele, dejaVus: Set<string>, freres: string[]): Promise<Photo[]> {
  // Une génération est souvent présentée l'année précédant sa commercialisation.
  const debut = (s.anneeDebut ?? 0) - 1;
  const fin = s.anneeFin ?? 9999;
  for (const terme of termesRecherche(s)) {
    const pages = await chercherTitres(terme, s.anneeFin === null);
    const cleCherchee = cle(terme);
    const retenus: { photo: Photo; annee: boolean }[] = [];
    for (const p of pages) {
      const titre = p.title.replace(/^File:/, "");
      if (dejaVus.has(titre) || EXCLURE_TITRE.test(titre) || !cle(titre).includes(cleCherchee)) continue;
      // Écarte les variantes (« Yaris Cross » pour « Yaris », « 308 SW » pour « 308 ») et les générations nommées.
      if (freres.some((f) => cle(titre).includes(f))) continue;
      const idx = sansAccents(titre).toLowerCase().indexOf(sansAccents(terme).toLowerCase());
      if (idx >= 0 && VARIANTE.test(titre.slice(idx + terme.length).replace(/^[\s_,-]+/, "")) && !VARIANTE.test(s.nom.split(" ").pop() ?? "")) continue;
      if (/\b(mk|mark)\s?[0-9ivx]+\b/i.test(titre)) continue;
      // « (3rd generation) » : génération nommée qu'on ne sait pas rapprocher de la fiche.
      if (/\b(\d+(st|nd|rd|th)|first|second|third|fourth|fifth|sixth)[\s_-]+generation\b/i.test(titre)) continue;
      // Pour éviter d'illustrer une autre génération : aucune année antérieure à la période de production,
      // et de préférence une année comprise dans cette période (année-modèle ou date de prise de vue).
      const annees = [...titre.matchAll(/(?<!\d)(19[5-9]\d|20[0-3]\d)(?!\d)/g)].map((m) => Number(m[1]));
      if (s.anneeDebut !== null && annees.some((a) => a < debut)) continue;
      const dansPeriode = annees.some((a) => a >= debut && a <= fin + 1);
      if (s.anneeDebut !== null && annees.length && !dansPeriode) continue;
      const photo = versPhoto(p);
      if (photo) retenus.push({ photo, annee: dansPeriode || s.anneeDebut === null });
    }
    // Seules les photos datées dans la période sont retenues pour les modèles datés :
    // une silhouette vaut mieux qu'une photo d'une autre génération.
    const choix = retenus.filter((r) => r.annee);
    if (choix.length) return choix.slice(0, 3).map((c) => c.photo);
  }
  return [];
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

  const logosNoms = [
    ...new Set([...wd.marques.map((m) => m.logo), ...Object.values(wd.logosParNom ?? {})].filter((l): l is string => !!l)),
  ];
  console.log(`[commons] ${logosNoms.length} logos`);
  const logosInfos = await infosFichiers(logosNoms, 120);
  const logos: Record<string, string | null> = {};
  for (const [n, p] of logosInfos) logos[n] = p?.url ?? null;

  // Logos des marques des fiches cherchés par nom de fichier usuel sur Commons (sous licence libre uniquement).
  const marquesFiches = [...new Set(specs.map((s) => s.marque))];
  const candidatsLogo = new Map<string, string[]>();
  for (const m of marquesFiches) candidatsLogo.set(m, [`${m} logo.svg`, `${m} Logo.svg`, `Logo ${m}.svg`, `${m} logo.png`]);
  const infosLogos = await infosFichiers([...candidatsLogo.values()].flat(), 120);
  const logosParMarque: Record<string, string> = {};
  for (const [m, fichiers] of candidatsLogo) {
    const trouve = fichiers.map((f) => infosLogos.get(f)).find((p) => p);
    if (trouve) logosParMarque[idMarque(m)] = trouve.url;
  }
  console.log(`[commons] ${Object.keys(logosParMarque).length} logos trouvés par nom de fichier`);

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
    logosParMarque,
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

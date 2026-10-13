// Fonctions de normalisation utilisées pour le dédoublonnage marque + modèle.

export function sansAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function slug(s: string): string {
  return sansAccents(s)
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Clé de comparaison : minuscules, sans accents ni ponctuation ni espaces. */
export function cle(s: string): string {
  return sansAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Alias de marques : différentes graphies pointant vers le même identifiant. */
const ALIAS_MARQUES: Record<string, string> = {
  mercedes: "mercedes-benz",
  "mercedes-amg": "mercedes-benz",
  vw: "volkswagen",
  "volkswagen-passenger-cars": "volkswagen",
  citroen: "citroen",
  "ds-automobiles": "ds",
  "alfa-romeo-automobiles": "alfa-romeo",
  "land-rover": "land-rover",
  "range-rover": "land-rover",
  "mini-bmw": "mini",
  "rolls-royce-motor-cars": "rolls-royce",
  "bentley-motors": "bentley",
  "aston-martin-lagonda": "aston-martin",
  "lamborghini-automobili": "lamborghini",
  "automobili-lamborghini": "lamborghini",
  "ferrari-s-p-a": "ferrari",
  "maserati-s-p-a": "maserati",
  "tesla-inc": "tesla",
  "tesla-motors": "tesla",
  "byd-auto": "byd",
  "byd-company": "byd",
  "mg-motor": "mg",
  "mg-cars": "mg",
  "mg-motor-uk": "mg",
  "ssangyong-motor": "ssangyong",
  "kg-mobility": "ssangyong",
  "ford-motor-company": "ford",
  "ford-of-europe": "ford",
  "toyota-motor-corporation": "toyota",
  "honda-motor-company": "honda",
  "nissan-motor": "nissan",
  "nissan-motor-company": "nissan",
  "mazda-motor-corporation": "mazda",
  "hyundai-motor-company": "hyundai",
  "kia-motors": "kia",
  "kia-corporation": "kia",
  "renault-group": "renault",
  "groupe-renault": "renault",
  "automobiles-peugeot": "peugeot",
  "automobiles-citroen": "citroen",
  "skoda-auto": "skoda",
  "seat-s-a": "seat",
  "dacia-automobile": "dacia",
  "automobile-dacia": "dacia",
  "volvo-cars": "volvo",
  "jaguar-cars": "jaguar",
  "jeep-brand": "jeep",
  "fiat-automobiles": "fiat",
  "lancia-automobiles": "lancia",
  "suzuki-motor-corporation": "suzuki",
  "mitsubishi-motors": "mitsubishi",
  "subaru-corporation": "subaru",
  "general-motors": "general-motors",
  "chevrolet-motor-division": "chevrolet",
  "porsche-ag": "porsche",
  "dr-ing-h-c-f-porsche-ag": "porsche",
  "audi-ag": "audi",
  "bmw-ag": "bmw",
  "opel-automobile": "opel",
  "adam-opel": "opel",
  "smart-automobile": "smart",
  "polestar-automotive": "polestar",
  "lynk-co": "lynk-co",
  "lynk-and-co": "lynk-co",
  "lynk-et-co": "lynk-co",
  "alpine-cars": "alpine",
  "cupra-brand": "cupra",
  "xpeng-motors": "xpeng",
  "leapmotor-technology": "leapmotor",
  "zhejiang-leapmotor-technology": "leapmotor",
};

/** Noms où « Motors », « Group »… font partie de la marque elle-même. */
const NOMS_COMPOSES = new Set(["general-motors", "american-motors-corporation", "british-motor-corporation", "w-motors", "abc-motors", "gta-motor"]);
const SUFFIXE_SOCIETE =
  /[\s,]+(motors?(\s+(company|corporation|co\.?))?|motor\s+company(\s+limited)?|automobiles?(\s+technology)?(\s+co\.?,?\s+ltd\.?)?|automotive|car\s+company|group|company(\s+limited)?|corporation|limited|ltd\.?|inc\.?|ag|s\.?p\.?a\.?|gmbh|passenger\s+vehicles|\(automobile\))$/i;

/** Nom de marque sans forme juridique : « Lincoln Motor Company » -> « Lincoln », « Nio Inc. » -> « Nio ». */
export function nomMarque(nom: string): string {
  if (NOMS_COMPOSES.has(slug(nom))) return nom;
  let n = nom.trim();
  for (let i = 0; i < 3; i++) {
    const court = n.replace(SUFFIXE_SOCIETE, "").trim();
    if (court.length < 2 || court === n) break;
    n = court;
  }
  return n;
}

export function idMarque(nom: string): string {
  const s = slug(nom);
  if (ALIAS_MARQUES[s]) return ALIAS_MARQUES[s];
  const n = slug(nomMarque(nom));
  return ALIAS_MARQUES[n] ?? n;
}

/**
 * Retire le nom de la marque en tête du nom de modèle ("Peugeot 208" -> "208")
 * et les suffixes de génération pour la clé de dédoublonnage.
 */
export function nomModeleSansMarque(nomModele: string, nomMarque: string): string {
  const n = nomModele.trim();
  const variantes = [nomMarque, nomMarque.replace(/-/g, " "), nomMarque.split(/[\s-]/)[0]];
  if (/^mercedes/i.test(nomMarque)) variantes.push("Mercedes-Benz", "Mercedes Benz", "Mercedes");
  if (/^volkswagen/i.test(nomMarque)) variantes.push("VW");
  for (const v of variantes.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`^${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s-]+`, "i");
    if (re.test(n)) return n.replace(re, "").trim();
  }
  return n;
}

const GENERATION = /\s+(\(([^)]*)\)|[IVX]+|Mk\s?[IVX0-9]+|Mark\s?[IVX0-9]+|\d+(?:e|re|ème|th|nd|rd|st)\s+g[ée]n[ée]ration|phase\s+\d)$/i;

/** Clé de dédoublonnage d'un modèle (sans la génération). */
export function cleModele(marqueId: string, nomModele: string): string {
  let n = nomModele;
  for (let i = 0; i < 3; i++) n = n.replace(GENERATION, "");
  return `${marqueId}::${cle(n)}`;
}

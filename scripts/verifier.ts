/**
 * Contrôle de cohérence des fiches techniques (scripts/specs/*.txt).
 * Ne corrige rien : signale les valeurs suspectes à vérifier à la main.
 *   npm run data:verifier            (code de sortie 1 s'il y a des erreurs)
 */
import { lireSpecs, type SpecModele } from "./lire-specs.ts";
import type { Version } from "../src/types.ts";

type Niveau = "erreur" | "alerte";
interface Probleme {
  niveau: Niveau;
  ou: string;
  message: string;
}

// CO2 (g/km) émis par litre consommé aux 100 km, selon le carburant (facteurs usuels).
const CO2_PAR_LITRE: Partial<Record<Version["energie"], number>> = {
  essence: 23.4,
  hybride: 23.4,
  diesel: 26.4,
  GPL: 16.5,
  E85: 16.0,
};

export function verifierModele(m: SpecModele): Probleme[] {
  const p: Probleme[] = [];
  const ajouter = (niveau: Niveau, v: Version | null, message: string) =>
    p.push({ niveau, ou: `${m.fichier} › ${m.marque} ${m.nom}${v ? ` › ${v.nom}` : ""}`, message });
  const annee = new Date().getFullYear();

  if (m.anneeDebut !== null && (m.anneeDebut < 1900 || m.anneeDebut > annee + 1)) ajouter("erreur", null, `année de début ${m.anneeDebut}`);
  if (m.anneeFin !== null && m.anneeDebut !== null && m.anneeFin < m.anneeDebut) ajouter("erreur", null, "année de fin avant l'année de début");
  if (!m.versions.length) ajouter("erreur", null, "aucune version");
  if (!m.couleurs.length) ajouter("alerte", null, "aucune couleur");

  const noms = new Set<string>();
  for (const v of m.versions) {
    if (noms.has(v.nom)) ajouter("erreur", v, "nom de version en double");
    noms.add(v.nom);
    const ev = v.energie === "électrique";
    const phev = v.energie === "hybride rechargeable";

    if (v.prixNeufEuros !== null && (v.prixNeufEuros < 5000 || v.prixNeufEuros > 700000)) ajouter("erreur", v, `prix ${v.prixNeufEuros} €`);
    if (v.puissanceCh !== null && (v.puissanceCh < 5 || v.puissanceCh > 2100)) ajouter("erreur", v, `puissance ${v.puissanceCh} ch`);
    if (v.vitesseMaxKmh !== null && (v.vitesseMaxKmh < 40 || v.vitesseMaxKmh > 420)) ajouter("erreur", v, `vitesse max ${v.vitesseMaxKmh} km/h`);
    if (v.zeroCentSecondes !== null && (v.zeroCentSecondes < 1.8 || v.zeroCentSecondes > 25)) ajouter("erreur", v, `0-100 en ${v.zeroCentSecondes} s`);
    if (v.places !== null && (v.places < 1 || v.places > 9)) ajouter("erreur", v, `${v.places} places`);
    if (v.portes !== null && (v.portes < 1 || v.portes > 5)) ajouter("erreur", v, `${v.portes} portes`);
    if (v.poidsKg !== null && (v.poidsKg < 400 || v.poidsKg > 3500)) ajouter("erreur", v, `poids ${v.poidsKg} kg`);
    if (v.coffreLitres !== null && m.carrosserie !== "utilitaire" && (v.coffreLitres < 50 || v.coffreLitres > 2700))
      ajouter("alerte", v, `coffre ${v.coffreLitres} L`);

    // Énergie électrique : CO2 nul, conso en kWh/100 km, autonomie renseignée.
    if (ev) {
      if (v.co2 !== null && v.co2 !== 0) ajouter("erreur", v, `électrique avec ${v.co2} g/km de CO2`);
      if (v.consommation !== null && (v.consommation < 5 || v.consommation > 35)) ajouter("erreur", v, `conso ${v.consommation} kWh/100 km`);
      if (v.autonomieKm === null) ajouter("alerte", v, "autonomie inconnue");
      else if (v.autonomieKm > 900) ajouter("erreur", v, `autonomie ${v.autonomieKm} km`);
    } else {
      if (v.consommation !== null && (v.consommation < 0.2 || v.consommation > 25)) ajouter("erreur", v, `conso ${v.consommation} L/100 km`);
      if (phev) {
        if (v.autonomieKm === null) ajouter("alerte", v, "autonomie électrique inconnue");
        else if (v.autonomieKm > 160) ajouter("alerte", v, `autonomie électrique ${v.autonomieKm} km`);
        if (v.consommation !== null && v.consommation > 4) ajouter("alerte", v, `conso pondérée ${v.consommation} L/100 km élevée pour un hybride rechargeable`);
      } else if (v.autonomieKm !== null) ajouter("alerte", v, "autonomie renseignée pour une motorisation non rechargeable");
      // Cohérence CO2 / consommation (±15 %).
      const facteur = CO2_PAR_LITRE[v.energie];
      if (facteur && v.consommation !== null && v.co2 !== null) {
        const attendu = v.consommation * facteur;
        if (Math.abs(v.co2 - attendu) / attendu > 0.15)
          ajouter("alerte", v, `CO2 ${v.co2} g/km incohérent avec ${v.consommation} L/100 km (≈ ${Math.round(attendu)} attendu)`);
      }
    }

    // Accélération plausible au regard du rapport poids/puissance (bornes larges).
    if (v.zeroCentSecondes !== null && v.poidsKg !== null && v.puissanceCh !== null) {
      const kgParCh = v.poidsKg / v.puissanceCh;
      const mini = 0.55 * Math.pow(kgParCh, 0.75);
      const maxi = 2.6 * Math.pow(kgParCh, 0.75) + 2;
      if (v.zeroCentSecondes < mini || v.zeroCentSecondes > maxi)
        ajouter("alerte", v, `0-100 en ${v.zeroCentSecondes} s peu plausible pour ${kgParCh.toFixed(1)} kg/ch`);
    }
    // Électrique et automatique vont ensemble.
    if (ev && v.boite !== "automatique") ajouter("erreur", v, "électrique en boîte manuelle");
  }

  // Le prix doit globalement augmenter avec la puissance au sein d'une même énergie.
  const parEnergie = new Map<string, Version[]>();
  for (const v of m.versions) parEnergie.set(v.energie, [...(parEnergie.get(v.energie) ?? []), v]);
  for (const vs of parEnergie.values()) {
    for (const a of vs)
      for (const b of vs)
        if (a.puissanceCh && b.puissanceCh && a.prixNeufEuros && b.prixNeufEuros && a.puissanceCh >= b.puissanceCh * 1.6 && a.prixNeufEuros < b.prixNeufEuros * 0.9)
          ajouter("alerte", a, `moins chère (${a.prixNeufEuros} €) que « ${b.nom} » pourtant bien moins puissante`);
  }
  return p;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const specs = lireSpecs();
  const problemes = specs.flatMap(verifierModele);
  for (const pb of problemes) console.log(`${pb.niveau === "erreur" ? "✖" : "⚠"} ${pb.ou} : ${pb.message}`);
  const erreurs = problemes.filter((x) => x.niveau === "erreur").length;
  console.log(`\n${specs.length} modèles contrôlés : ${erreurs} erreur(s), ${problemes.length - erreurs} alerte(s).`);
  process.exit(erreurs ? 1 : 0);
}

/** `npm run data` : relance toute la collecte puis la fusion. */
import { collecterWikidata } from "./fetch-wikidata.ts";
import { collecterNhtsa } from "./fetch-nhtsa.ts";
import { collecterCommons } from "./fetch-commons.ts";
import { fusionner } from "./merge.ts";
import { lireSpecs } from "./lire-specs.ts";
import { verifierModele } from "./verifier.ts";

const debut = Date.now();
await collecterWikidata();
await collecterNhtsa();
await collecterCommons();
fusionner();
const problemes = lireSpecs().flatMap(verifierModele);
if (problemes.length) console.log(`Contrôle des fiches : ${problemes.length} point(s) à vérifier (npm run data:verifier).`);
console.log(`Terminé en ${Math.round((Date.now() - debut) / 1000)} s.`);

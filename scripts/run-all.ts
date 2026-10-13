/** `npm run data` : relance toute la collecte puis la fusion. */
import { collecterWikidata } from "./fetch-wikidata.ts";
import { collecterNhtsa } from "./fetch-nhtsa.ts";
import { collecterCommons } from "./fetch-commons.ts";
import { fusionner } from "./merge.ts";

const debut = Date.now();
await collecterWikidata();
await collecterNhtsa();
await collecterCommons();
fusionner();
console.log(`Terminé en ${Math.round((Date.now() - debut) / 1000)} s.`);

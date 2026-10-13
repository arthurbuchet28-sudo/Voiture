import { fetchJson } from "./http.ts";

const ENDPOINT = "https://query.wikidata.org/sparql";

type Binding = Record<string, { type: string; value: string; "xml:lang"?: string }>;

export async function sparql(requete: string): Promise<Record<string, string>[]> {
  const corps = new URLSearchParams({ query: requete, format: "json" });
  const res = await fetchJson<{ results: { bindings: Binding[] } }>(ENDPOINT, {
    method: "POST",
    body: corps,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
  });
  return res.results.bindings.map((b) => {
    const ligne: Record<string, string> = {};
    for (const [k, v] of Object.entries(b)) ligne[k] = v.value;
    return ligne;
  });
}

export const qid = (uri: string | undefined) => {
  const m = uri?.match(/^http:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/);
  return m ? m[1] : undefined;
};

/** Nom de fichier Commons à partir d'une URL Special:FilePath renvoyée par P18/P154. */
export const fichierCommons = (uri: string | undefined) =>
  uri ? decodeURIComponent(uri.replace(/^https?:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//, "")) : undefined;

// Petit client HTTP avec User-Agent identifiable (exigé par Wikimedia), nouvelles tentatives et pause.

export const USER_AGENT =
  "MaVoitureIdeale/1.0 (projet open source de comparaison de voitures; https://github.com/arthurbuchet28-sudo/Voiture)";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson<T = unknown>(
  url: string,
  init: RequestInit = {},
  tentatives = 5,
): Promise<T> {
  let derniereErreur: unknown;
  for (let i = 0; i < tentatives; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...(init.headers ?? {}) },
      });
      if (res.status === 429 || res.status >= 500) {
        const attente = Number(res.headers.get("retry-after")) * 1000 || 2000 * 2 ** i;
        throw Object.assign(new Error(`HTTP ${res.status} sur ${url}`), { attente });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url} : ${(await res.text()).slice(0, 300)}`);
      return (await res.json()) as T;
    } catch (e) {
      derniereErreur = e;
      const attente = (e as { attente?: number }).attente ?? 1500 * 2 ** i;
      if (i < tentatives - 1) await sleep(attente);
    }
  }
  throw derniereErreur;
}

/** Exécute des tâches asynchrones avec une concurrence limitée. */
export async function pool<T, R>(items: T[], concurrence: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const resultats: R[] = new Array(items.length);
  let suivant = 0;
  async function worker() {
    while (suivant < items.length) {
      const i = suivant++;
      resultats[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrence, items.length) }, worker));
  return resultats;
}

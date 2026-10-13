// Favoris, comparateur et thème, conservés dans le localStorage.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

function lire<T>(cle: string, defaut: T): T {
  try {
    const v = localStorage.getItem(cle);
    return v ? (JSON.parse(v) as T) : defaut;
  } catch {
    return defaut;
  }
}
function ecrire(cle: string, v: unknown) {
  try {
    localStorage.setItem(cle, JSON.stringify(v));
  } catch {
    /* stockage indisponible (navigation privée) : on ignore */
  }
}

export interface ElementComparateur {
  modeleId: string;
  indexVersion: number;
}

export const MAX_COMPARATEUR = 3;

interface Stockage {
  favoris: string[];
  basculerFavori: (modeleId: string) => void;
  estFavori: (modeleId: string) => boolean;
  comparateur: ElementComparateur[];
  ajouterComparateur: (e: ElementComparateur) => "ajoute" | "deja" | "plein";
  retirerComparateur: (e: ElementComparateur) => void;
  remplacerComparateur: (ancien: ElementComparateur, nouveau: ElementComparateur) => void;
  viderComparateur: () => void;
  estCompare: (e: ElementComparateur) => boolean;
  sombre: boolean;
  basculerTheme: () => void;
}

const Contexte = createContext<Stockage | null>(null);
const meme = (a: ElementComparateur, b: ElementComparateur) => a.modeleId === b.modeleId && a.indexVersion === b.indexVersion;

export function FournisseurStockage({ children }: { children: ReactNode }) {
  const [favoris, setFavoris] = useState<string[]>(() => lire("favoris", []));
  const [comparateur, setComparateur] = useState<ElementComparateur[]>(() => lire("comparateur", []));
  const [sombre, setSombre] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => ecrire("favoris", favoris), [favoris]);
  useEffect(() => ecrire("comparateur", comparateur), [comparateur]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", sombre);
  }, [sombre]);

  const basculerFavori = useCallback(
    (id: string) => setFavoris((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    [],
  );
  const ajouterComparateur = useCallback(
    (e: ElementComparateur) => {
      if (comparateur.some((x) => meme(x, e))) return "deja" as const;
      if (comparateur.length >= MAX_COMPARATEUR) return "plein" as const;
      setComparateur([...comparateur, e]);
      return "ajoute" as const;
    },
    [comparateur],
  );

  const valeur = useMemo<Stockage>(
    () => ({
      favoris,
      basculerFavori,
      estFavori: (id) => favoris.includes(id),
      comparateur,
      ajouterComparateur,
      retirerComparateur: (e) => setComparateur((c) => c.filter((x) => !meme(x, e))),
      remplacerComparateur: (ancien, nouveau) =>
        setComparateur((c) => (c.some((x) => meme(x, nouveau)) ? c.filter((x) => !meme(x, ancien)) : c.map((x) => (meme(x, ancien) ? nouveau : x)))),
      viderComparateur: () => setComparateur([]),
      estCompare: (e) => comparateur.some((x) => meme(x, e)),
      sombre,
      basculerTheme: () =>
        setSombre((s) => {
          try {
            localStorage.setItem("theme", s ? "clair" : "sombre");
          } catch {
            /* ignore */
          }
          return !s;
        }),
    }),
    [favoris, basculerFavori, comparateur, ajouterComparateur, sombre],
  );
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useStockage(): Stockage {
  const c = useContext(Contexte);
  if (!c) throw new Error("useStockage hors du FournisseurStockage");
  return c;
}

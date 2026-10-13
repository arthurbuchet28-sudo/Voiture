// Chargement unique des fichiers JSON statiques (public/data) et mise à disposition via un contexte.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Marque, Modele } from "../types";
import { cle } from "./texte";

export interface Stats {
  dateMiseAJour: string;
  marques: number;
  modeles: number;
  modelesAvecFiche: number;
  versions: number;
  modelesAvecPhoto: number;
}

interface Donnees {
  chargement: boolean;
  erreur: string | null;
  modeles: Modele[];
  marques: Marque[];
  stats: Stats | null;
  marqueParId: Map<string, Marque>;
  modeleParId: Map<string, Modele>;
  /** Marques ayant au moins un modèle, avec le nombre de modèles avec fiche technique. */
  marquesActives: { marque: Marque; nbFiches: number; nbModeles: number }[];
  nomComplet: (m: Modele) => string;
  rechercherModeles: (q: string, limite?: number) => Modele[];
}

const Contexte = createContext<Donnees | null>(null);

const url = (f: string) => `${import.meta.env.BASE_URL}data/${f}`;

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [marques, setMarques] = useState<Marque[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(url("voitures.json")).then((r) => r.json()),
      fetch(url("marques.json")).then((r) => r.json()),
      fetch(url("stats.json")).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([v, m, s]) => {
        setModeles(v);
        setMarques(m);
        setStats(s);
      })
      .catch(() => setErreur("Impossible de charger la base de données. Lancez « npm run data » pour la générer."))
      .finally(() => setChargement(false));
  }, []);

  const valeur = useMemo<Donnees>(() => {
    const marqueParId = new Map(marques.map((m) => [m.id, m]));
    const modeleParId = new Map(modeles.map((m) => [m.id, m]));
    const compte = new Map<string, { f: number; n: number }>();
    for (const m of modeles) {
      const c = compte.get(m.marqueId) ?? { f: 0, n: 0 };
      c.n++;
      if (m.versions.length) c.f++;
      compte.set(m.marqueId, c);
    }
    const marquesActives = marques
      .filter((m) => compte.has(m.id))
      .map((m) => ({ marque: m, nbFiches: compte.get(m.id)!.f, nbModeles: compte.get(m.id)!.n }));
    const nomComplet = (m: Modele) => `${marqueParId.get(m.marqueId)?.nom ?? m.marqueId} ${m.nom}`;
    const index = modeles.map((m) => ({ m, k: cle(nomComplet(m)), kn: cle(m.nom) }));
    const rechercherModeles = (q: string, limite = 8) => {
      const k = cle(q);
      if (!k) return [];
      return index
        .filter((x) => x.k.includes(k) || x.kn.startsWith(k))
        .sort(
          (a, b) =>
            Number(b.k.startsWith(k) || b.kn.startsWith(k)) - Number(a.k.startsWith(k) || a.kn.startsWith(k)) ||
            Number(b.m.versions.length > 0) - Number(a.m.versions.length > 0) ||
            Number(a.m.anneeFin !== null) - Number(b.m.anneeFin !== null) ||
            a.k.length - b.k.length,
        )
        .slice(0, limite)
        .map((x) => x.m);
    };
    return { chargement, erreur, modeles, marques, stats, marqueParId, modeleParId, marquesActives, nomComplet, rechercherModeles };
  }, [modeles, marques, stats, chargement, erreur]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useDonnees(): Donnees {
  const c = useContext(Contexte);
  if (!c) throw new Error("useDonnees hors du FournisseurDonnees");
  return c;
}

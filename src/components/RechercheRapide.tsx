import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CRITERES_VIDES, criteresVersParams } from "../lib/criteres";
import { useDonnees } from "../lib/donnees";
import { periode } from "../lib/format";
import { LogoMarque } from "./SelecteurMarques";

const LIBELLES_CARROSSERIE: Record<string, string> = {
  citadine: "citadines", SUV: "SUV", berline: "berlines", break: "breaks", monospace: "monospaces",
  coupé: "coupés", cabriolet: "cabriolets", "pick-up": "pick-up", utilitaire: "utilitaires",
};

interface Element {
  cle: string;
  aller: () => void;
}

export function RechercheRapide() {
  const { rechercherModeles, marqueParId, nomComplet } = useDonnees();
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { suggestions, carrosseries, energies } = useMemo(() => rechercherModeles(q, 8), [rechercherModeles, q]);

  useEffect(() => {
    const fermer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  const terminer = (chemin: string) => {
    navigate(chemin);
    setQ("");
    setOuvert(false);
  };

  // « SUV électrique », « citadine diesel » : raccourci vers la page de résultats filtrée.
  const categorie = carrosseries.length || energies.length;
  const libelleCategorie = [
    carrosseries.map((c) => LIBELLES_CARROSSERIE[c]).join(", ") || "voitures",
    energies.join(" ou "),
  ]
    .filter(Boolean)
    .join(" · ");
  const elements: Element[] = [
    ...(categorie
      ? [{ cle: "categorie", aller: () => terminer(`/resultats?${criteresVersParams({ ...CRITERES_VIDES, carrosseries, energies })}`) }]
      : []),
    ...suggestions.map((s) => ({
      cle: s.modele.id,
      aller: () => terminer(`/modele/${s.modele.id}${s.indexVersion !== null ? `?v=${s.indexVersion}` : ""}`),
    })),
  ];

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-asphalte-500 dark:text-asphalte-400" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={q}
        placeholder="Rechercher un modèle (ex. 208, VW Golf, SUV électrique…)"
        onChange={(e) => {
          setQ(e.target.value);
          setOuvert(true);
          setActif(0);
        }}
        onFocus={() => setOuvert(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActif((a) => Math.min(a + 1, elements.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActif((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            elements[actif]?.aller();
          } else if (e.key === "Escape") setOuvert(false);
        }}
        aria-label="Recherche rapide par nom de modèle"
        enterKeyHint="search"
        className="w-full rounded-full border border-asphalte-200 bg-asphalte-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-500/20 dark:border-asphalte-700 dark:bg-asphalte-800 dark:focus:bg-asphalte-900"
      />
      {ouvert && q.trim() && (
        <ul className="absolute z-50 mt-2 max-h-[70vh] w-full overflow-y-auto max-sm:fixed max-sm:inset-x-3 max-sm:top-14 max-sm:w-auto sm:min-w-[24rem] rounded-xl border border-asphalte-200 bg-white shadow-carte-survol dark:border-asphalte-700 dark:bg-asphalte-900">
          {elements.length === 0 && (
            <li className="px-4 py-3 text-sm text-asphalte-500 dark:text-asphalte-400">
              Aucun modèle trouvé. Essayez une marque, un modèle ou une catégorie (« SUV hybride »).
            </li>
          )}
          {categorie > 0 && (
            <li>
              <button
                type="button"
                onMouseEnter={() => setActif(0)}
                onClick={elements[0].aller}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold text-accent-700 dark:text-accent-300 ${actif === 0 ? "bg-asphalte-100 dark:bg-asphalte-800" : ""}`}
              >
                <span aria-hidden>🔎</span>
                Voir tous les résultats : {libelleCategorie}
              </button>
            </li>
          )}
          {suggestions.map((s, i) => {
            const rang = i + (categorie ? 1 : 0);
            const version = s.indexVersion !== null ? s.modele.versions[s.indexVersion] : null;
            return (
              <li key={s.modele.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActif(rang)}
                  onClick={elements[rang].aller}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${rang === actif ? "bg-asphalte-100 dark:bg-asphalte-800" : ""}`}
                >
                  <LogoMarque marque={marqueParId.get(s.modele.marqueId)} taille={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{nomComplet(s.modele)}</span>
                    {version && <span className="block truncate text-xs text-asphalte-500 dark:text-asphalte-400">{version.nom}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-asphalte-500 dark:text-asphalte-400">{periode(s.modele.anneeDebut, s.modele.anneeFin)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

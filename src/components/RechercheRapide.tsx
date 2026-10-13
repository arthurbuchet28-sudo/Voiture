import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDonnees } from "../lib/donnees";
import { periode } from "../lib/format";
import { LogoMarque } from "./SelecteurMarques";

export function RechercheRapide() {
  const { rechercherModeles, marqueParId, nomComplet } = useDonnees();
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const suggestions = rechercherModeles(q, 8);

  useEffect(() => {
    const fermer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  const aller = (id: string) => {
    navigate(`/modele/${id}`);
    setQ("");
    setOuvert(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-asphalte-500 dark:text-asphalte-400" fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={q}
        placeholder="Rechercher un modèle (ex. 208, Model Y, Clio…)"
        onChange={(e) => {
          setQ(e.target.value);
          setOuvert(true);
          setActif(0);
        }}
        onFocus={() => setOuvert(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActif((a) => Math.min(a + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActif((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && suggestions[actif]) aller(suggestions[actif].id);
          else if (e.key === "Escape") setOuvert(false);
        }}
        aria-label="Recherche rapide par nom de modèle"
        className="w-full rounded-full border border-asphalte-200 bg-asphalte-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-500/20 dark:border-asphalte-700 dark:bg-asphalte-800 dark:focus:bg-asphalte-900"
      />
      {ouvert && q && (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-asphalte-200 bg-white shadow-carte-survol dark:border-asphalte-700 dark:bg-asphalte-900">
          {suggestions.length === 0 && <li className="px-4 py-3 text-sm text-asphalte-500 dark:text-asphalte-400">Aucun modèle trouvé.</li>}
          {suggestions.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseEnter={() => setActif(i)}
                onClick={() => aller(m.id)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${i === actif ? "bg-asphalte-100 dark:bg-asphalte-800" : ""}`}
              >
                <LogoMarque marque={marqueParId.get(m.marqueId)} taille={22} />
                <span className="flex-1 truncate font-medium">{nomComplet(m)}</span>
                <span className="shrink-0 text-xs text-asphalte-500 dark:text-asphalte-400">{periode(m.anneeDebut, m.anneeFin)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

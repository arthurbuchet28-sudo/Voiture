import { Link, useLocation } from "react-router-dom";
import { useDonnees } from "../lib/donnees";
import { MAX_COMPARATEUR, useStockage } from "../lib/stockage";
import { PhotoVoiture } from "./PhotoVoiture";

export function BarreComparateur() {
  const { comparateur, retirerComparateur, viderComparateur } = useStockage();
  const { modeleParId, nomComplet } = useDonnees();
  const { pathname } = useLocation();
  if (!comparateur.length || pathname === "/comparateur") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-asphalte-200 bg-white/95 shadow-[0_-8px_30px_-12px_rgb(0_0_0/0.3)] backdrop-blur dark:border-asphalte-800 dark:bg-asphalte-950/95">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <span className="hidden font-display text-lg font-bold uppercase sm:block">
          Comparateur {comparateur.length}/{MAX_COMPARATEUR}
        </span>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {comparateur.map((e) => {
            const m = modeleParId.get(e.modeleId);
            if (!m) return null;
            return (
              <div key={`${e.modeleId}#${e.indexVersion}`} className="flex shrink-0 items-center gap-2 rounded-lg border border-asphalte-200 py-1 pl-1 pr-2 dark:border-asphalte-700">
                <div className="w-14 overflow-hidden rounded">
                  <PhotoVoiture photo={m.photos[0]} carrosserie={m.carrosserie} alt="" className="aspect-[4/3]" />
                </div>
                <div className="max-w-[10rem] text-xs leading-tight">
                  <p className="truncate font-semibold">{nomComplet(m)}</p>
                  <p className="truncate text-asphalte-500">{m.versions[e.indexVersion]?.nom}</p>
                </div>
                <button type="button" onClick={() => retirerComparateur(e)} className="text-asphalte-400 hover:text-accent-600" aria-label="Retirer">
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={viderComparateur} className="hidden text-sm text-asphalte-500 hover:text-accent-600 sm:block">
          Vider
        </button>
        <Link to="/comparateur" className="bouton-principal shrink-0">
          Comparer
        </Link>
      </div>
    </div>
  );
}

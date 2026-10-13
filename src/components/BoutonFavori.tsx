import { useStockage } from "../lib/stockage";

export function BoutonFavori({ modeleId, avecTexte = false }: { modeleId: string; avecTexte?: boolean }) {
  const { estFavori, basculerFavori } = useStockage();
  const actif = estFavori(modeleId);
  return (
    <button
      type="button"
      onClick={() => basculerFavori(modeleId)}
      aria-pressed={actif}
      title={actif ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`flex items-center gap-2 rounded-full backdrop-blur transition-all hover:scale-105 ${
        avecTexte ? "border border-asphalte-300 px-4 py-2 text-sm font-semibold dark:border-asphalte-600" : "h-9 w-9 justify-center bg-white/85 shadow dark:bg-asphalte-900/80"
      } ${actif ? "text-accent-500" : "text-asphalte-500 dark:text-asphalte-300"}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={actif ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" strokeLinejoin="round" />
      </svg>
      {avecTexte && (actif ? "Dans vos favoris" : "Ajouter aux favoris")}
    </button>
  );
}

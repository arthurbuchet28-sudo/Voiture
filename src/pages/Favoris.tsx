import { Link } from "react-router-dom";
import { BoutonFavori } from "../components/BoutonFavori";
import { PhotoVoiture } from "../components/PhotoVoiture";
import { LogoMarque } from "../components/SelecteurMarques";
import { useDonnees } from "../lib/donnees";
import { periode, prix } from "../lib/format";
import { useStockage } from "../lib/stockage";

export default function Favoris() {
  const { favoris } = useStockage();
  const { modeleParId, marqueParId } = useDonnees();
  const modeles = favoris.map((id) => modeleParId.get(id)).filter((m) => m !== undefined);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 font-display text-4xl font-bold uppercase">Mes favoris</h1>
      {modeles.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-asphalte-500 dark:text-asphalte-400">Aucun favori pour l'instant. Cliquez sur le cœur d'une voiture pour la retrouver ici.</p>
          <Link to="/" className="bouton-principal mt-6">
            Lancer une recherche
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modeles.map((m) => {
            const prixMin = Math.min(...m.versions.map((v) => v.prixNeufEuros ?? Infinity));
            return (
              <article key={m.id} className="group relative overflow-hidden rounded-2xl border border-asphalte-200 bg-white shadow-carte transition hover:-translate-y-1 hover:shadow-carte-survol dark:border-asphalte-800 dark:bg-asphalte-900">
                <Link to={`/modele/${m.id}`}>
                  <PhotoVoiture photo={m.photos[0]} carrosserie={m.carrosserie} alt={m.nom} className="aspect-[16/10]" credit="incruste" />
                  <div className="p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-asphalte-500 dark:text-asphalte-400">
                      <LogoMarque marque={marqueParId.get(m.marqueId)} taille={18} />
                      {marqueParId.get(m.marqueId)?.nom}
                    </p>
                    <h2 className="font-display text-2xl font-bold group-hover:text-accent-600">{m.nom}</h2>
                    <p className="text-sm text-asphalte-500 dark:text-asphalte-400">
                      {periode(m.anneeDebut, m.anneeFin)} · {m.versions.length} version{m.versions.length > 1 ? "s" : ""}
                    </p>
                    {Number.isFinite(prixMin) && <p className="mt-2 font-display text-xl font-bold">À partir de {prix(prixMin)}</p>}
                  </div>
                </Link>
                <div className="absolute right-3 top-3">
                  <BoutonFavori modeleId={m.id} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { BarreComparateur } from "./components/BarreComparateur";
import { RechercheRapide } from "./components/RechercheRapide";
import { useDonnees } from "./lib/donnees";
import { useStockage } from "./lib/stockage";
import Accueil from "./pages/Accueil";
import Comparateur from "./pages/Comparateur";
import Favoris from "./pages/Favoris";
import FicheModele from "./pages/FicheModele";
import Resultats from "./pages/Resultats";

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Ma Voiture Idéale — accueil">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-asphalte-900 dark:bg-white">
        <svg viewBox="0 0 64 64" className="h-7 w-7">
          <path d="M10 40c0-3 2-5 5-6l6-8c1.5-2 3.5-3 6-3h12c2.5 0 4.5 1 6 3l5 7c3 .5 4 3 4 6v3a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2z" fill="#f2481a" />
          <circle cx="21" cy="44" r="5" className="fill-asphalte-900 dark:fill-white" />
          <circle cx="45" cy="44" r="5" className="fill-asphalte-900 dark:fill-white" />
        </svg>
      </span>
      <span className="hidden font-display text-xl font-bold uppercase leading-none tracking-wide md:block">
        Ma Voiture
        <span className="text-accent-500"> Idéale</span>
      </span>
    </Link>
  );
}

function Entete() {
  const { sombre, basculerTheme, favoris, comparateur } = useStockage();
  const lien = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors ${
      isActive ? "text-accent-600 dark:text-accent-400" : "text-asphalte-600 hover:text-asphalte-900 dark:text-asphalte-300 dark:hover:text-white"
    }`;
  const Badge = ({ n }: { n: number }) =>
    n ? <span className="ml-1 rounded-full bg-accent-500 px-1.5 text-[10px] font-bold text-white">{n}</span> : null;
  return (
    <header className="sticky top-0 z-30 border-b border-asphalte-200 bg-white/90 backdrop-blur dark:border-asphalte-800 dark:bg-asphalte-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <Logo />
        <div className="flex flex-1 justify-center">
          <RechercheRapide />
        </div>
        <nav className="flex items-center">
          <NavLink to="/" end className={lien}>
            <span className="hidden sm:inline">Rechercher</span>
            <span className="sm:hidden" aria-label="Rechercher">⌕</span>
          </NavLink>
          <NavLink to="/favoris" className={lien}>
            <span className="hidden sm:inline">Favoris</span>
            <span className="sm:hidden">♥</span>
            <Badge n={favoris.length} />
          </NavLink>
          <NavLink to="/comparateur" className={lien}>
            <span className="hidden sm:inline">Comparateur</span>
            <span className="sm:hidden">⇄</span>
            <Badge n={comparateur.length} />
          </NavLink>
          <button
            type="button"
            onClick={basculerTheme}
            className="ml-1 rounded-lg p-2 text-asphalte-500 hover:bg-asphalte-100 dark:text-asphalte-300 dark:hover:bg-asphalte-800"
            title={sombre ? "Passer en mode clair" : "Passer en mode sombre"}
            aria-label="Changer de thème"
          >
            {sombre ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function PiedDePage() {
  const { stats } = useDonnees();
  return (
    <footer className="mt-16 border-t border-asphalte-200 py-8 text-sm text-asphalte-500 dark:border-asphalte-800 dark:text-asphalte-400">
      <div className="mx-auto max-w-7xl space-y-2 px-4">
        <p>
          Données : <a className="underline" href="https://www.wikidata.org" target="_blank" rel="noreferrer">Wikidata</a> (CC0),{" "}
          <a className="underline" href="https://vpic.nhtsa.dot.gov/api/" target="_blank" rel="noreferrer">NHTSA vPIC</a>, fiches techniques
          saisies d'après les catalogues constructeurs (valeurs WLTP, prix catalogue indicatifs). Photos :{" "}
          <a className="underline" href="https://commons.wikimedia.org" target="_blank" rel="noreferrer">Wikimedia Commons</a>, sous licences libres
          (auteur et licence indiqués sous chaque photo).
        </p>
        {stats && (
          <p>
            Base mise à jour le {new Date(stats.dateMiseAJour).toLocaleDateString("fr-FR")} : {stats.marques} marques, {stats.modeles} modèles dont{" "}
            {stats.modelesAvecFiche} avec fiche technique, {stats.versions} versions.
          </p>
        )}
        <p>Les prix et caractéristiques sont donnés à titre indicatif : vérifiez-les auprès du constructeur avant tout achat.</p>
      </div>
    </footer>
  );
}

export default function App() {
  const { chargement, erreur } = useDonnees();
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Entete />
      <main className="flex-1 pb-24">
        {erreur ? (
          <div className="mx-auto max-w-xl px-4 py-24 text-center">
            <p className="font-display text-2xl font-bold">Base de données introuvable</p>
            <p className="mt-2 text-asphalte-500">{erreur}</p>
          </div>
        ) : chargement ? (
          <div className="flex justify-center py-32" role="status">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-asphalte-200 border-t-accent-500" />
            <span className="sr-only">Chargement…</span>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/resultats" element={<Resultats />} />
            <Route path="/modele/:id" element={<FicheModele />} />
            <Route path="/comparateur" element={<Comparateur />} />
            <Route path="/favoris" element={<Favoris />} />
            <Route
              path="*"
              element={
                <div className="py-24 text-center">
                  <p className="font-display text-3xl font-bold">Page introuvable</p>
                  <Link to="/" className="bouton-principal mt-6">
                    Retour à l'accueil
                  </Link>
                </div>
              }
            />
          </Routes>
        )}
      </main>
      <PiedDePage />
      <BarreComparateur />
    </div>
  );
}

import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FormulaireCriteres } from "../components/FormulaireCriteres";
import { CRITERES_VIDES, PROFILS, appliquerProfil, criteresVersParams, nombreCriteresActifs, paramsVersCriteres, type Criteres } from "../lib/criteres";
import { useDonnees } from "../lib/donnees";
import { rechercher } from "../lib/score";

export default function Accueil() {
  const [params] = useSearchParams();
  // Revenir sur l'accueil depuis les résultats conserve les critères (passés dans l'URL).
  const [criteres, setCriteres] = useState<Criteres>(() => paramsVersCriteres(params).criteres);
  const [profil, setProfil] = useState<string | null>(null);
  const navigate = useNavigate();
  const { modeles, stats } = useDonnees();
  const nb = useMemo(() => rechercher(modeles, criteres).resultats.length, [modeles, criteres]);
  const actifs = nombreCriteresActifs(criteres);

  const lancer = () => navigate(`/resultats?${criteresVersParams(criteres)}`);

  return (
    <div>
      {/* Bandeau */}
      <section className="relative overflow-hidden bg-asphalte-900 text-white dark:bg-black">
        <div className="bandes absolute inset-0" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-14">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-accent-400">Trouvez la voiture faite pour vous</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold uppercase leading-[0.95] md:text-6xl">
            Vos critères. <span className="text-accent-500">Votre voiture.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-asphalte-300">
            Choisissez ce qui compte pour vous : chaque critère est facultatif. Nous classons{" "}
            {stats ? `${stats.versions} versions de ${stats.modelesAvecFiche} modèles` : "les modèles"} vendus en France par pourcentage de
            correspondance.
          </p>
          {/* Profils rapides */}
          <div className="mt-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-asphalte-400">Profils rapides</p>
            <div className="flex flex-wrap gap-2">
              {PROFILS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.description}
                  onClick={() => {
                    setCriteres(appliquerProfil(p));
                    setProfil(p.id);
                  }}
                  className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2 text-left transition-all hover:-translate-y-0.5 ${
                    profil === p.id ? "border-accent-500 bg-accent-500 text-white" : "border-white/15 bg-white/5 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {p.icone}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold leading-tight">{p.nom}</span>
                    <span className={`block text-[11px] leading-tight ${profil === p.id ? "text-white/80" : "text-asphalte-400"}`}>{p.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <FormulaireCriteres
          criteres={criteres}
          onChange={(c) => {
            setCriteres(c);
            setProfil(null);
          }}
          disposition="accueil"
        />
      </div>

      {/* Barre d'action collante */}
      <div className="sticky bottom-0 z-20 border-t border-asphalte-200 bg-white/95 backdrop-blur dark:border-asphalte-800 dark:bg-asphalte-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <p className="text-sm text-asphalte-600 dark:text-asphalte-300">
            <span className="font-display text-2xl font-bold text-asphalte-900 dark:text-white">{nb.toLocaleString("fr-FR")}</span> résultat
            {nb > 1 ? "s" : ""} · {actifs} critère{actifs > 1 ? "s" : ""} renseigné{actifs > 1 ? "s" : ""}
          </p>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="bouton-secondaire"
              onClick={() => {
                setCriteres(CRITERES_VIDES);
                setProfil(null);
              }}
            >
              Réinitialiser
            </button>
            <button type="button" className="bouton-principal" onClick={lancer}>
              Trouver ma voiture
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

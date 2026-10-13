import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CarteResultat } from "../components/CarteResultat";
import { FormulaireCriteres } from "../components/FormulaireCriteres";
import { CRITERES_VIDES, criteresVersParams, nombreCriteresActifs, paramsVersCriteres, type Criteres, type Tri } from "../lib/criteres";
import { useDonnees } from "../lib/donnees";
import { rechercher, suggestion, trier } from "../lib/score";

const PAR_PAGE = 24;

const TRIS: { valeur: Tri; libelle: string }[] = [
  { valeur: "score", libelle: "Meilleure correspondance" },
  { valeur: "prix-asc", libelle: "Prix croissant" },
  { valeur: "prix-desc", libelle: "Prix décroissant" },
  { valeur: "puissance", libelle: "Puissance" },
  { valeur: "conso", libelle: "Consommation" },
];

export default function Resultats() {
  const { modeles } = useDonnees();
  const [params, setParams] = useSearchParams();
  const { criteres, tri } = useMemo(() => paramsVersCriteres(params), [params]);
  const [nbAffiches, setNbAffiches] = useState(PAR_PAGE);
  const [panneauMobile, setPanneauMobile] = useState(false);
  const sentinelle = useRef<HTMLDivElement>(null);

  const maj = (c: Criteres, t: Tri = tri) => setParams(criteresVersParams(c, t), { replace: true });

  const { resultats } = useMemo(() => rechercher(modeles, criteres), [modeles, criteres]);
  const tries = useMemo(() => trier(resultats, tri), [resultats, tri]);
  const conseil = useMemo(() => (tries.length ? null : suggestion(modeles, criteres)), [tries.length, modeles, criteres]);

  // Revient en haut de liste quand les critères changent.
  useEffect(() => setNbAffiches(PAR_PAGE), [params]);

  const reste = nbAffiches < tries.length;
  // Chargement progressif : la sentinelle en bas de liste déclenche l'affichage de la page suivante.
  useEffect(() => {
    const el = sentinelle.current;
    if (!el) return;
    const obs = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) setNbAffiches((n) => n + PAR_PAGE);
    }, { rootMargin: "600px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [tries.length, reste]);

  const actifs = nombreCriteresActifs(criteres);
  const modelesDistincts = useMemo(() => new Set(tries.map((r) => r.modele.id)).size, [tries]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex gap-6">
        {/* Panneau latéral des filtres */}
        <aside
          className={`${
            panneauMobile ? "fixed inset-0 z-50 block overflow-y-auto bg-white p-4 dark:bg-asphalte-950" : "hidden"
          } lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-asphalte-200 lg:bg-white lg:px-4 lg:shadow-carte dark:lg:border-asphalte-800 dark:lg:bg-asphalte-900`}
        >
          <div className="flex items-center justify-between pt-4">
            <h2 className="font-display text-2xl font-bold uppercase">Filtres</h2>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => maj(CRITERES_VIDES)} className="text-sm text-asphalte-500 dark:text-asphalte-400 hover:text-accent-600">
                Réinitialiser
              </button>
              <button type="button" onClick={() => setPanneauMobile(false)} className="bouton-principal px-3 py-1 text-sm lg:hidden">
                Voir {tries.length} résultats
              </button>
            </div>
          </div>
          <FormulaireCriteres criteres={criteres} onChange={(c) => maj(c)} disposition="panneau" />
          <Link to={`/?${criteresVersParams(criteres)}`} className="my-4 block text-center text-sm text-accent-600 dark:text-accent-400 hover:underline">
            ← Modifier sur la page d'accueil
          </Link>
        </aside>

        {/* Résultats */}
        <section className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div className="mr-auto">
              <h1 className="font-display text-3xl font-bold uppercase leading-none">
                {tries.length.toLocaleString("fr-FR")} résultat{tries.length > 1 ? "s" : ""}
              </h1>
              <p className="mt-1 text-sm text-asphalte-500 dark:text-asphalte-400">
                {modelesDistincts} modèle{modelesDistincts > 1 ? "s" : ""} · {actifs} critère{actifs > 1 ? "s" : ""} actif{actifs > 1 ? "s" : ""}
                {criteres.neuveUniquement ? " · modèles neufs uniquement" : ""}
              </p>
            </div>
            <button type="button" onClick={() => setPanneauMobile(true)} className="bouton-secondaire py-2 lg:hidden">
              Filtres ({actifs})
            </button>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-asphalte-500 dark:text-asphalte-400">Trier par</span>
              <select value={tri} onChange={(e) => maj(criteres, e.target.value as Tri)} className="champ py-1.5">
                {TRIS.map((t) => (
                  <option key={t.valeur} value={t.valeur}>
                    {t.libelle}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="rounded-lg border border-asphalte-300 px-3 py-1.5 text-sm hover:border-accent-500 hover:text-accent-600 dark:border-asphalte-600"
              title="Copier le lien de cette recherche"
            >
              🔗 Partager
            </button>
          </div>

          {tries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-asphalte-300 bg-white p-10 text-center dark:border-asphalte-700 dark:bg-asphalte-900">
              <p className="font-display text-2xl font-bold">Aucune voiture ne correspond à tous vos critères</p>
              <p className="mx-auto mt-2 max-w-lg text-asphalte-500 dark:text-asphalte-400">
                Le budget, le nombre de places et l'énergie sont des critères éliminatoires. Essayez d'en assouplir un.
              </p>
              {conseil ? (
                <button type="button" onClick={() => maj(conseil.criteres)} className="bouton-principal mt-6 normal-case">
                  💡 {conseil.texte}
                </button>
              ) : (
                <button type="button" onClick={() => maj(CRITERES_VIDES)} className="bouton-principal mt-6">
                  Réinitialiser les critères
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {tries.slice(0, nbAffiches).map((r) => (
                  <CarteResultat key={r.cle} r={r} />
                ))}
              </div>
              {reste && (
                <div ref={sentinelle} className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setNbAffiches((n) => n + PAR_PAGE)} className="bouton-secondaire">
                    Afficher plus ({tries.length - nbAffiches} restants)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BoutonFavori } from "../components/BoutonFavori";
import { CreditPhoto, PhotoVoiture } from "../components/PhotoVoiture";
import { LogoMarque } from "../components/SelecteurMarques";
import { COULEURS } from "../lib/criteres";
import { useDonnees } from "../lib/donnees";
import { COULEUR_ENERGIE, ETIQUETTE_CRITAIR, conso, dec, periode, prix } from "../lib/format";
import { lignesTechniques, val } from "../lib/fiche";
import { MAX_COMPARATEUR, useStockage } from "../lib/stockage";
import type { Version } from "../types";

export default function PageFicheModele() {
  const { id } = useParams();
  // La clé réinitialise l'état (photo affichée…) quand on passe d'un modèle à un autre.
  return <FicheModele key={id} id={id} />;
}

function FicheModele({ id }: { id: string | undefined }) {
  const [params, setParams] = useSearchParams();
  const { modeleParId, marqueParId } = useDonnees();
  const { ajouterComparateur, estCompare, retirerComparateur } = useStockage();
  const [photoActive, setPhotoActive] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const m = id ? modeleParId.get(id) : undefined;
  if (!m) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-3xl font-bold">Modèle introuvable</p>
        <Link to="/" className="bouton-principal mt-6">
          Retour à la recherche
        </Link>
      </div>
    );
  }
  const marque = marqueParId.get(m.marqueId);
  const iv = Math.min(Math.max(Number(params.get("v") ?? 0) || 0, 0), Math.max(m.versions.length - 1, 0));
  const v: Version | undefined = m.versions[iv];
  const photo = m.photos[photoActive] ?? m.photos[0];
  const elt = { modeleId: m.id, indexVersion: iv };
  const compare = estCompare(elt);

  const comparer = () => {
    if (compare) {
      retirerComparateur(elt);
      setMessage(null);
      return;
    }
    const r = ajouterComparateur(elt);
    setMessage(r === "plein" ? `Le comparateur est plein (${MAX_COMPARATEUR} voitures maximum). Retirez-en une d'abord.` : null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 text-sm text-asphalte-500">
        <Link to="/" className="hover:text-accent-600">
          Recherche
        </Link>{" "}
        / <span>{marque?.nom}</span> / <span className="text-asphalte-800 dark:text-asphalte-200">{m.nom}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Galerie */}
        <div>
          <div className="overflow-hidden rounded-2xl shadow-carte">
            <PhotoVoiture key={photo?.url} photo={photo} carrosserie={m.carrosserie} alt={`${marque?.nom} ${m.nom}`} className="aspect-[16/10]" prioritaire />
          </div>
          {photo && <CreditPhoto photo={photo} className="mt-2" />}
          {m.photos.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {m.photos.map((p, i) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setPhotoActive(i)}
                  className={`overflow-hidden rounded-lg border-2 transition ${i === photoActive ? "border-accent-500" : "border-transparent opacity-70 hover:opacity-100"}`}
                  aria-label={`Photo ${i + 1}`}
                >
                  <PhotoVoiture photo={p} carrosserie={m.carrosserie} alt="" className="aspect-[4/3]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* En-tête et version */}
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-asphalte-500">
            <LogoMarque marque={marque} taille={28} />
            {marque?.nom}
            {marque?.pays && marque.pays !== "Inconnu" && <span className="font-normal normal-case tracking-normal">· {marque.pays}</span>}
          </div>
          <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none">{m.nom}</h1>
          <p className="mt-2 text-asphalte-500">
            {m.carrosserie}
            {m.segment ? ` · segment ${m.segment}` : ""} · {periode(m.anneeDebut, m.anneeFin)}
          </p>

          {v ? (
            <div className="mt-6 rounded-2xl border border-asphalte-200 bg-white p-5 shadow-carte dark:border-asphalte-800 dark:bg-asphalte-900">
              <label className="text-xs font-semibold uppercase tracking-wider text-asphalte-500" htmlFor="version">
                Version
              </label>
              <select
                id="version"
                value={iv}
                onChange={(e) => setParams({ v: e.target.value }, { replace: true })}
                className="champ mt-1 w-full text-base font-semibold"
              >
                {m.versions.map((x, i) => (
                  <option key={i} value={i}>
                    {x.nom} — {prix(x.prixNeufEuros)}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${COULEUR_ENERGIE[v.energie]}`}>{v.energie}</span>
                {v.critAir && <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${ETIQUETTE_CRITAIR[v.critAir]}`}>Crit'Air {v.critAir}</span>}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  ["Puissance", val(v.puissanceCh, " ch")],
                  ["0-100 km/h", val(v.zeroCentSecondes, " s", dec)],
                  [v.energie === "électrique" ? "Autonomie" : "Conso.", v.energie === "électrique" ? val(v.autonomieKm, " km") : val(v.consommation, " L", dec)],
                ].map(([l, x]) => (
                  <div key={l} className="rounded-xl bg-asphalte-50 py-3 dark:bg-asphalte-800">
                    <p className="font-display text-2xl font-bold">{x}</p>
                    <p className="text-xs text-asphalte-500">{l}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 font-display text-4xl font-bold">{prix(v.prixNeufEuros)}</p>
              <p className="text-xs text-asphalte-500">Prix catalogue neuf indicatif</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={comparer} className={compare ? "bouton-secondaire" : "bouton-principal"}>
                  {compare ? "✓ Dans le comparateur" : "Ajouter au comparateur"}
                </button>
                <BoutonFavori modeleId={m.id} avecTexte />
              </div>
              {message && <p className="mt-2 text-sm text-accent-600">{message}</p>}
            </div>
          ) : (
            <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-dashed border-asphalte-300 p-5 dark:border-asphalte-700">
              <p className="text-sm text-asphalte-500">
                Ce modèle provient de Wikidata et ne dispose pas encore de fiche technique détaillée (versions, prix, consommation). Les valeurs
                inconnues ne sont jamais inventées.
              </p>
              <BoutonFavori modeleId={m.id} />
            </div>
          )}

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-asphalte-500">Couleurs disponibles</h2>
            {m.couleursDisponibles.length ? (
              <div className="flex flex-wrap gap-3">
                {m.couleursDisponibles.map((nom) => (
                  <span key={nom} className="flex items-center gap-1.5 text-sm">
                    <span
                      className="h-6 w-6 rounded-full border border-asphalte-300 shadow-inner dark:border-asphalte-600"
                      style={{ background: COULEURS.find((c) => c.nom === nom)?.hex }}
                    />
                    {nom}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-asphalte-500">Non renseignées.</p>
            )}
          </div>
        </div>
      </div>

      {v && (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-display text-2xl font-bold uppercase">Caractéristiques techniques</h2>
            <p className="mb-3 text-sm text-asphalte-500">{v.nom}</p>
            <table className="w-full overflow-hidden rounded-xl text-sm">
              <tbody>
                {lignesTechniques(v).map(([l, x], i) => (
                  <tr key={l} className={i % 2 ? "bg-white dark:bg-asphalte-900" : "bg-asphalte-100/70 dark:bg-asphalte-800/60"}>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-asphalte-500 dark:text-asphalte-400">
                      {l}
                    </th>
                    <td className={`px-4 py-2.5 text-right font-semibold ${x === "—" ? "text-asphalte-400" : ""}`}>{x}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-asphalte-500">« — » : donnée inconnue, laissée vide plutôt qu'estimée.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-bold uppercase">Toutes les versions ({m.versions.length})</h2>
            <div className="space-y-2">
              {m.versions.map((x, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setParams({ v: String(i) }, { replace: true })}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    i === iv
                      ? "border-accent-500 bg-accent-50 dark:bg-accent-500/10"
                      : "border-asphalte-200 bg-white hover:border-asphalte-400 dark:border-asphalte-800 dark:bg-asphalte-900"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{x.nom}</p>
                    <p className="text-xs text-asphalte-500">
                      {x.energie} · {val(x.puissanceCh, " ch")} · {x.boite}
                      {conso(x) ? ` · ${conso(x)}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-xl font-bold">{prix(x.prixNeufEuros)}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      <p className="mt-10 text-xs text-asphalte-500">
        Sources : {m.source}. Mise à jour : {new Date(m.dateMiseAJour).toLocaleDateString("fr-FR")}.
      </p>
    </div>
  );
}

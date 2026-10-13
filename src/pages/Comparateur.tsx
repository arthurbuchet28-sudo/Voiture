import { Link } from "react-router-dom";
import { PhotoVoiture } from "../components/PhotoVoiture";
import { LogoMarque } from "../components/SelecteurMarques";
import { useDonnees } from "../lib/donnees";
import { lignesTechniques } from "../lib/fiche";
import { prix } from "../lib/format";
import { MAX_COMPARATEUR, useStockage, type ElementComparateur } from "../lib/stockage";
import type { Modele, Version } from "../types";

// Pour chaque ligne comparable : quelle valeur est la meilleure (mise en évidence).
const MEILLEUR: Partial<Record<string, { cle: keyof Version; sens: "min" | "max" }>> = {
  Puissance: { cle: "puissanceCh", sens: "max" },
  "Prix neuf (indicatif)": { cle: "prixNeufEuros", sens: "min" },
  "Émissions de CO₂": { cle: "co2", sens: "min" },
  "Autonomie électrique (WLTP)": { cle: "autonomieKm", sens: "max" },
  "0 à 100 km/h": { cle: "zeroCentSecondes", sens: "min" },
  "Vitesse maximale": { cle: "vitesseMaxKmh", sens: "max" },
  Places: { cle: "places", sens: "max" },
  "Volume de coffre": { cle: "coffreLitres", sens: "max" },
  "Poids à vide": { cle: "poidsKg", sens: "min" },
};

export default function Comparateur() {
  const { comparateur, retirerComparateur, viderComparateur, remplacerComparateur } = useStockage();
  const { modeleParId, marqueParId } = useDonnees();

  const elements = comparateur
    .map((e) => ({ e, m: modeleParId.get(e.modeleId), v: modeleParId.get(e.modeleId)?.versions[e.indexVersion] }))
    .filter((x): x is { e: ElementComparateur; m: Modele; v: Version } => !!x.m && !!x.v);

  if (!elements.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-display text-4xl font-bold uppercase">Comparateur vide</p>
        <p className="mt-3 text-asphalte-500">
          Ajoutez jusqu'à {MAX_COMPARATEUR} voitures depuis les résultats ou les fiches modèles pour les comparer côte à côte.
        </p>
        <Link to="/" className="bouton-principal mt-8">
          Lancer une recherche
        </Link>
      </div>
    );
  }

  const changerVersion = (e: ElementComparateur, indexVersion: number) =>
    remplacerComparateur(e, { modeleId: e.modeleId, indexVersion });

  const lignes = lignesTechniques(elements[0].v).map(([l]) => l);
  const meilleurs = (l: string): Set<number> => {
    const r = MEILLEUR[l];
    if (!r || elements.length < 2) return new Set();
    const vals = elements.map((x) => x.v[r.cle] as number | null);
    const connus = vals.filter((x): x is number => x !== null);
    if (connus.length < 2) return new Set();
    const cible = r.sens === "min" ? Math.min(...connus) : Math.max(...connus);
    return new Set(vals.flatMap((x, i) => (x === cible ? [i] : [])));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold uppercase">Comparateur</h1>
        <button type="button" onClick={viderComparateur} className="text-sm text-asphalte-500 hover:text-accent-600">
          Tout retirer
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-x-3 text-sm">
          <thead>
            <tr>
              <th className="w-44" />
              {elements.map(({ e, m, v }) => (
                <th key={`${e.modeleId}#${e.indexVersion}`} className="align-top font-normal">
                  <div className="overflow-hidden rounded-xl text-left">
                    <PhotoVoiture photo={m.photos[0]} carrosserie={m.carrosserie} alt={m.nom} className="aspect-[16/10]" credit="incruste" />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wider text-asphalte-500">
                    <LogoMarque marque={marqueParId.get(m.marqueId)} taille={18} />
                    {marqueParId.get(m.marqueId)?.nom}
                  </div>
                  <Link to={`/modele/${m.id}?v=${e.indexVersion}`} className="block text-left font-display text-2xl font-bold hover:text-accent-600">
                    {m.nom}
                  </Link>
                  <select value={e.indexVersion} onChange={(ev) => changerVersion(e, Number(ev.target.value))} className="champ mt-2 w-full text-xs">
                    {m.versions.map((x, i) => (
                      <option key={i} value={i}>
                        {x.nom}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display text-xl font-bold">{prix(v.prixNeufEuros)}</span>
                    <button type="button" onClick={() => retirerComparateur(e)} className="text-xs text-asphalte-500 hover:text-accent-600">
                      Retirer ×
                    </button>
                  </div>
                </th>
              ))}
              {elements.length < MAX_COMPARATEUR && (
                <th className="align-top font-normal">
                  <Link
                    to="/resultats"
                    className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl border-2 border-dashed border-asphalte-300 text-asphalte-500 hover:border-accent-500 hover:text-accent-600 dark:border-asphalte-700"
                  >
                    <span className="text-3xl">+</span>
                    <span className="text-sm">Ajouter une voiture</span>
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, li) => {
              const best = meilleurs(l);
              return (
                <tr key={l}>
                  <th scope="row" className={`px-3 py-2.5 text-left font-medium text-asphalte-500 ${li % 2 ? "" : "bg-asphalte-100/70 dark:bg-asphalte-800/50"} rounded-l-lg`}>
                    {l}
                  </th>
                  {elements.map(({ e, v }, i) => {
                    const x = lignesTechniques(v)[li][1];
                    return (
                      <td
                        key={`${e.modeleId}#${e.indexVersion}`}
                        className={`px-3 py-2.5 font-semibold ${li % 2 ? "" : "bg-asphalte-100/70 dark:bg-asphalte-800/50"} ${
                          best.has(i) ? "text-emerald-600 dark:text-emerald-400" : x === "—" ? "text-asphalte-400" : ""
                        }`}
                      >
                        {x}
                        {best.has(i) && <span className="ml-1 text-xs">★</span>}
                      </td>
                    );
                  })}
                  {elements.length < MAX_COMPARATEUR && <td />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-asphalte-500">★ meilleure valeur de la ligne. « — » : donnée inconnue.</p>
    </div>
  );
}

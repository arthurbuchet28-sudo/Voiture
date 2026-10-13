import { useMemo, useState } from "react";
import { useDonnees } from "../lib/donnees";
import { cle } from "../lib/texte";
import type { Marque } from "../types";

export function LogoMarque({ marque, taille = 24 }: { marque: Marque | undefined; taille?: number }) {
  const [erreur, setErreur] = useState(false);
  if (marque?.logoUrl && !erreur) {
    return (
      <img
        src={marque.logoUrl}
        alt=""
        loading="lazy"
        width={taille}
        height={taille}
        onError={() => setErreur(true)}
        className="shrink-0 object-contain dark:rounded dark:bg-white/90 dark:p-0.5"
        style={{ width: taille, height: taille }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-asphalte-200 font-display text-xs font-bold uppercase text-asphalte-600 dark:bg-asphalte-700 dark:text-asphalte-200"
      style={{ width: taille, height: taille }}
    >
      {marque?.nom.slice(0, 2) ?? "?"}
    </span>
  );
}

export function SelecteurMarques({ valeurs, onChange }: { valeurs: string[]; onChange: (v: string[]) => void }) {
  const { marquesActives, marqueParId } = useDonnees();
  const [requete, setRequete] = useState("");
  const [toutes, setToutes] = useState(false);

  const liste = useMemo(() => {
    const k = cle(requete);
    return marquesActives
      .filter((m) => (k ? cle(m.marque.nom).includes(k) : toutes || m.nbFiches > 0))
      .sort((a, b) => Number(b.nbFiches > 0) - Number(a.nbFiches > 0) || a.marque.nom.localeCompare(b.marque.nom, "fr"));
  }, [marquesActives, requete, toutes]);

  const basculer = (id: string) => onChange(valeurs.includes(id) ? valeurs.filter((v) => v !== id) : [...valeurs, id]);

  return (
    <div>
      {valeurs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {valeurs.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => basculer(id)}
              className="flex items-center gap-1.5 rounded-full bg-accent-500 py-1 pl-1.5 pr-2.5 text-sm font-medium text-white"
              title="Retirer"
            >
              <LogoMarque marque={marqueParId.get(id)} taille={18} />
              {marqueParId.get(id)?.nom ?? id}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}
      <input
        type="search"
        value={requete}
        onChange={(e) => setRequete(e.target.value)}
        placeholder="Rechercher une marque…"
        className="champ mb-2 w-full"
      />
      <div className="grid max-h-56 grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-1 overflow-y-auto pr-1">
        {liste.map(({ marque, nbFiches, nbModeles }) => {
          const actif = valeurs.includes(marque.id);
          return (
            <button
              key={marque.id}
              type="button"
              aria-pressed={actif}
              onClick={() => basculer(marque.id)}
              title={`${marque.nom} — ${marque.pays} — ${nbModeles} modèle(s), ${nbFiches} avec fiche technique`}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition-colors ${
                actif
                  ? "border-accent-500 bg-accent-50 text-accent-800 dark:bg-accent-500/15 dark:text-accent-200"
                  : "border-transparent hover:bg-asphalte-100 dark:hover:bg-asphalte-800"
              }`}
            >
              <LogoMarque marque={marque} taille={22} />
              <span className="truncate">{marque.nom}</span>
            </button>
          );
        })}
        {liste.length === 0 && <p className="col-span-full py-3 text-sm text-asphalte-400">Aucune marque trouvée.</p>}
      </div>
      {!requete && (
        <button type="button" onClick={() => setToutes(!toutes)} className="mt-2 text-xs font-medium text-accent-600 hover:underline">
          {toutes ? "Afficher seulement les marques avec fiches techniques" : `Afficher toutes les marques (${marquesActives.length})`}
        </button>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { useDonnees } from "../lib/donnees";
import { COULEUR_ENERGIE, conso, prix } from "../lib/format";
import type { Resultat } from "../lib/score";
import { useStockage } from "../lib/stockage";
import { PhotoVoiture } from "./PhotoVoiture";
import { LogoMarque } from "./SelecteurMarques";
import { BoutonFavori } from "./BoutonFavori";

export function JaugeScore({ score, taille = "normale" }: { score: number; taille?: "normale" | "grande" }) {
  const couleur = score >= 85 ? "#16a34a" : score >= 65 ? "#f2481a" : score >= 45 ? "#f59e0b" : "#94a3b8";
  const r = taille === "grande" ? 26 : 20;
  const c = 2 * Math.PI * r;
  const d = taille === "grande" ? 64 : 50;
  return (
    <div className="relative flex items-center justify-center" style={{ width: d, height: d }} title={`Correspondance : ${score} %`}>
      <svg viewBox={`0 0 ${d} ${d}`} className="absolute inset-0 -rotate-90">
        <circle cx={d / 2} cy={d / 2} r={r} strokeWidth="5" className="fill-white/95 stroke-asphalte-200 dark:fill-asphalte-900/95 dark:stroke-asphalte-700" />
        <circle cx={d / 2} cy={d / 2} r={r} strokeWidth="5" fill="none" stroke={couleur} strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className={`relative font-display font-bold tabular-nums ${taille === "grande" ? "text-xl" : "text-base"}`}>
        {score}
        <span className="text-[0.6em]">%</span>
      </span>
    </div>
  );
}

export function CarteResultat({ r }: { r: Resultat }) {
  const { marqueParId } = useDonnees();
  const { ajouterComparateur, estCompare, retirerComparateur } = useStockage();
  const { modele: m, version: v } = r;
  const marque = marqueParId.get(m.marqueId);
  const lien = `/modele/${m.id}${r.indexVersion >= 0 ? `?v=${r.indexVersion}` : ""}`;
  const elt = { modeleId: m.id, indexVersion: r.indexVersion };
  const compare = estCompare(elt);
  const pointsFaibles = r.details.filter((d) => d.satisfaction < 1);

  return (
    <article className="group relative flex animate-apparition flex-col overflow-hidden rounded-2xl border border-asphalte-200 bg-white shadow-carte transition-all duration-300 hover:-translate-y-1 hover:shadow-carte-survol dark:border-asphalte-800 dark:bg-asphalte-900">
      <Link to={lien} className="block" aria-label={`${marque?.nom} ${m.nom}${v ? ` ${v.nom}` : ""}`}>
        <div className="overflow-hidden">
          <div className="transition-transform duration-500 group-hover:scale-[1.04]">
            <PhotoVoiture photo={m.photos[0]} carrosserie={m.carrosserie} alt={`${marque?.nom} ${m.nom}`} className="aspect-[16/10]" credit="incruste" />
          </div>
        </div>
      </Link>
      <div className="absolute left-3 top-3">
        <JaugeScore score={r.score} />
      </div>
      <div className="absolute right-3 top-3">
        <BoutonFavori modeleId={m.id} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-asphalte-500 dark:text-asphalte-400">
          <LogoMarque marque={marque} taille={18} />
          {marque?.nom}
          <span className="ml-auto font-normal normal-case tracking-normal">{m.carrosserie}</span>
        </div>
        <Link to={lien} className="mt-1">
          <h3 className="font-display text-2xl font-bold leading-tight group-hover:text-accent-600">{m.nom}</h3>
          <p className="truncate text-sm text-asphalte-500 dark:text-asphalte-400">{v ? v.nom : "Fiche technique non disponible"}</p>
        </Link>
        {v ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${COULEUR_ENERGIE[v.energie]}`}>{v.energie}</span>
              {v.puissanceCh !== null && <span className="rounded-full bg-asphalte-100 px-2 py-0.5 font-semibold dark:bg-asphalte-800">{v.puissanceCh} ch</span>}
              <span className="rounded-full bg-asphalte-100 px-2 py-0.5 dark:bg-asphalte-800">{v.boite}</span>
              {conso(v) && <span className="rounded-full bg-asphalte-100 px-2 py-0.5 dark:bg-asphalte-800">{conso(v)}</span>}
            </div>
            <div className="mt-auto flex items-end justify-between pt-4">
              <p className="font-display text-2xl font-bold text-asphalte-900 dark:text-white">{prix(v.prixNeufEuros)}</p>
              <button
                type="button"
                onClick={() => (compare ? retirerComparateur(elt) : ajouterComparateur(elt))}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  compare
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-asphalte-300 text-asphalte-600 hover:border-accent-500 hover:text-accent-600 dark:border-asphalte-600 dark:text-asphalte-300"
                }`}
              >
                {compare ? "✓ Comparée" : "+ Comparer"}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-auto pt-3 text-xs text-asphalte-500">
            {m.anneeDebut ? `Produite ${m.anneeFin ? `de ${m.anneeDebut} à ${m.anneeFin}` : `depuis ${m.anneeDebut}`}` : "Années inconnues"} · Source : Wikidata
          </p>
        )}
        {pointsFaibles.length > 0 && (
          <p className="mt-2 border-t border-dashed border-asphalte-200 pt-2 text-[11px] text-asphalte-500 dark:border-asphalte-700">
            Écarts : {pointsFaibles.map((d) => `${d.critere}${d.inconnu ? " (inconnu)" : ""}`).join(", ")}
          </p>
        )}
      </div>
    </article>
  );
}

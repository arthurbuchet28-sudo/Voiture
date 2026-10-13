// Formulaire complet des critères, utilisé sur l'accueil (grille de sections)
// et dans le panneau latéral des résultats (colonne compacte).
import type { ReactNode } from "react";
import { CARROSSERIES, ENERGIES, type Carrosserie, type Energie } from "../types";
import {
  ANNEE_COURANTE,
  ANNEE_MIN,
  BUDGET_MAX,
  BUDGET_MIN,
  COULEURS,
  PUISSANCE_MAX,
  PUISSANCE_MIN,
  afficheAutonomie,
  type Criteres,
} from "../lib/criteres";
import { nombre } from "../lib/format";
import { Champ, Interrupteur, PucesMultiples, PucesUniques, Section } from "./Controles";
import { CurseurDouble, echellePaliers } from "./CurseurDouble";
import { SelecteurMarques } from "./SelecteurMarques";
import { Silhouette } from "./Silhouette";

const ECHELLE_BUDGET = echellePaliers([BUDGET_MIN, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000, BUDGET_MAX]);
const ECHELLE_PUISSANCE = echellePaliers([PUISSANCE_MIN, 75, 100, 130, 160, 200, 250, 300, 400, 500, 700, PUISSANCE_MAX]);

const LIBELLES_CARROSSERIE: Record<Carrosserie, string> = {
  citadine: "Citadine",
  SUV: "SUV",
  berline: "Berline",
  break: "Break",
  coupé: "Coupé",
  cabriolet: "Cabriolet",
  monospace: "Monospace",
  "pick-up": "Pick-up",
  utilitaire: "Utilitaire",
};

const LIBELLES_ENERGIE: Record<Energie, string> = {
  essence: "Essence",
  diesel: "Diesel",
  hybride: "Hybride",
  "hybride rechargeable": "Hybride rechargeable",
  électrique: "Électrique",
  GPL: "GPL",
  E85: "E85 (bioéthanol)",
};

interface Props {
  criteres: Criteres;
  onChange: (c: Criteres) => void;
  disposition: "accueil" | "panneau";
}

export function FormulaireCriteres({ criteres: c, onChange, disposition }: Props) {
  const maj = (p: Partial<Criteres>) => onChange({ ...c, ...p });
  const panneau = disposition === "panneau";


  const essentiels = (
    <GroupeCriteres panneau={panneau} titre="Les essentiels" sousTitre="Budget, marque, carrosserie, énergie">
      <Champ libelle="Budget" aide="prix neuf" actif={c.budgetMin !== null || c.budgetMax !== null} onEffacer={() => maj({ budgetMin: null, budgetMax: null })}>
        <CurseurDouble
          min={BUDGET_MIN}
          max={BUDGET_MAX}
          pas={500}
          valeurMin={c.budgetMin}
          valeurMax={c.budgetMax}
          echelle={ECHELLE_BUDGET}
          format={(v) => `${nombre(v)} €`}
          libelleMin="Pas de minimum"
          libelleMax="Pas de maximum"
          onChange={(budgetMin, budgetMax) => maj({ budgetMin, budgetMax })}
        />
      </Champ>
      <Champ libelle="Type de carrosserie" actif={c.carrosseries.length > 0} onEffacer={() => maj({ carrosseries: [] })}>
        <div className={`grid gap-2 ${panneau ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-5"}`}>
          {CARROSSERIES.map((type) => {
            const actif = c.carrosseries.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={actif}
                onClick={() => maj({ carrosseries: actif ? c.carrosseries.filter((x) => x !== type) : [...c.carrosseries, type] })}
                className={`group flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-xs font-semibold transition-all ${
                  actif
                    ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-200"
                    : "border-asphalte-200 text-asphalte-600 hover:-translate-y-0.5 hover:border-asphalte-400 dark:border-asphalte-700 dark:text-asphalte-300"
                }`}
              >
                <Silhouette type={type} className={`h-7 w-full ${actif ? "text-accent-500" : "text-asphalte-500 dark:text-asphalte-400"}`} />
                {LIBELLES_CARROSSERIE[type]}
              </button>
            );
          })}
        </div>
      </Champ>
      <Champ libelle="Énergie" aide="critère éliminatoire" actif={c.energies.length > 0} onEffacer={() => maj({ energies: [] })}>
        <PucesMultiples
          options={ENERGIES.map((e) => ({ valeur: e, libelle: LIBELLES_ENERGIE[e] }))}
          valeurs={c.energies}
          onChange={(energies) =>
            maj({
              energies,
              // L'autonomie n'a de sens que pour l'électrique et l'hybride rechargeable.
              ...(energies.includes("électrique") || energies.includes("hybride rechargeable") ? {} : { autonomieMin: null }),
              ...(energies.includes("électrique") ? {} : { consoElecMax: null }),
            })
          }
        />
      </Champ>
      <Champ libelle="Marque" actif={c.marques.length > 0} onEffacer={() => maj({ marques: [] })}>
        <SelecteurMarques valeurs={c.marques} onChange={(marques) => maj({ marques })} />
      </Champ>
    </GroupeCriteres>
  );

  const performances = (
    <GroupeCriteres panneau={panneau} titre="Performances" sousTitre="Puissance, accélération, boîte, transmission">
      <Champ libelle="Puissance" actif={c.puissanceMin !== null || c.puissanceMax !== null} onEffacer={() => maj({ puissanceMin: null, puissanceMax: null })}>
        <CurseurDouble
          min={PUISSANCE_MIN}
          max={PUISSANCE_MAX}
          pas={5}
          valeurMin={c.puissanceMin}
          valeurMax={c.puissanceMax}
          echelle={ECHELLE_PUISSANCE}
          format={(v) => `${v} ch`}
          onChange={(puissanceMin, puissanceMax) => maj({ puissanceMin, puissanceMax })}
        />
      </Champ>
      <Champ libelle="0 à 100 km/h" aide="maximum">
        <PucesUniques
          options={[4, 6, 8, 10, 12].map((s) => ({ valeur: s, libelle: `≤ ${s} s` }))}
          valeur={c.zeroCentMax}
          onChange={(zeroCentMax) => maj({ zeroCentMax })}
        />
      </Champ>
      <Champ libelle="Boîte de vitesses">
        <PucesUniques
          options={[
            { valeur: "manuelle" as const, libelle: "Manuelle" },
            { valeur: "automatique" as const, libelle: "Automatique" },
          ]}
          valeur={c.boite}
          onChange={(boite) => maj({ boite })}
        />
      </Champ>
      <Champ libelle="Transmission">
        <PucesUniques
          options={[
            { valeur: "traction" as const, libelle: "Traction" },
            { valeur: "propulsion" as const, libelle: "Propulsion" },
            { valeur: "intégrale" as const, libelle: "Intégrale (4x4)" },
          ]}
          valeur={c.transmission}
          onChange={(transmission) => maj({ transmission })}
        />
      </Champ>
    </GroupeCriteres>
  );

  const usage = (
    <GroupeCriteres panneau={panneau} titre="Usage" sousTitre="Places, coffre, consommation, vignette">
      <Champ libelle="Nombre de places" aide="minimum, critère éliminatoire">
        <PucesUniques options={[2, 4, 5, 7, 8].map((n) => ({ valeur: n, libelle: `${n}${n >= 7 ? "+" : ""}` }))} valeur={c.placesMin} onChange={(placesMin) => maj({ placesMin })} />
      </Champ>
      <Champ libelle="Volume de coffre" aide="minimum">
        <PucesUniques options={[250, 350, 450, 550, 650].map((n) => ({ valeur: n, libelle: `${n} L` }))} valeur={c.coffreMin} onChange={(coffreMin) => maj({ coffreMin })} />
      </Champ>
      <Champ libelle="Consommation" aide="maximum, thermiques et hybrides">
        <PucesUniques
          options={[3, 4, 5, 6, 7, 8].map((n) => ({ valeur: n, libelle: `${n} L/100` }))}
          valeur={c.consoMax}
          onChange={(consoMax) => maj({ consoMax })}
        />
      </Champ>
      {c.energies.includes("électrique") && (
        <Champ libelle="Consommation électrique" aide="maximum">
          <PucesUniques
            options={[14, 16, 18, 20].map((n) => ({ valeur: n, libelle: `${n} kWh/100` }))}
            valeur={c.consoElecMax}
            onChange={(consoElecMax) => maj({ consoElecMax })}
          />
        </Champ>
      )}
      {afficheAutonomie(c) && (
        <Champ libelle="Autonomie" aide="minimum (électrique WLTP)">
          <PucesUniques
            options={[50, 250, 350, 450, 550].map((n) => ({ valeur: n, libelle: `${n} km` }))}
            valeur={c.autonomieMin}
            onChange={(autonomieMin) => maj({ autonomieMin })}
          />
        </Champ>
      )}
      <Champ libelle="Vignette Crit'Air" aide="au maximum">
        <PucesUniques
          options={[
            { valeur: 0, libelle: <PastilleCritAir n={0} />, titre: "Crit'Air 0 (électrique)" },
            { valeur: 1, libelle: <PastilleCritAir n={1} />, titre: "Crit'Air 1 ou mieux" },
            { valeur: 2, libelle: <PastilleCritAir n={2} />, titre: "Crit'Air 2 ou mieux" },
            { valeur: 3, libelle: <PastilleCritAir n={3} />, titre: "Crit'Air 3 ou mieux" },
          ]}
          valeur={c.critAirMax}
          onChange={(critAirMax) => maj({ critAirMax })}
        />
      </Champ>
    </GroupeCriteres>
  );

  const style = (
    <GroupeCriteres panneau={panneau} titre="Style" sousTitre="Couleur, âge du modèle">
      <Champ libelle="Couleur" actif={c.couleurs.length > 0} onEffacer={() => maj({ couleurs: [] })}>
        <div className="flex flex-wrap gap-2">
          {COULEURS.map((co) => {
            const actif = c.couleurs.includes(co.nom);
            return (
              <button
                key={co.nom}
                type="button"
                title={co.nom}
                aria-label={co.nom}
                aria-pressed={actif}
                onClick={() => maj({ couleurs: actif ? c.couleurs.filter((x) => x !== co.nom) : [...c.couleurs, co.nom] })}
                className={`h-8 w-8 rounded-full border-2 shadow-inner transition-transform hover:scale-110 ${
                  actif ? "scale-110 border-accent-500 ring-2 ring-accent-500/40 ring-offset-2 ring-offset-white dark:ring-offset-asphalte-900" : "border-asphalte-200 dark:border-asphalte-600"
                }`}
                style={{ background: co.hex }}
              />
            );
          })}
        </div>
      </Champ>
      <Champ libelle="Modèles">
        <div className="space-y-3">
          <PucesUniques
            peuImporte={false}
            options={[
              { valeur: "neuve", libelle: "Neuves uniquement" },
              { valeur: "anciens", libelle: "Inclure les modèles plus anciens" },
            ]}
            valeur={c.neuveUniquement ? "neuve" : "anciens"}
            onChange={(v) => maj({ neuveUniquement: v !== "anciens", ...(v !== "anciens" ? { anneeMin: null, anneeMax: null } : {}) })}
          />
          {!c.neuveUniquement && (
            <CurseurDouble
              min={ANNEE_MIN}
              max={ANNEE_COURANTE}
              pas={1}
              valeurMin={c.anneeMin}
              valeurMax={c.anneeMax}
              format={(v) => String(v)}
              libelleMin={`Avant ${ANNEE_MIN + 1}`}
              libelleMax="Aujourd'hui"
              onChange={(anneeMin, anneeMax) => maj({ anneeMin, anneeMax })}
            />
          )}
          <Interrupteur
            actif={c.inclureIncompletes}
            onChange={(inclureIncompletes) => maj({ inclureIncompletes })}
            libelle={<span className="text-asphalte-600 dark:text-asphalte-300">Inclure les modèles sans fiche technique (données Wikidata seules)</span>}
          />
        </div>
      </Champ>
    </GroupeCriteres>
  );

  if (panneau)
    return (
      <div>
        {essentiels}
        {performances}
        {usage}
        {style}
      </div>
    );
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:row-span-2">{essentiels}</div>
      {performances}
      {usage}
      <div className="lg:col-span-2">{style}</div>
    </div>
  );
}

// Défini hors du formulaire pour ne pas être recréé à chaque rendu (sinon les champs perdraient le focus).
function GroupeCriteres({ panneau, titre, sousTitre, children }: { panneau: boolean; titre: string; sousTitre?: string; children: ReactNode }) {
  return panneau ? (
    <details open className="group border-b border-asphalte-200 py-4 dark:border-asphalte-800">
      <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-bold uppercase tracking-wide">
        {titre}
        <span className="text-asphalte-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4 space-y-5">{children}</div>
    </details>
  ) : (
    <Section titre={titre} sousTitre={sousTitre}>
      {children}
    </Section>
  );
}

export function PastilleCritAir({ n }: { n: number }) {
  const couleurs = ["bg-emerald-500", "bg-violet-600", "bg-yellow-400", "bg-orange-500"];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-full ring-1 ring-black/10 ${couleurs[n]}`} />
      {n}
    </span>
  );
}

export { LIBELLES_CARROSSERIE, LIBELLES_ENERGIE };

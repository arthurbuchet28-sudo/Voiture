// Petits contrôles réutilisables du formulaire de critères.
import type { ReactNode } from "react";

export function Section({ titre, sousTitre, children, className = "" }: { titre: string; sousTitre?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-asphalte-200 bg-white p-5 shadow-carte dark:border-asphalte-800 dark:bg-asphalte-900 ${className}`}>
      <header className="mb-4 flex items-baseline gap-3">
        <span className="h-4 w-1 self-center rounded-full bg-accent-500" />
        <h2 className="font-display text-xl font-bold uppercase tracking-wide">{titre}</h2>
        {sousTitre && <p className="text-sm text-asphalte-500 dark:text-asphalte-400">{sousTitre}</p>}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Champ({ libelle, aide, children, actif, onEffacer }: { libelle: string; aide?: string; children: ReactNode; actif?: boolean; onEffacer?: () => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-asphalte-700 dark:text-asphalte-200">
          {libelle}
          {aide && <span className="ml-2 font-normal text-asphalte-400">{aide}</span>}
        </span>
        {actif && onEffacer && (
          <button type="button" onClick={onEffacer} className="text-xs text-asphalte-400 hover:text-accent-600">
            Effacer
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

interface OptionPuce<T> {
  valeur: T;
  libelle: ReactNode;
  titre?: string;
}

/** Puces à choix unique : recliquer sur l'option active la désélectionne (= peu importe). */
export function PucesUniques<T extends string | number>({
  options,
  valeur,
  onChange,
  peuImporte = true,
}: {
  options: OptionPuce<T>[];
  valeur: T | null;
  onChange: (v: T | null) => void;
  peuImporte?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {peuImporte && (
        <Puce actif={valeur === null} onClick={() => onChange(null)}>
          Peu importe
        </Puce>
      )}
      {options.map((o) => (
        <Puce key={String(o.valeur)} actif={valeur === o.valeur} titre={o.titre} onClick={() => onChange(valeur === o.valeur ? null : o.valeur)}>
          {o.libelle}
        </Puce>
      ))}
    </div>
  );
}

export function PucesMultiples<T extends string>({ options, valeurs, onChange }: { options: OptionPuce<T>[]; valeurs: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const actif = valeurs.includes(o.valeur);
        return (
          <Puce key={o.valeur} actif={actif} titre={o.titre} onClick={() => onChange(actif ? valeurs.filter((v) => v !== o.valeur) : [...valeurs, o.valeur])}>
            {o.libelle}
          </Puce>
        );
      })}
    </div>
  );
}

export function Puce({ actif, onClick, children, titre }: { actif: boolean; onClick: () => void; children: ReactNode; titre?: string }) {
  return (
    <button
      type="button"
      title={titre}
      aria-pressed={actif}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        actif
          ? "border-accent-500 bg-accent-500 text-white shadow-sm"
          : "border-asphalte-200 bg-asphalte-50 text-asphalte-700 hover:border-asphalte-400 dark:border-asphalte-700 dark:bg-asphalte-800 dark:text-asphalte-200 dark:hover:border-asphalte-500"
      }`}
    >
      {children}
    </button>
  );
}

export function Interrupteur({ actif, onChange, libelle }: { actif: boolean; onChange: (v: boolean) => void; libelle: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        onClick={() => onChange(!actif)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${actif ? "bg-accent-500" : "bg-asphalte-300 dark:bg-asphalte-600"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${actif ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <span>{libelle}</span>
    </label>
  );
}

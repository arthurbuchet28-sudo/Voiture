// Curseur à deux poignées (min / max). Les valeurs extrêmes signifient « pas de limite » (null).
import { useId } from "react";

interface Props {
  min: number;
  max: number;
  pas: number;
  valeurMin: number | null;
  valeurMax: number | null;
  onChange: (min: number | null, max: number | null) => void;
  format: (v: number) => string;
  /** Transformation non linéaire facultative (position 0..1000 <-> valeur). */
  echelle?: { versValeur: (p: number) => number; versPosition: (v: number) => number };
  libelleMax?: string;
  libelleMin?: string;
}

const POS_MAX = 1000;

export function CurseurDouble({ min, max, pas, valeurMin, valeurMax, onChange, format, echelle, libelleMax, libelleMin }: Props) {
  const id = useId();
  const versPos = (v: number) => (echelle ? echelle.versPosition(v) : ((v - min) / (max - min)) * POS_MAX);
  const versVal = (p: number) => {
    const brut = echelle ? echelle.versValeur(p) : min + (p / POS_MAX) * (max - min);
    return Math.min(max, Math.max(min, Math.round(brut / pas) * pas));
  };
  const pMin = valeurMin === null ? 0 : versPos(valeurMin);
  const pMax = valeurMax === null ? POS_MAX : versPos(valeurMax);

  const changerMin = (p: number) => {
    const pos = Math.min(p, pMax - 10);
    onChange(pos <= 0 ? null : versVal(pos), valeurMax);
  };
  const changerMax = (p: number) => {
    const pos = Math.max(p, pMin + 10);
    onChange(valeurMin, pos >= POS_MAX ? null : versVal(pos));
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2 font-display text-lg font-semibold tabular-nums">
        <span className={valeurMin === null ? "text-asphalte-400" : ""}>{valeurMin === null ? libelleMin ?? format(min) : format(valeurMin)}</span>
        <span className="h-px flex-1 bg-asphalte-200 dark:bg-asphalte-700" />
        <span className={valeurMax === null ? "text-asphalte-400" : ""}>{valeurMax === null ? libelleMax ?? `${format(max)}+` : format(valeurMax)}</span>
      </div>
      <div className="curseur-double relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-asphalte-200 dark:bg-asphalte-700" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent-500"
          style={{ left: `${pMin / 10}%`, right: `${100 - pMax / 10}%` }}
        />
        <input
          id={`${id}-min`}
          aria-label="Minimum"
          type="range"
          min={0}
          max={POS_MAX}
          value={pMin}
          onChange={(e) => changerMin(Number(e.target.value))}
          className="absolute inset-0 w-full"
        />
        <input
          id={`${id}-max`}
          aria-label="Maximum"
          type="range"
          min={0}
          max={POS_MAX}
          value={pMax}
          onChange={(e) => changerMax(Number(e.target.value))}
          className="absolute inset-0 w-full"
        />
      </div>
    </div>
  );
}

/** Échelle par paliers : linéaire par morceaux entre des valeurs repères réparties uniformément. */
export function echellePaliers(reperes: number[]) {
  const n = reperes.length - 1;
  return {
    versValeur: (p: number) => {
      const t = (p / POS_MAX) * n;
      const i = Math.min(n - 1, Math.floor(t));
      return reperes[i] + (t - i) * (reperes[i + 1] - reperes[i]);
    },
    versPosition: (v: number) => {
      for (let i = 0; i < n; i++) {
        if (v <= reperes[i + 1]) return ((i + (v - reperes[i]) / (reperes[i + 1] - reperes[i])) / n) * POS_MAX;
      }
      return POS_MAX;
    },
  };
}

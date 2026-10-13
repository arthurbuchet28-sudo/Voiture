import type { Energie, Version } from "../types";

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const entier = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export const prix = (v: number | null | undefined) => (v === null || v === undefined ? "Prix inconnu" : euros.format(v));
export const nombre = (v: number) => entier.format(v);
export const dec = (v: number) => decimal.format(v);

export const uniteConso = (e: Energie) => (e === "électrique" ? "kWh/100 km" : "L/100 km");

export function conso(v: Version): string | null {
  if (v.consommation === null) return null;
  return `${dec(v.consommation)} ${uniteConso(v.energie)}`;
}

export const periode = (debut: number | null, fin: number | null) => {
  if (debut === null && fin === null) return "Années inconnues";
  if (fin === null) return `Depuis ${debut}`;
  return `${debut ?? "?"} – ${fin}`;
};

export const COULEUR_ENERGIE: Record<Energie, string> = {
  essence: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  diesel: "bg-stone-200 text-stone-800 dark:bg-stone-500/20 dark:text-stone-300",
  hybride: "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300",
  "hybride rechargeable": "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300",
  électrique: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  GPL: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  E85: "bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300",
};

export const ETIQUETTE_CRITAIR: Record<string, string> = {
  "0": "bg-emerald-500 text-white",
  "1": "bg-violet-600 text-white",
  "2": "bg-yellow-400 text-asphalte-900",
  "3": "bg-orange-500 text-white",
  "4": "bg-rose-800 text-white",
  "5": "bg-stone-600 text-white",
};

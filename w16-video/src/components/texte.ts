const NBSP = " ";

/** Typographie française : espace insécable avant : ; ? ! » et après «. */
export const fr = (s: string): string =>
  s
    .replace(/ ([:;?!»])/g, `${NBSP}$1`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/(\d) (\d{3})/g, `$1${NBSP}$2`);

/** Nombre au format français : 1 600 ; 8,0. */
export const nombreFr = (n: number, decimales = 0): string => {
  const [entier, dec] = n.toFixed(decimales).split(".");
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return dec ? `${groupe},${dec}` : groupe;
};

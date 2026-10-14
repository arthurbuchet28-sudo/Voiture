/** Point à une distance r du centre, angle en degrés mesuré depuis la verticale (sens horaire). */
export const polaire = (cx: number, cy: number, r: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
};

/** Chemin SVG d'un arc de cercle entre deux angles (depuis la verticale). */
export const arcPath = (cx: number, cy: number, r: number, de: number, a: number) => {
  const p1 = polaire(cx, cy, r, de);
  const p2 = polaire(cx, cy, r, a);
  const grand = Math.abs(a - de) > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${grand} 1 ${p2.x} ${p2.y}`;
};

/** Position le long d'une ligne brisée, t entre 0 et 1. */
export const surPolyligne = (pts: readonly (readonly [number, number])[], t: number) => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((s, l) => s + l, 0);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] === 0 ? 0 : d / segs[i];
      return {
        x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
        y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
      };
    }
    d -= segs[i];
  }
  return { x: pts[0][0], y: pts[0][1] };
};

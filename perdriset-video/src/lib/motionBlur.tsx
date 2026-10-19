import React, { useId } from "react";

/**
 * Flou de mouvement directionnel (SVG feGaussianBlur avec écart-type x/y distinct).
 * Ne s'active que si le mouvement est assez rapide pour rester léger au rendu.
 */
export const DirectionalBlur: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, children, style }) => {
  const id = "mb" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const bx = Math.max(0, x);
  const by = Math.max(0, y);
  const active = bx > 0.25 || by > 0.25;
  return (
    <>
      {active ? (
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: active ? `url(#${id})` : undefined,
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
};

/** Vitesse instantanée d'une valeur animée (unités / frame). */
export const velocity = (fn: (f: number) => number, frame: number) =>
  fn(frame) - fn(frame - 1);

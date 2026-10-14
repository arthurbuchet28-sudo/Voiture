import { AbsoluteFill } from "remotion";
import { COLORS } from "../config";

/** Fond anthracite avec halo bleu discret et grille technique. */
export const Fond: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 80% 70% at 50% 40%, ${COLORS.fondClair} 0%, ${COLORS.fond} 70%)`,
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(127,176,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(127,176,255,0.035) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
    {children}
  </AbsoluteFill>
);

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TEXTES } from "../config";
import { FONT_TEXTE, FONT_TITRE } from "../fonts";
import { Fond } from "../components/Fond";
import { SousTitres } from "../components/SousTitres";
import { TitreScene } from "../components/TitreScene";
import { fr } from "../components/texte";

const T = TEXTES.compacite;

// Vue de dessus schématique : cercles = cylindres. Pas entre deux cylindres d'une rangée.
const PAS = 64;
const R = 24;
const MARGE = 22;
const X0 = 440;

type Bloc = {
  y: number;
  rangees: { dy: number; dx: number; n: number; couleur: string }[];
  debut: number; // secondes
};

const BLOCS: Bloc[] = [
  {
    y: 215,
    debut: 0.3,
    rangees: [
      { dy: 0, dx: 0, n: 8, couleur: COLORS.argent },
      { dy: 58, dx: 22, n: 8, couleur: COLORS.argent },
    ],
  },
  {
    y: 395,
    debut: 1.4,
    rangees: [
      { dy: 0, dx: 0, n: 6, couleur: COLORS.argentFonce },
      { dy: 58, dx: 22, n: 6, couleur: COLORS.argentFonce },
    ],
  },
  {
    y: 575,
    debut: 5,
    rangees: [
      { dy: 0, dx: 0, n: 4, couleur: COLORS.bleu },
      { dy: 50, dx: 32, n: 4, couleur: COLORS.bleuClair },
      { dy: 132, dx: 0, n: 4, couleur: COLORS.argent },
      { dy: 182, dx: 32, n: 4, couleur: "#8f98a6" },
    ],
  },
];

const dimensions = (b: Bloc) => {
  const largeur = Math.max(...b.rangees.map((r) => r.dx + (r.n - 1) * PAS)) + 2 * (R + MARGE);
  const hauteur = Math.max(...b.rangees.map((r) => r.dy)) + 2 * (R + MARGE);
  return { largeur, hauteur };
};

export const Scene3Compacite: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const longueurV12 = dimensions(BLOCS[1]).largeur;
  const repere = interpolate(frame, [6.2 * fps, 7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const message = spring({ frame: frame - Math.round(5.8 * fps), fps, config: { damping: 200 } });

  return (
    <Fond>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {BLOCS.map((b, i) => {
          const { largeur, hauteur } = dimensions(b);
          const p = spring({ frame: frame - Math.round(b.debut * fps), fps, config: { damping: 200 } });
          const estW = i === 2;
          return (
            <g key={i} opacity={Math.min(1, p * 2)}>
              <rect
                x={X0}
                y={b.y}
                width={largeur * p}
                height={hauteur}
                rx={28}
                fill={estW ? "rgba(47,107,255,0.10)" : "rgba(201,206,214,0.05)"}
                stroke={estW ? COLORS.bleu : COLORS.argentFonce}
                strokeWidth={estW ? 4 : 2.5}
              />
              {b.rangees.map((r, ri) =>
                Array.from({ length: r.n }).map((_, k) => {
                  const cx = X0 + R + MARGE + r.dx + k * PAS;
                  const cyl = interpolate(
                    frame,
                    [b.debut * fps + 6 + k * 2 + ri, b.debut * fps + 14 + k * 2 + ri],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                  );
                  return (
                    <circle
                      key={`${ri}-${k}`}
                      cx={cx}
                      cy={b.y + R + MARGE + r.dy}
                      r={R * cyl}
                      fill={r.couleur}
                      fillOpacity={0.3}
                      stroke={r.couleur}
                      strokeWidth={3}
                    />
                  );
                }),
              )}
            </g>
          );
        })}

        {/* Repère : longueur d'un V12 reportée sur la ligne du W16 */}
        <g opacity={repere}>
          <line
            x1={X0 + longueurV12}
            x2={X0 + longueurV12}
            y1={BLOCS[1].y}
            y2={BLOCS[2].y + dimensions(BLOCS[2]).hauteur + 10}
            stroke={COLORS.argentFonce}
            strokeWidth={2}
            strokeDasharray="8 10"
          />
          <text
            x={X0 + longueurV12 + 14}
            y={BLOCS[2].y + 40}
            fill={COLORS.texteDoux}
            fontFamily={FONT_TEXTE}
            fontSize={24}
          >
            {T.repereV12}
          </text>
        </g>
      </svg>

      <TitreScene numero={3} titre={T.titre} />

      {/* Noms des moteurs */}
      {BLOCS.map((b, i) => {
        const p = spring({ frame: frame - Math.round(b.debut * fps), fps, config: { damping: 200 } });
        const { hauteur } = dimensions(b);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 96,
              width: 310,
              top: b.y + hauteur / 2 - 46,
              opacity: p,
              transform: `translateX(${interpolate(p, [0, 1], [-20, 0])}px)`,
            }}
          >
            <div
              style={{
                fontFamily: FONT_TITRE,
                fontWeight: 800,
                fontSize: 52,
                color: i === 2 ? COLORS.bleuClair : COLORS.texte,
              }}
            >
              {T.blocs[i].nom}
            </div>
            <div style={{ fontFamily: FONT_TEXTE, fontSize: 24, color: COLORS.texteDoux }}>
              {fr(T.blocs[i].detail)}
            </div>
          </div>
        );
      })}

      {/* Message principal */}
      <div
        style={{
          position: "absolute",
          left: 1210,
          width: 600,
          top: 330,
          padding: "36px 40px",
          borderRadius: 20,
          background: COLORS.panneau,
          border: `2px solid ${COLORS.bleu}`,
          fontFamily: FONT_TITRE,
          fontWeight: 700,
          fontSize: 44,
          lineHeight: 1.3,
          color: COLORS.texte,
          opacity: message,
          transform: `translateY(${interpolate(message, [0, 1], [24, 0])}px)`,
        }}
      >
        {fr(T.message)}
      </div>

      <SousTitres items={T.sousTitres} />
    </Fond>
  );
};

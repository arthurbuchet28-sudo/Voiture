// Silhouettes génériques (vue de profil) par type de carrosserie : icônes des boutons
// et illustration de remplacement quand un modèle n'a pas de photo libre.
import type { Carrosserie } from "../types";

interface Forme {
  caisse: string;
  vitres?: string;
  roues: [number, number];
}

// viewBox 0 0 200 80, sol à y = 64, roues de rayon 11.
const FORMES: Record<Carrosserie, Forme> = {
  citadine: {
    caisse: "M26 62 C20 62 18 58 18 52 L19 44 C20 40 24 38 30 37 L52 34 L72 18 C76 15 80 14 86 14 L128 14 C136 14 140 17 144 23 L156 40 C162 42 166 46 166 52 L166 58 C166 61 164 62 161 62 Z",
    vitres: "M60 35 L77 21 C79 19 82 18 86 18 L104 18 L104 35 Z M110 18 L127 18 C132 18 135 20 138 25 L146 36 L110 36 Z",
    roues: [50, 136],
  },
  berline: {
    caisse: "M18 62 C12 62 10 58 10 53 L11 46 C12 42 16 40 22 39 L56 35 L80 19 C84 16 89 15 95 15 L124 15 C131 15 136 17 141 21 L160 36 L182 39 C187 40 190 43 190 48 L190 57 C190 60 188 62 185 62 Z",
    vitres: "M65 35 L84 22 C86 20 89 19 93 19 L112 19 L112 35 Z M118 19 L124 19 C129 19 133 21 137 24 L151 35 L118 35 Z",
    roues: [44, 156],
  },
  break: {
    caisse: "M18 62 C12 62 10 58 10 53 L11 46 C12 42 16 40 22 39 L54 35 L76 18 C80 15 85 14 91 14 L176 14 C181 14 184 17 185 22 L189 40 C190 43 190 46 190 49 L190 57 C190 60 188 62 185 62 Z",
    vitres: "M62 35 L80 21 C82 19 85 18 89 18 L110 18 L110 35 Z M116 18 L150 18 L150 35 L116 35 Z M156 18 L174 18 C177 18 179 20 180 23 L183 35 L156 35 Z",
    roues: [44, 156],
  },
  SUV: {
    caisse: "M20 60 C14 60 12 56 12 50 L13 40 C14 36 18 34 24 33 L50 30 L68 12 C72 8 77 7 83 7 L170 7 C176 7 179 10 181 15 L186 32 C188 36 189 40 189 45 L189 56 C189 59 187 60 184 60 Z",
    vitres: "M58 30 L72 15 C74 13 77 12 81 12 L110 12 L110 30 Z M116 12 L148 12 L148 30 L116 30 Z M154 12 L169 12 C173 12 175 14 176 17 L180 29 L154 30 Z",
    roues: [46, 154],
  },
  monospace: {
    caisse: "M20 62 C14 62 12 58 12 52 L13 44 C14 40 18 38 24 37 L40 34 L66 10 C70 7 75 6 81 6 L172 6 C178 6 181 9 183 14 L188 34 C189 38 190 42 190 47 L190 57 C190 60 188 62 185 62 Z",
    vitres: "M50 34 L70 14 C72 12 75 11 79 11 L106 11 L106 34 Z M112 11 L144 11 L144 34 L112 34 Z M150 11 L170 11 C174 11 176 13 177 16 L182 33 L150 34 Z",
    roues: [46, 156],
  },
  coupé: {
    caisse: "M18 62 C12 62 10 58 10 53 L11 47 C12 43 16 41 22 40 L64 35 L92 21 C97 19 102 18 108 18 L126 18 C134 18 140 21 146 26 L166 38 L182 41 C187 42 190 45 190 50 L190 57 C190 60 188 62 185 62 Z",
    vitres: "M74 35 L95 24 C98 22 102 21 106 21 L120 21 L120 35 Z M126 21 C132 21 137 23 141 27 L152 35 L126 35 Z",
    roues: [46, 158],
  },
  cabriolet: {
    caisse: "M18 62 C12 62 10 58 10 53 L11 47 C12 43 16 41 22 40 L70 36 L84 22 L88 22 L80 36 L166 36 L182 40 C187 41 190 44 190 49 L190 57 C190 60 188 62 185 62 Z",
    vitres: "M118 36 C118 30 124 27 130 27 L140 27 C146 27 150 31 150 36 Z",
    roues: [46, 158],
  },
  "pick-up": {
    caisse: "M18 60 C12 60 10 56 10 50 L11 40 C12 36 16 34 22 33 L44 30 L62 12 C66 8 71 7 77 7 L112 7 C117 7 120 10 120 15 L120 32 L188 32 C190 32 191 33 191 35 L191 56 C191 59 189 60 186 60 Z",
    vitres: "M52 30 L66 15 C68 13 71 12 75 12 L92 12 L92 30 Z M98 12 L112 12 C114 12 115 13 115 15 L115 30 L98 30 Z",
    roues: [44, 158],
  },
  utilitaire: {
    caisse: "M18 62 C12 62 10 58 10 52 L11 42 C12 38 16 36 22 35 L32 33 L50 8 C53 5 57 4 62 4 L182 4 C187 4 190 7 190 12 L190 58 C190 61 188 62 185 62 Z",
    vitres: "M40 33 L54 12 C56 10 59 9 63 9 L80 9 L80 33 Z",
    roues: [44, 158],
  },
};

export function Silhouette({ type, className = "" }: { type: Carrosserie; className?: string }) {
  const f = FORMES[type];
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden="true" fill="none">
      <path d={f.caisse} fill="currentColor" opacity="0.9" />
      {f.vitres && <path d={f.vitres} className="fill-white/60 dark:fill-black/40" />}
      {f.roues.map((x) => (
        <g key={x}>
          <circle cx={x} cy={62} r={12} className="fill-asphalte-900 dark:fill-asphalte-950" />
          <circle cx={x} cy={62} r={5.5} className="fill-asphalte-300 dark:fill-asphalte-500" />
        </g>
      ))}
    </svg>
  );
}

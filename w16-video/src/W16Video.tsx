import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import TIMINGS from "./voix-off-timings.json";
import { AUDIO, COLORS, DUREES, TRANSITION_S, VIDEO, VOIX_DEBUT, type CleScene } from "./config";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2PourquoiW } from "./scenes/Scene2PourquoiW";
import { Scene3Compacite } from "./scenes/Scene3Compacite";
import { Scene4QuatreTemps } from "./scenes/Scene4QuatreTemps";
import { Scene5Turbos } from "./scenes/Scene5Turbos";
import { Scene6Refroidissement } from "./scenes/Scene6Refroidissement";
import { Scene7Chiffres } from "./scenes/Scene7Chiffres";
import { Scene8Conclusion } from "./scenes/Scene8Conclusion";

/** Ordre des scènes. Chaque clé renvoie à une durée de DUREES (config.ts). */
const SCENES: { cle: CleScene; Composant: React.FC }[] = [
  { cle: "intro", Composant: Scene1Intro },
  { cle: "pourquoiW", Composant: Scene2PourquoiW },
  { cle: "compacite", Composant: Scene3Compacite },
  { cle: "quatreTemps", Composant: Scene4QuatreTemps },
  { cle: "turbos", Composant: Scene5Turbos },
  { cle: "refroidissement", Composant: Scene6Refroidissement },
  { cle: "chiffres", Composant: Scene7Chiffres },
  { cle: "conclusion", Composant: Scene8Conclusion },
];

export const TRANSITION_IMAGES = Math.round(TRANSITION_S * VIDEO.fps);

const images = (s: number) => Math.round(s * VIDEO.fps);

/**
 * Durée totale = somme des durées de DUREES. Chaque scène (sauf la dernière) est prolongée
 * de la durée du fondu, qui la superpose au début de la suivante : les fondus ne
 * raccourcissent donc pas la vidéo et chaque scène commence à l'instant prévu.
 */
export const DUREE_TOTALE_IMAGES = SCENES.reduce((s, sc) => s + images(DUREES[sc.cle]), 0);

/** Image de début de chaque scène dans la vidéo complète. */
const DEBUTS = SCENES.map((_, i) => SCENES.slice(0, i).reduce((s, sc) => s + images(DUREES[sc.cle]), 0));

export const W16Video: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.fond }}>
    <TransitionSeries>
      {SCENES.flatMap(({ cle, Composant }, i) => {
        const derniere = i === SCENES.length - 1;
        const elements = [
          <TransitionSeries.Sequence
            key={cle}
            durationInFrames={images(DUREES[cle]) + (derniere ? 0 : TRANSITION_IMAGES)}
          >
            <Composant />
          </TransitionSeries.Sequence>,
        ];
        if (!derniere) {
          elements.push(
            <TransitionSeries.Transition
              key={`${cle}-fondu`}
              presentation={fade()}
              timing={linearTiming({ durationInFrames: TRANSITION_IMAGES })}
            />,
          );
        }
        return elements;
      })}
    </TransitionSeries>
    {/* Voix off : un fichier par scène, calé sur le début de la scène + VOIX_DEBUT */}
    {AUDIO.voixOff
      ? SCENES.map(({ cle }, i) => (
          <Sequence key={cle} from={DEBUTS[i] + images(VOIX_DEBUT)} layout="none" name={`Voix ${cle}`}>
            <Audio src={staticFile(TIMINGS[cle].fichier)} volume={AUDIO.volumeVoix} />
          </Sequence>
        ))
      : null}
    {/* Musique de fond facultative, nettement sous la voix (voir AUDIO dans config.ts) */}
    {AUDIO.musique ? <Audio src={staticFile(AUDIO.musique)} volume={AUDIO.volumeMusique} loop /> : null}
  </AbsoluteFill>
);

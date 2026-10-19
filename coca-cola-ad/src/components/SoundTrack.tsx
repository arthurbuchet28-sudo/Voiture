import React from "react";
import { Audio, Sequence, getStaticFiles, interpolate, staticFile } from "remotion";
import { AUDIO, CLIMAX, TOTAL_FRAMES, sceneStart } from "../config";
import { CLAMP } from "../lib/motion";

/**
 * Bande son optionnelle. Déposez public/music.mp3 et public/sfx-open.mp3 :
 * chaque fichier n'est joué que s'il existe, la vidéo se rend sans eux.
 */
const hasFile = (name: string) => getStaticFiles().some((f) => f.name === name);

export const SoundTrack: React.FC = () => {
  if (!AUDIO.enabled) return null;
  const music = hasFile(AUDIO.music);
  const sfx = hasFile(AUDIO.sfxOpen);

  return (
    <>
      {music && (
        <Audio
          src={staticFile(AUDIO.music)}
          volume={(f) =>
            AUDIO.musicVolume *
            interpolate(f, [0, 8, TOTAL_FRAMES - AUDIO.musicFadeOutFrames, TOTAL_FRAMES], [0, 1, 1, 0], CLAMP)
          }
        />
      )}
      {sfx && (
        // Calé sur l'ouverture de la canette (scène Climax).
        <Sequence from={sceneStart("climax") + CLIMAX.openAt - 2} layout="none">
          <Audio src={staticFile(AUDIO.sfxOpen)} volume={AUDIO.sfxVolume} />
        </Sequence>
      )}
    </>
  );
};

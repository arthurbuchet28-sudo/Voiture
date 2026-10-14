# Vidéo « Le temps passe-t-il pareil pour tout le monde ? »

Vidéo de vulgarisation scientifique en français (1920×1080, 30 fps, H.264, ~5 min),
entièrement générée par du code : animations en **Remotion** (React + TypeScript),
voix off **edge-tts** (`fr-FR-HenriNeural`, débit −5 %), musique d'ambiance synthétisée avec ffmpeg.

- `script.md` : script final (scènes, textes à l'écran, voix off, visuels, vérification des chiffres).
- `tts/narration.json` : texte exact de la voix off, scène par scène.
- `tts/generate.py` : génère `public/audio/sN.mp3`, les timings mot à mot (`src/data/timings.json`)
  et les sous-titres `sous-titres.srt`. La durée de chaque scène est calée sur l'audio réel.
- `tts/musique.sh` : nappe musicale libre de droits (synthèse ffmpeg), mixée à ~10 %.
- `src/scenes/` : une scène React par partie ; les apparitions sont synchronisées sur l'instant
  où la voix prononce un mot (`w('muons')`).

## Refaire la vidéo

```bash
pip install edge-tts
npm install
npm run tts                      # voix off + timings + sous-titres .srt
./tts/musique.sh                 # musique d'ambiance
npm run studio                   # prévisualisation interactive
npm run render                   # out/le-temps.mp4 (sans sous-titres incrustés)
npm run render:sub               # out/le-temps-sous-titres.mp4 (sous-titres incrustés)
```

Le fichier `.srt` peut aussi être chargé dans n'importe quel lecteur (VLC, YouTube…) pour
activer/désactiver les sous-titres à volonté.

Police : Inter (SIL Open Font License, voir `public/fonts/LICENSE-Inter.txt`).

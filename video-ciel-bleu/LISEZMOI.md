# Pourquoi le ciel est bleu (et les couchers de soleil orange)

Vidéo explicative de 2 min 02 s, 1920×1080, 30 i/s, MP4 (H.264 + AAC).

- `pourquoi-le-ciel-est-bleu.mp4` : la vidéo finale.
- `script_voix.py` : texte de la voix off, scène par scène.
- `generer_voix.py` : génère un MP3 par scène avec edge-tts (voix fr-FR-DeniseNeural, débit +8 %)
  et l'horodatage de chaque mot (`build/audio/timings.json`).
- `rendu.py` : dessine toutes les animations par le code (pycairo), cale chaque scène sur sa voix
  (marge de 0,5 s après le dernier mot, puis fondu enchaîné de 0,6 s) et assemble avec ffmpeg.
  Les visuels et mots-clés à l'écran sont déclenchés sur les mots prononcés.

## Régénérer

```
pip install edge-tts pycairo
python3 generer_voix.py
python3 rendu.py              # vidéo complète
python3 rendu.py --apercu 44  # image PNG à t = 44 s dans build/apercu
```

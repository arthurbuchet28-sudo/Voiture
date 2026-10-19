# Pub Perdriset Motoculture — Remotion (28 s)

Composition `Perdriset` (1920×1080, 60 fps, 1680 frames, H.264 CRF 16, `yuv420p`).
Elle reprend le style, l'architecture et les utilitaires de la pub « Promptly » (`PubSite`) :
fondus enchaînés flou + zoom, caméra globale qui ne s'arrête jamais, ressorts, flou de mouvement,
traînées néon, particules qui convergent, grain et vignettage. Police Inter.
Musique : composition originale générée par `scripts/musique.py` (synthèse, donc libre de droits), 120 BPM.
Une montée amène le logo, un impact le marque, des « whoosh » accompagnent chaque changement de scène, et un impact final ouvre l'appel à l'action.
Le mastering donne `public/musique.wav` (−16 LUFS, crête −1,5 dBTP) :

```bash
python3 scripts/musique.py /tmp/musique-brute.wav
ffmpeg -i /tmp/musique-brute.wav -af "aecho=0.8:0.6:60|120:0.25|0.15,highpass=f=30,atrim=0:28,afade=t=out:st=27.4:d=0.6,loudnorm=I=-16:TP=-1.5:LRA=9" -ar 44100 -c:a pcm_s16le public/musique.wav
```

```bash
npm install
npm run dev      # Remotion Studio
npm run render   # rendu final → out/perdriset-motoculture.mp4
```

| Scène | Temps | Contenu |
|---|---|---|
| 1 | 0-3 s | Accroche « Votre jardin mérite le meilleur. » sur fond de pelouse |
| 2 | 3-6 s | Logo + « Votre spécialiste motoculture à Bourg-en-Bresse » |
| 3 | 6-11 s | Les 4 univers (photos) en perspective, reliés par des lignes de lumière |
| 4 | 11-15 s | Les 8 marques phares, en texte |
| 5 | 15-19,8 s | Services, à côté de la photo du magasin |
| 6 | 19,8-23,8 s | Compteur 0 → 30 « ans d'expertise » + équipe / particuliers & pros |
| 7 | 23,8-28 s | Logo, villes, perdriset.fr, 04 74 22 31 26 (affichés plus de 3 s) |

**Modifier** : tous les textes, les couleurs (`accent` et `accent2`, extraites du logo) et les durées se règlent dans `src/config.ts`.
Les visuels se trouvent dans `public/`. Ils viennent de perdriset.fr, et le logo a été agrandi ×3 (Lanczos).

---

# Version ludique et dynamique — `PerdrisetFun` (28 s)

Composition `PerdrisetFun` (même format : 1920×1080, 60 fps, H.264), dans `src/fun/`. Elle réutilise `src/lib/`, `src/components/` et `src/theme.ts`.
Le rythme est calé sur 120 BPM (un temps = 30 frames). Les ressorts rebondissent, avec du squash & stretch. L'enchaînement utilise `@remotion/transitions` (`TransitionSeries`) et 9 présentations personnalisées : `src/fun/transitions/presentations.tsx`.

```bash
npm run render:fun   # → out/perdriset-motoculture-fun.mp4
```

| Raccord | Transition |
|---|---|
| Accroche → Logo | passage de tondeuse qui révèle la scène suivante |
| Logo → Tondre | zoom dans la roue dentée du « P » |
| Tondre → Scier & couper | coup de scie en diagonale |
| Scier & couper → Nettoyer | souffle de feuilles |
| Nettoyer → Entretenir | volet en forme de roue dentée |
| Entretenir → Marques | whip pan avec flou de mouvement |
| Marques → Services | les cartes tombent, la suite surgit du bas |
| Services → Confiance | la dernière ligne devient la carte du compteur |
| Confiance → Fin | pluie de feuilles |

**Modifier** : textes et durées (scènes et transitions, en frames) dans `src/fun/config.ts`.

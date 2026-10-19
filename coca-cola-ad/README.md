# Pub Coca-Cola (exercice Remotion)

Exercice personnel, non officiel et non destiné à la publication.
Vidéo verticale de 22 s (1080×1920, 30 fps, 660 frames). Composition : `CocaColaAd`.

## Commandes

```bash
npm install
npm run dev                                              # studio de prévisualisation
npx remotion render CocaColaAd out/coca-cola-ad.mp4      # rendu final MP4
```

## Structure

```
src/
  config.ts            ← durées des scènes, transitions, timings internes, couleurs, audio
  fonts.ts             ← Inter 700/800/900 via @remotion/google-fonts
  Root.tsx             ← déclaration de la composition
  CocaColaAd.tsx       ← assemblage des scènes avec <TransitionSeries>
  scenes/
    Hook.tsx           0–3 s   onde « pschhh » + « Chaud dehors ? »
    Tension.tsx        3–7 s   « Fatigue. » / « Chaleur. » / « Lundi. » sur aplats qui glissent
    Reveal.tsx         7–11 s  canette en rotation 3D simulée, bulles en parallaxe, zoom lent
    Emotion.tsx        11–16 s « Un moment. » / « À partager. » / « Ensemble. » + formes abstraites
    Climax.tsx         16–20 s ouverture de la canette, explosion de bulles, flash blanc
    Packshot.tsx       20–22 s « Coca-Cola », slogan, canette, image figée
  components/
    Can.tsx            canette SVG générique (reflets, condensation, anneau animable)
    KineticWords.tsx   typo cinétique mot par mot / lettre par lettre + motion blur simulé
    Bubbles.tsx        champ de bulles + geyser de bulles
    Particles.tsx      explosions de particules / confettis
    SoundTrack.tsx     audio optionnel
  transitions/zoom.tsx transition « zoom » maison
  lib/motion.ts        petits utilitaires (secousse, pulsation sur le tempo…)
```

Toutes les animations sont pilotées par `useCurrentFrame()`, `interpolate()` et `spring()`.
Aucune animation CSS n'est utilisée.

## Ajuster les durées

Dans `src/config.ts` :

- `SCENE_SECONDS` : durée de chaque scène. Le total de la composition est recalculé automatiquement.
- `TRANSITION_FRAMES` : durée de la transition qui sort de chaque scène. Elle se joue au début
  de la scène suivante, donc chaque scène démarre exactement à son horodatage.
- `HOOK`, `REVEAL`, `CLIMAX`, `PACKSHOT`… : timings internes en frames, relatifs au début de la scène.

## Audio (optionnel)

Déposez `public/music.mp3` et/ou `public/sfx-open.mp3`. Chaque fichier n'est joué que s'il
est présent (détection avec `getStaticFiles()`) ; sans eux, la vidéo se rend en silence.
Le bruitage d'ouverture est calé sur `CLIMAX.openAt`. Pour couper l'audio : `AUDIO.enabled = false`.

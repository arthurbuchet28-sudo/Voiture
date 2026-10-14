# Le moteur W16 en 75 secondes

Vidéo explicative (1920×1080, 30 fps, H.264) réalisée avec [Remotion](https://www.remotion.dev).
Tous les visuels sont des schémas SVG animés dessinés dans le code : aucun logo, aucune photo.

Rendu final : `out/w16-explication.mp4`.

## Prévisualiser

```bash
npm install
npx remotion studio      # ou : npm run dev
```

Le studio s'ouvre dans le navigateur. Choisissez la composition `W16Explication`
et utilisez la barre de temps pour parcourir les scènes.

## Rendre la vidéo

```bash
npm run render           # = npx remotion render W16Explication out/w16-explication.mp4 --codec=h264
npx remotion still W16Explication out/image.png --frame=300   # une seule image, pour vérifier
```

## Modifier les textes, durées et couleurs

Tout se règle dans **`src/config.ts`** :

| Bloc       | Contenu                                                                 |
|------------|-------------------------------------------------------------------------|
| `DUREES`   | durée de chaque scène, en secondes. La durée totale est leur somme.     |
| `TRANSITION_S` | durée des fondus entre scènes (ils ne raccourcissent pas la vidéo). |
| `TEXTES`   | titres, étiquettes et sous-titres de chaque scène.                      |
| `CHIFFRES` | fiche technique et puissances de la scène 7.                            |
| `COLORS`, `FONTS` | palette et polices.                                              |

Les sous-titres sont donnés sous la forme `{ de, a, lignes }`, en secondes depuis le début de la
scène. Chaque entrée de `lignes` est une ligne à l'écran (les lignes ne passent jamais à la ligne
automatiquement : restez sous 12 mots environ). Gardez `a` inférieur ou égal à la durée de la scène,
sinon le sous-titre chevauche celui de la scène suivante pendant le fondu.

Si vous allongez une scène, pensez à décaler les sous-titres et, si besoin, les animations de
la scène (les instants clés sont exprimés en secondes en haut de chaque fichier `src/scenes/*.tsx`).

## Ajouter une voix off ou une musique

La vidéo est rendue sans son, avec deux pistes prévues :

1. Déposez vos fichiers dans `public/` (par exemple `public/musique.mp3`, `public/voix.mp3`).
2. Dans `src/config.ts`, renseignez `AUDIO` :
   ```ts
   export const AUDIO = { musique: "musique.mp3", voixOff: "voix.mp3", volumeMusique: 0.35 };
   ```
3. Relancez `npm run render`.

Utilisez uniquement des sons libres de droits ou dont vous détenez les droits.

## Structure

```
src/
  config.ts            réglages (durées, couleurs, textes, chiffres, audio)
  Root.tsx             déclaration de la composition (durée = somme des scènes)
  W16Video.tsx         enchaînement des scènes et fondus
  fonts.ts             polices Montserrat et Inter (public/fonts/, licence SIL OFL)
  components/          fond, titres, sous-titres, schéma du moteur, arcs d'angle…
  scenes/              une scène par fichier (Scene1Intro … Scene8Conclusion)
```

| # | Scène              | Début | Durée |
|---|--------------------|-------|-------|
| 1 | Introduction       | 0 s   | 8 s   |
| 2 | Pourquoi un « W » ?| 8 s   | 12 s  |
| 3 | Compacité          | 20 s  | 10 s  |
| 4 | Le cycle à 4 temps | 30 s  | 12 s  |
| 5 | Quatre turbos      | 42 s  | 14 s  |
| 6 | Refroidissement    | 56 s  | 8 s   |
| 7 | Chiffres clés      | 64 s  | 7 s   |
| 8 | Conclusion         | 71 s  | 4 s   |

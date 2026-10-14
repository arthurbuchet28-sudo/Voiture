# Le moteur W16 en 2 minutes 20

Vidéo explicative commentée en voix off (1920×1080, 30 fps, H.264 + AAC) réalisée avec
[Remotion](https://www.remotion.dev). Voix : fr-FR-DeniseNeural, générée avec edge-tts.
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

## Miniature

`out/miniature.png` (1280×720, format YouTube) est générée par la composition `Miniature`
(`src/Miniature.tsx`, textes modifiables dans `MINIATURE` en haut du fichier) :

```bash
npm run miniature
```

## Modifier la voix off

1. Modifiez le texte dans **`src/voix-off.json`** : une liste de phrases (ou groupes de phrases)
   par scène. Vous pouvez aussi y changer la voix, le débit (`"debit": "-5%"` pour ralentir) et la
   pause entre phrases.
2. Régénérez l'audio (Python 3, ffmpeg et `pip install edge-tts` requis, accès Internet nécessaire) :
   ```bash
   python3 voix-off/generer.py
   ```
   Le script crée `public/voix/<scène>.wav` (silences de début et de fin supprimés) et
   `src/voix-off-timings.json` (durée de chaque scène et horaire de chaque phrase).
3. Relancez `npm run render`.

**Les durées des scènes s'adaptent toutes seules à la voix :**
`durée = VOIX_DEBUT (0,4 s) + durée de la voix + MARGE_FIN (0,5 s)`. Aucune phrase n'est coupée,
et le fondu vers la scène suivante commence après la marge.

**Les animations et les sous-titres sont calés sur les phrases.** Par exemple, l'ouverture du
« W » démarre avec la phrase « Puis on assemble deux VR8… », et chaque temps du piston dure le temps
de sa phrase. Si vous ajoutez ou supprimez une phrase, vérifiez les numéros de phrase utilisés en haut
des fichiers `src/scenes/*.tsx` et dans les sous-titres de `config.ts`.

## Modifier les sous-titres, couleurs et chiffres

Dans **`src/config.ts`** :

| Bloc        | Contenu                                                               |
|-------------|-----------------------------------------------------------------------|
| `TEXTES`    | titres, étiquettes et sous-titres affichés.                           |
| `CHIFFRES`  | fiche technique et puissances de la scène 7.                          |
| `VOIX_DEBUT`, `MARGE_FIN` | silences avant et après la voix de chaque scène.        |
| `AUDIO`     | volume de la voix, musique de fond facultative.                       |
| `COLORS`, `FONTS` | palette et polices.                                             |

Un sous-titre s'écrit `{ phrase, lignes }` : il apparaît au début de la phrase de voix off numéro
`phrase` (en partant de 0) et reste jusqu'au sous-titre suivant. Chaque entrée de `lignes` est une
ligne à l'écran (12 mots maximum, pas de retour à la ligne automatique). Le studio et le rendu
refusent de démarrer si un sous-titre reste moins de 3 s à l'écran.

## Ajouter une musique de fond

1. Déposez le fichier dans `public/` (par exemple `public/musique.mp3`).
2. Dans `src/config.ts`, renseignez `AUDIO.musique: "musique.mp3"`. Le volume par défaut
   (`volumeMusique: 0.08`) la laisse nettement sous la voix ; elle boucle si elle est trop courte.
3. Relancez `npm run render`.

Utilisez uniquement des sons libres de droits ou dont vous détenez les droits.

## Structure

```
src/
  config.ts            réglages (couleurs, textes, chiffres, audio) ; durées calculées
  voix-off.json        texte de la voix off
  voix-off-timings.json  horaires générés (ne pas modifier à la main)
  Root.tsx             déclaration de la composition et contrôles (durée, sous-titres)
  W16Video.tsx         enchaînement des scènes et fondus
  fonts.ts             polices Montserrat et Inter (public/fonts/, licence SIL OFL)
  components/          fond, titres, sous-titres, schéma du moteur, arcs d'angle…
  scenes/              une scène par fichier (Scene1Intro … Scene8Conclusion)
public/voix/           voix off, un fichier par scène
voix-off/generer.py    génération de la voix off (edge-tts)
```

Durées actuelles (elles suivent la voix off) :

| # | Scène               | Début   | Durée  |
|---|---------------------|---------|--------|
| 1 | Introduction        | 0:00    | 11,0 s |
| 2 | Pourquoi un « W » ? | 0:11    | 20,9 s |
| 3 | Compacité           | 0:31,9  | 17,0 s |
| 4 | Le cycle à 4 temps  | 0:48,9  | 27,1 s |
| 5 | Quatre turbos       | 1:16    | 27,9 s |
| 6 | Refroidissement     | 1:43,9  | 11,0 s |
| 7 | Chiffres clés       | 1:54,9  | 16,9 s |
| 8 | Conclusion          | 2:11,8  | 8,8 s  |

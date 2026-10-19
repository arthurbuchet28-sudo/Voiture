# Prompt : pub Perdriset Motoculture, version ludique et dynamique

## Objectif
Crée une **nouvelle version** de la vidéo promotionnelle Perdriset Motoculture (25 à 30 s), **plus ludique, plus rythmée, avec des transitions plus créatives** que la version actuelle.

## Point de départ (OBLIGATOIRE)
- Le projet existant est dans `perdriset-video/` (Remotion 4.0.536, React + TypeScript, composition `Perdriset`, 1920×1080, 60 fps, H.264 CRF 16, `yuv420p`, police Inter).
- **Ne modifie pas** la composition `Perdriset` ni `out/perdriset-motoculture.mp4`. Crée une nouvelle composition `PerdrisetFun`, dans `src/fun/`, avec son propre `config.ts`.
- Réutilise ce qui existe déjà : `src/lib/` (timeline, motionBlur, utils), `src/components/` (Background, Grain, LightTrail, Converge, icons), les visuels de `public/` et la palette de `src/theme.ts`.
- Garde le même format, les mêmes fps, la même police et les mêmes couleurs (vert du logo `#5ABB47`, vert profond `#187C51`, fond vert presque noir). Seuls le **ton**, le **rythme** et les **transitions** changent.

## Ton recherché
- **Joyeux, énergique, malin** : comme une pub de marque de jardin moderne sur les réseaux sociaux, pas une keynote calme.
- Des mouvements avec du **rebond** : ressorts plus nerveux (`damping` 8-12, `stiffness` 150-220), du dépassement, de l'écrasement et de l'étirement (squash & stretch) quand un élément arrive.
- **Plans plus courts** : aucun plan fixe de plus de 1,2 s sans qu'un élément bouge. Le rythme doit être calé sur un tempo imaginaire de 120 BPM (un temps = 30 frames) : les apparitions importantes tombent sur un temps.
- Reste lisible et pro : textes courts, gros caractères, contraste fort. Ludique, mais pas enfantin.

## Éléments ludiques à intégrer
- **Brins d'herbe** en SVG qui poussent depuis le bas de l'écran et ondulent (vent), à plusieurs moments.
- **Feuilles** en SVG qui tourbillonnent, emportées par les transitions.
- **Copeaux / sciure** qui jaillissent en particules quand la tronçonneuse apparaît.
- **Une petite tondeuse** stylisée en SVG (formes simples, aux couleurs de la marque) qui sert de « fil rouge » : elle traverse l'écran et **tond** pour faire les transitions.
- Des **icônes qui rebondissent** (clé, calendrier, clé de location, étiquette), un petit « tilt » au survol, des pastilles qui « poppent ».
- Tout est dessiné en SVG/CSS, déterministe (`useCurrentFrame()`, `random('seed')`, jamais `Math.random()`), sans emoji.

## Transitions (le cœur de la demande)
Chaque raccord est différent, et **aucun n'est un simple fondu**. Utilise `@remotion/transitions` (même version que `remotion`) avec `TransitionSeries`, et des présentations personnalisées quand il le faut.

1. **Accroche → Logo** : **passage de tondeuse**. La tondeuse traverse l'écran de gauche à droite. Derrière elle, une bande d'herbe tondue « révèle » la scène suivante (masque `clip-path` qui suit la tondeuse), avec des brins d'herbe projetés.
2. **Logo → Univers** : **zoom dans le « P » du logo** (zoom-through) : la caméra plonge dans la roue dentée du logo, qui tourne, et ressort sur la première photo.
3. **Entre les 4 univers** : **coupes rythmées sur le temps**, chacune avec son effet :
   - Tondre → Scier : **coup de scie**, l'image se fend en diagonale et les deux moitiés glissent ;
   - Scier → Nettoyer : **souffle**, des feuilles balaient l'écran et emportent l'image ;
   - Nettoyer → Entretenir : **volet circulaire** (iris) en forme de roue dentée qui tourne.
4. **Univers → Marques** : **slide « whip pan »** horizontal très rapide, avec un fort flou de mouvement directionnel.
5. **Marques → Services** : les tuiles des marques **tombent** comme des cartes (gravité + rebond) et dégagent l'écran.
6. **Services → Confiance** : **morph** : la dernière ligne de service grandit et devient la carte du compteur.
7. **Confiance → Appel à l'action** : **pluie de feuilles** vertes qui remplit l'écran, puis s'écarte pour révéler le logo.

## Storyboard (≈ 28 s, temps indicatifs)
1. **0-2,5 s, Accroche** : « Votre jardin mérite le meilleur. » Les mots tombent du haut un par un et **rebondissent** sur la ligne de base (squash & stretch). Des brins d'herbe poussent sous le texte. « le meilleur. » en vert, avec un petit scintillement.
2. **2,5-5,5 s, Logo** : le logo arrive avec un gros rebond, la roue dentée du « P » fait un tour complet. Baseline : « Votre spécialiste motoculture » / « à Bourg-en-Bresse » (icône d'épingle qui tombe et rebondit sur la ville).
3. **5,5-11 s, Les 4 univers** : un univers par temps fort (environ 1,2 s chacun), photo en plein cadre dans une carte inclinée qui « respire », titre énorme qui claque à l'écran :
   - **Tondre** (`pelouse.jpg`), des brins d'herbe volent ;
   - **Scier & couper** (`scier-couper.jpg`), des copeaux jaillissent ;
   - **Nettoyer** (`nettoyer.jpg`), des feuilles s'envolent ;
   - **Entretenir** (`balayeuse.jpg`), une clé à molette tourne autour du titre.
4. **11-15 s, Marques** : « Nos marques phares ». Les noms, en texte stylisé (pas de logos), arrivent **un par un en rafale**, sur le temps, comme des cartes qu'on distribue, avec rotation et rebond, puis forment une grille 4 × 2 qui ondule en vague : **Stihl, Grin, Pubert, Cub Cadet, Iseki, Ego, Kress, Segway**.
5. **15-19,5 s, Services** : « Nos services ». La photo du magasin (`magasin.jpg`) entre en tournant. Les 4 services s'empilent en rebondissant, chacun coché par une coche animée qui « poppe » : **Réparation toutes marques**, **Forfait entretien annuel**, **Location**, **Occasions**.
6. **19,5-23,5 s, Confiance** : compteur **0 → 30** qui accélère comme un compte-tours, avec un « clac » visuel (onde de choc + confettis de feuilles) à 30, puis « **ans d'expertise** ». Ensuite deux pastilles qui sautent : « **Une équipe de passionnés** » et « **Particuliers & professionnels** ».
7. **23,5-28 s, Appel à l'action** : logo, « **Bourg-en-Bresse & Simandre-sur-Suran** », bouton « **perdriset.fr** » et « **04 74 22 31 26** ». Tout doit être **lisible au plus tard à 24,5 s** et rester à l'écran **au moins 3 s**. Animation d'attente discrète : herbe qui ondule, reflet sur le bouton, tondeuse qui passe au fond. Pas de fondu au noir.

## Contenu de l'entreprise (ne rien inventer)
- Magasin de motoculture : vente, réparation et entretien de matériel pour tondre, scier, couper, entretenir et nettoyer les espaces extérieurs.
- Depuis une trentaine d'années à Bourg-en-Bresse et sa région ; reprise en 2020 par Grégory Girard ; 10 salariés en 2025 ; forme des apprentis.
- Services : réparation toutes marques, forfait d'entretien annuel, location, matériel d'occasion, retrait sur place, paiement en plusieurs fois.
- Particuliers et professionnels des espaces verts.
- Marques phares : Stihl, Grin, Pubert, Cub Cadet, Iseki, Ego, Kress, Segway.
- 2 sites : 17 avenue de Bad Kreuznach, 01000 Bourg-en-Bresse (04 74 22 31 26) et route de Bourg, 01250 Simandre-sur-Suran (04 74 30 66 16). Site : perdriset.fr. Instagram : @perdrisetmotoculture.
- **N'affiche aucun texte qui ne figure pas dans ce prompt.**

## Audio
- La version actuelle est **muette**, comme la vidéo Promptly. Garde la nouvelle version muette, sauf si je fournis un fichier de musique libre de droits dans `public/`. Dans ce cas, cale les transitions sur ses temps forts.

## Exigences
- Durée totale : 25 à 30 s.
- Textes en français, sans aucune faute d'orthographe : vérifie chaque texte affiché.
- Lisible sur mobile : textes principaux d'au moins 60 px, texte secondaire d'au moins 36 px.
- Le flou de mouvement est calculé à partir de la vitesse réelle, comme dans le projet existant.
- Pièges CSS 3D du projet : un `filter` ou une `opacity` < 1 sur un parent `preserve-3d` aplatit ses enfants.

## Vérification et livrables
1. `npx tsc --noEmit` sans erreur.
2. **Avant le rendu final**, montre-moi une planche d'images clés : au moins une par scène, et **une au milieu de chaque transition**.
3. Rendu : `npx remotion render PerdrisetFun out/perdriset-motoculture-fun.mp4`. Vérifie avec `ffprobe` : 1920×1080, 60 fps, durée entre 25 et 30 s.
4. Vérifie que la composition `Perdriset` d'origine rend toujours la même image qu'avant, sur une frame au choix.
5. Commite et pousse le code et la vidéo.
6. Donne-moi un résumé court : durée réelle, format, liste des transitions et liste de tous les textes affichés, pour que je les relise.

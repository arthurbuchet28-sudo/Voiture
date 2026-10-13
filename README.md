# Ma Voiture Idéale

Site en français pour trouver la voiture qui vous correspond : vous choisissez vos critères
(tous facultatifs) et les versions sont classées par **pourcentage de correspondance**.
Marché français : prix en euros, puissance en ch, consommation en L/100 km ou kWh/100 km, CO₂ en g/km.

Stack : Vite + React + TypeScript + Tailwind CSS. Pas de backend : les données sont des
fichiers JSON statiques dans `public/data/`.

## Lancer le site

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production dans dist/ (vérifie aussi les types)
npm run preview    # sert le build
```

La base de données est déjà générée et versionnée (`public/data/`). Le site marche donc dès
`npm install`, sans relancer la collecte.

## Mettre à jour les données

```bash
npm run data       # collecte complète + fusion (environ 5 à 10 min, accès Internet requis)
```

Vous pouvez aussi lancer chaque étape séparément :

| Commande | Étape | Résultat |
|---|---|---|
| `npm run data:wikidata` | SPARQL sur query.wikidata.org : modèles d'automobile (Q3231690), marque/constructeur, années, classes (carrosserie, segment), image P18 ; marques (pays, logo P154) | `scripts/cache/wikidata.json` |
| `npm run data:nhtsa` | API NHTSA vPIC : marques et modèles (voitures, MPV, camionnettes) | `scripts/cache/nhtsa.json` |
| `npm run data:commons` | API Wikimedia Commons : auteur, licence et miniature des photos, logos, recherche de photos complémentaires par modèle | `scripts/cache/commons.json` |
| `npm run data:merge` | Fusion, dédoublonnage, sortie finale | `public/data/voitures.json`, `marques.json`, `stats.json` |

`scripts/cache/` n'est pas versionné. `data:merge` peut être relancé seul tant que le cache existe,
par exemple après avoir modifié une fiche technique.

### Fiches techniques

Les caractéristiques détaillées (versions, puissance, prix neuf, consommation, coffre, 0-100 km/h…)
ne se trouvent pas dans les sources ouvertes. Elles sont saisies dans `scripts/specs/*.txt`, une
ligne par version, dans un format texte compact décrit dans
[`scripts/specs/LISEZMOI.md`](scripts/specs/LISEZMOI.md). Pour ajouter ou corriger un modèle,
modifiez ces fichiers puis lancez `npm run data:merge`.

Règles appliquées :
- une valeur inconnue s'écrit `-` et devient `null` : aucune valeur n'est inventée ;
- les prix sont des prix catalogue indicatifs et les consommations sont des valeurs WLTP ;
- la vignette Crit'Air se déduit de la réglementation (électrique = 0 ; essence, hybride, GPL ou E85
  vendu neuf depuis 2011 = 1 ; diesel = 2) ;
- chaque modèle porte un champ `source` et un champ `dateMiseAJour`.

### Fusion et dédoublonnage (`scripts/merge.ts`)

- Une fiche technique est rattachée aux éléments Wikidata de **même marque et même nom de modèle**
  (sans le suffixe de génération), en retenant ceux dont la période de production chevauche la sienne.
  Une photo Wikidata n'est retenue que si l'élément décrit bien cette génération.
- Les autres éléments Wikidata de même marque et même modèle, avec des périodes qui se chevauchent,
  sont fusionnés entre eux. Ils deviennent des modèles sans fiche technique (`versions: []`),
  qu'on peut afficher dans les résultats grâce à l'option « Inclure les modèles sans fiche technique ».
- Les concept-cars, voitures de course, prototypes et poids lourds sont exclus, ainsi que les
  modèles dont la carrosserie ne peut pas être déduite des données.
- NHTSA vPIC complète la liste des marques et sert à recouper les modèles. Ses modèles ne sont pas
  ajoutés seuls, car l'API ne donne pas de type de carrosserie fiable : il faudrait l'inventer.

### Photos

Toutes les photos viennent de Wikimedia Commons et seules celles sous licence libre sont gardées
(CC BY, CC BY-SA, CC0, domaine public…). L'URL, l'auteur, la licence et la page Commons sont
stockés, et le crédit s'affiche sous chaque photo. Un modèle sans photo s'affiche avec une
silhouette générique qui dépend de sa carrosserie.

## État actuel de la base

D'après `public/data/stats.json` (collecte du 13/10/2026) :

- 503 marques, dont 381 avec au moins un modèle, 283 avec un logo et 122 apportées par NHTSA seulement ;
- 2 916 modèles, dont 439 avec fiche technique (799 versions) et 2 477 issus de Wikidata seulement ;
- 2 781 modèles avec au moins une photo (418 des 439 fiches techniques), soit 3 769 photos.

## Fonctionnalités

- **Accueil** : critères en 4 groupes (Les essentiels, Performances, Usage, Style), 7 profils
  rapides, nombre de résultats mis à jour en direct, boutons « Trouver ma voiture » et « Réinitialiser ».
- **Résultats** : score de 0 à 100 %. Le budget, le nombre de places et l'énergie sont
  éliminatoires ; les autres critères sont pondérés selon l'écart avec la demande. Les filtres se
  modifient dans le panneau latéral (tiroir sur mobile). Tri par correspondance, prix, puissance ou
  consommation. Chargement progressif. Si rien ne correspond, le site suggère le critère à assouplir.
- **Fiche modèle** : galerie avec crédits, tableau technique, toutes les versions, couleurs, ajout au
  comparateur et aux favoris.
- **Comparateur** (3 voitures au plus, meilleures valeurs mises en évidence), **favoris** gardés dans
  le localStorage, **critères dans l'URL** (lien partageable), **recherche rapide** dans l'en-tête,
  mode clair/sombre, responsive.

## Arborescence

```
scripts/
  fetch-wikidata.ts  fetch-nhtsa.ts  fetch-commons.ts  lire-specs.ts  merge.ts  run-all.ts
  lib/        http, SPARQL, normalisation, rapprochement Wikidata ↔ fiches
  specs/      fiches techniques (.txt) + LISEZMOI.md
public/data/  voitures.json  marques.json  stats.json
src/
  types.ts    schéma partagé (Marque, Modele, Version)
  lib/        criteres (URL, profils), score, donnees, stockage, format
  components/ formulaire, curseur double, cartes, photos, silhouettes, comparateur…
  pages/      Accueil, Resultats, FicheModele, Comparateur, Favoris
```

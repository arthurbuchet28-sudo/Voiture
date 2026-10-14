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
npm test           # tests unitaires (score, URL, cohérence de la base)
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

| `npm run data:verifier` | Contrôle de cohérence des fiches (bornes, CO2 ↔ consommation, accélération ↔ poids/puissance, doublons…) | rapport dans le terminal |

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
- les prix sont des prix catalogue indicatifs et les consommations sont des valeurs WLTP ; pour les
  générations antérieures à 2018 (fichier `complements.txt`), ce sont souvent des valeurs NEDC et le
  prix est le dernier prix catalogue connu, ou `-` s'il est inconnu ;
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

### Logos

Les logos viennent de la propriété P154 de Wikidata. Seuls les SVG/PNG, ou les fichiers dont le nom
indique un logo ou un badge, sont retenus, car certaines marques ont une photo de voiture en P154.
À défaut, le script cherche « Marque logo.svg » sur Commons. Le logo de la marque passe avant celui
du groupe (« BMW » plutôt que « BMW Group »).

### Photos

Toutes les photos viennent de Wikimedia Commons et seules celles sous licence libre sont gardées
(CC BY, CC BY-SA, CC0, domaine public…). L'URL, l'auteur, la licence et la page Commons sont
stockés, et le crédit s'affiche sous chaque photo. Un modèle sans photo s'affiche avec une
silhouette générique qui dépend de sa carrosserie.

Pour ne pas illustrer une fiche avec une autre génération, une photo de galerie n'est retenue que si
son titre contient une année comprise dans la période de production, sans année antérieure ni mention
de génération (« Mk2 », « 3rd generation »). Les concept-cars et les photos de détail sont exclus.

## État actuel de la base

D'après `public/data/stats.json` (collecte du 13/10/2026) :

- 465 marques, dont 351 avec au moins un modèle et 251 avec un logo ;
- 2 950 modèles, dont 520 avec fiche technique (918 versions) et 2 430 issus de Wikidata seulement ;
- 2 830 modèles avec au moins une photo (513 des 520 fiches techniques), soit 4 015 photos.

### Contrôle qualité

`npm run data:verifier` relit toutes les fiches et signale :
- **erreurs** (bloquantes en CI) : valeur hors bornes, électrique avec du CO2 ou en boîte manuelle,
  version en double, années incohérentes ;
- **alertes** : CO2 qui s'écarte de plus de 15 % de la consommation (facteurs par carburant),
  0-100 km/h peu plausible pour le rapport poids/puissance, prix incohérent avec la puissance,
  autonomie manquante.

Les alertes actuelles (6) portent toutes sur des hypercars hybrides rechargeables, dont la
consommation est élevée en réalité.

### Accessibilité

Les pages principales (accueil, résultats, fiche, comparateur, favoris) ont été auditées avec
axe-core, en mode clair et en mode sombre : aucune violation. Les textes respectent le contraste
WCAG AA (au moins 4,5:1), les repères de navigation sont nommés et les titres sont hiérarchisés.

## Intégration continue et déploiement

- `.github/workflows/ci.yml` : à chaque push, contrôle des fiches, tests et build.
- `.github/workflows/pages.yml` : publication sur GitHub Pages, **lancée à la main seulement**
  (onglet Actions > « Déployer sur GitHub Pages »). Il faut d'abord choisir « GitHub Actions » comme
  source dans Settings > Pages. Le site est alors servi sous `/<nom-du-dépôt>/` : la variable
  `BASE_URL` règle le chemin, et `404.html` permet d'ouvrir directement les URL des pages.

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

## Vidéo : le moteur W16

Le dossier [`w16-video/`](w16-video/) contient un projet Remotion indépendant (vidéo explicative de
75 s sur le moteur W16). Voir [`w16-video/README.md`](w16-video/README.md).

# Fiches techniques (connaissances)

Ces fichiers `.txt` contiennent les caractéristiques techniques des modèles vendus en France,
renseignées à partir des catalogues/fiches constructeurs connus (valeurs WLTP, prix catalogue
indicatifs en euros au moment de la saisie). **Toute valeur inconnue est notée `-` et devient
`null` dans la base : on n'invente rien.**

## Format

```
# commentaire
@ Marque | Modèle | carrosserie | segment | annéeDébut-annéeFin | couleurs | places portes coffre
nom de version | énergie | ch | boîte | transmission | prix € | conso | CO2 | autonomie | 0-100 | vmax | poids | surcharges
```

- carrosserie : citadine, berline, break, SUV, monospace, coupé, cabriolet, pick-up, utilitaire
- segment : A à F ou `-`
- années : `2019-` (encore produit) ou `2016-2023`
- couleurs (codes) : B=Blanc N=Noir G=Gris A=Argent R=Rouge Bl=Bleu V=Vert J=Jaune O=Orange Be=Beige M=Marron Vi=Violet Ro=Rose
- énergie : E=essence D=diesel HEV=hybride PHEV=hybride rechargeable EV=électrique GPL E85
- boîte : M=manuelle A=automatique — transmission : T=traction P=propulsion 4=intégrale
- conso : L/100 km (kWh/100 km pour EV) ; autonomie en km (EV et PHEV)
- surcharges facultatives : `pl=7` (places) `p=3` (portes) `c=500` (coffre)

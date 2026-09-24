# Flappy Arena — GitHub Pages

Ce projet est préparé pour GitHub Pages.

## Déploiement

1. Crée un dépôt GitHub et mets **tous les fichiers de ce dossier à la racine** du dépôt.
2. Va dans **Settings → Pages**.
3. Dans **Build and deployment**, choisis **Source: GitHub Actions**.
4. Envoie/commit les fichiers sur la branche `main`.
5. Le workflow `.github/workflows/deploy.yml` installe les dépendances, construit le jeu avec Vite et publie automatiquement le dossier `dist`.
6. L'URL sera affichée dans **Settings → Pages** après le premier déploiement.

Aucune commande `npm build` n'est nécessaire sur ton PC : GitHub fait la construction automatiquement.

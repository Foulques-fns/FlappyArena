# Flappy Arena — GitHub Pages

## Déploiement
1. Mets tous les fichiers de ce projet à la racine de ton dépôt GitHub.
2. Utilise la branche `main`.
3. Va dans **Settings → Pages** et choisis **GitHub Actions** comme source.
4. Fais un commit/push sur `main`.
5. L'action **Deploy to GitHub Pages** construit et publie automatiquement le jeu.

Le projet utilise `vite.config.ts` avec `base: "./"` afin que les ressources fonctionnent même lorsque le dépôt est publié sous une URL GitHub Pages du type `https://utilisateur.github.io/nom-du-repo/`.

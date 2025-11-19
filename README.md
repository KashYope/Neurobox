# NeuroSooth – Boîte à outils somatique pour profils neurodivergents

NeuroSooth est une application Vite + React pensée comme une boîte à outils pour les personnes neuro-atypiques. Les exercices somatiques sont présentés sous forme de cartes triables par situation émotionnelle (crise, stress, sommeil, etc.). Chaque carte ouvre un parcours détaillé étape par étape et les membres de la communauté peuvent ajouter leurs propres pratiques ou remercier celles qui les ont aidés.

## Fonctionnalités principales
- **Onboarding personnalisé** – Collecte du prénom et des neuroprofils (`NeuroType`) pour adapter les recommandations.
- **Filtrage par situations** – Barre de filtres (`Situation`) pour ne voir que les exercices adaptés à une crise, une insomnie, une colère, etc.
- **Cartes interactives** – Aperçu visuel avec tags, durée et compteur de remerciements; clic = vue détaillée avec avertissements et instructions.
- **Dire merci** – Bouton « Dire Merci » qui incrémente `thanksCount` via `incrementThanks` dans `services/dataService.ts` et renforce le tri par popularité.
- **Contribution communautaire** – Formulaire complet pour publier un nouvel exercice (`AddExerciseForm`) avec image, étapes et situations ciblées.
- **Persistance locale** – Profil, exercices ajoutés et remerciements sont sauvegardés dans `localStorage` via `dataService` pour rester disponibles entre les sessions.

## Stack & Architecture
- **Framework** : React 19 avec Vite 6 et TypeScript 5.8.
- **UI** : composants maison (ex. `components/Button.tsx`) + utilitaires Tailwind via classes CSS.
- **Données** : `INITIAL_EXERCISES` dans `constants.ts`, types partagés dans `types.ts`, et couche de persistance + scoring dans `services/dataService.ts` (filtrage par `Situation` puis scoring par `NeuroType` et `thanksCount`).
- **Entrée principale** : `index.tsx` orchestre l’onboarding, le tableau de bord, la vue détaillée et le formulaire d’ajout.

```
.
├── components/
│   └── Button.tsx
├── constants.ts          # Exercices préchargés
├── services/
│   └── dataService.ts    # LocalStorage + recommandations
├── types.ts              # Enums et interfaces partagées
├── index.tsx             # Arbre React principal
└── index.html            # Point d’ancrage Vite
```

## Guide de démarrage
### Prérequis
- Node.js (LTS conseillé)

### Installation & exécution
1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Configurer votre clé Gemini pour les éventuels appels IA :
   ```
   cp .env.local.example .env.local  # si le fichier existe
   ```
   Ajoutez ensuite `GEMINI_API_KEY=...`.
3. Lancer l’appli :
   ```bash
   npm run dev
   ```
4. Ouvrez [http://localhost:5173](http://localhost:5173) et complétez l’onboarding pour accéder aux recommandations.

## Ajouter un exercice manuellement
1. Depuis l’interface, cliquez sur **Contribuer** pour ouvrir `AddExerciseForm`.
2. Renseignez au minimum le titre, la description et une situation cible.
3. Indiquez chaque étape dans l’ordre; des URL d’images/GIF optionnelles peuvent améliorer la carte.
4. Publiez : l’exercice est stocké en local, tagué « Community » et visible dans la grille.

## Dire merci et suivi d’impact
- Le bouton « Dire Merci » (vue détail) appelle `incrementThanks`, incrémente le compteur et déclenche un rerender des cartes afin que les techniques les plus utiles montent naturellement dans les recommandations.
- Ces remerciements persistent localement pour favoriser vos techniques favorites lors de vos prochaines visites.

# NeuroSooth – Boîte à outils somatique pour profils neurodivergents

NeuroSooth est une application Vite + React pensée comme une boîte à outils pour les personnes neuro-atypiques. Les exercices somatiques sont présentés sous forme de cartes triables par situation émotionnelle (crise, stress, sommeil, etc.). Chaque carte ouvre un parcours détaillé étape par étape et les membres de la communauté peuvent ajouter leurs propres pratiques ou remercier celles qui les ont aidés.

## Fonctionnalités principales
- **Onboarding personnalisé** – Collecte du prénom et des neuroprofils (`NeuroType`) pour adapter les recommandations.
- **Filtrage par situations** – Barre de filtres (`Situation`) pour ne voir que les exercices adaptés à une crise, une insomnie, une colère, etc.
- **Cartes interactives** – Aperçu visuel avec tags, durée et compteur de remerciements; clic = vue détaillée avec avertissements et instructions.
- **Dire merci** – Bouton « Dire Merci » avec mise à jour optimiste : `incrementThanks` pousse la mutation dans `syncService` qui flush la file d’attente vers l’API en arrière-plan.
- **Contribution communautaire** – Formulaire complet pour publier un nouvel exercice (`AddExerciseForm`) avec image, étapes et situations ciblées.
- **Synchronisation hors-ligne** – Profil en `localStorage`, cache d’exercices hydraté par `syncService` (localStorage par défaut, prêt pour IndexedDB) et file `pendingMutations` pour re-jouer les actions dès que `navigator.onLine` repasse à `true`.
- **Backoffice Partenaires** – Espace sécurisé pour créer/connexion d’organisations, publier manuellement ou importer des exercices via CSV/JSON (mappage automatique des colonnes vers `PartnerPortal`).
- **Panel de modération** – Vue dédiée pour valider/refuser les contributions communautaires, avec notes internes et badges de statut qui conditionnent l’apparition publique des exercices.

## Stack & Architecture
- **Framework** : React 19 avec Vite 6 et TypeScript 5.8.
- **UI** : composants maison (ex. `components/Button.tsx`) + utilitaires Tailwind via classes CSS.
- **Données** : `INITIAL_EXERCISES` dans `constants.ts`, types partagés dans `types.ts`, client HTTP typé (`services/apiClient.ts`) et orchestration hors-ligne dans `services/syncService.ts` (cache local + queue). `services/dataService.ts` expose désormais les helpers de scoring en s’appuyant sur cette couche.
- **Entrée principale** : `index.tsx` orchestre l’onboarding, le tableau de bord, la vue détaillée et le formulaire d’ajout.

```
.
├── components/
│   └── Button.tsx
├── constants.ts          # Exercices préchargés
├── services/
│   ├── apiClient.ts      # Client HTTP typé (fetch, create, thank)
│   ├── dataService.ts    # Scoring + persistance profil
│   └── syncService.ts    # Cache, queue offline/online
├── types.ts              # Enums et interfaces partagées
├── index.tsx             # Arbre React principal
└── index.html            # Point d’ancrage Vite
```

## Guide de démarrage
### Prérequis
- Node.js (version LTS conseillée)
- npm 10+

### Installation & exécution
1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Démarrer le serveur de développement Vite :
   ```bash
   npm run dev
   ```
3. Ouvrez [http://localhost:5173](http://localhost:5173) et complétez l’onboarding pour accéder aux recommandations personnalisées.

Pour préparer une version de production, exécutez `npm run build` puis `npm run preview` pour tester le build statique.

## Ajouter un exercice manuellement
1. Depuis le tableau de bord principal, cliquez sur **Contribuer** pour ouvrir `AddExerciseForm`.
2. Renseignez au minimum le titre, la description et une situation cible.
3. Indiquez chaque étape dans l’ordre; des URL d’images/GIF optionnelles peuvent améliorer la carte.
4. Validez : la contribution est stockée localement, passe en statut « pending » et attend la validation du panel de modération.

## Dire merci et suivi d’impact
- Le bouton « Dire Merci » (vue détail) appelle `incrementThanks`, incrémente le compteur et déclenche un rerender des cartes afin que les techniques les plus utiles montent naturellement dans les recommandations.
- Ces remerciements persistent localement pour favoriser vos techniques favorites lors de vos prochaines visites.

## Espaces d’administration

### Backoffice Partenaires
- Accédez-y via le bouton **Espace Partenaires** (icône Building) depuis la barre supérieure de l’application.
- Les organisations peuvent créer un compte local (stocké dans `localStorage`), se connecter puis :
  - Publier manuellement des techniques via un formulaire complet (`PartnerPortal`).
  - Importer un fichier CSV ou JSON pour créer plusieurs exercices d’un coup. Les colonnes `title`, `description`, `situations`, `steps`, `tags`, `warning`, `imageUrl` sont reconnues automatiquement; les listes peuvent être séparées par `|`, `;` ou `,`.
- Les exercices créés via ce portail sont immédiatement marqués comme « Partenaire » et ajoutés à la grille utilisateur avec un `thanksCount` initialisé à 0.

### Panel de modération
- Accessible via le bouton **Modération** (bouclier) affiché à droite de la barre supérieure.
- Liste en temps réel les contributions `isCommunitySubmitted` ayant le statut `pending` dans `syncService`.
- Chaque entrée permet d’ajouter une note interne et de choisir **Valider** ou **Refuser**; un badge visuel apparaît sur les cartes validées/refusées dans l’historique.
- `moderateExercise` met à jour les champs `moderationStatus`, `moderationNotes`, `moderatedAt` et `moderatedBy`, ce qui conditionne la visibilité publique (`approved` uniquement) et renseigne l’historique des décisions.

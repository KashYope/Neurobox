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

## API backend Express + PostgreSQL

Une API REST Express vit dans `server/` afin de partager les exercices, remercier une pratique et suivre les décisions de modération.

### Configuration
- Copiez `.env.example` vers `.env` et renseignez au minimum `DATABASE_URL`, `JWT_SECRET` et `VITE_API_BASE_URL` (utilisé par le client React).
- Lancez les migrations PostgreSQL :
  ```bash
  npm run server:migrate
  ```
- Démarrez l’API en mode développement (TypeScript + watch) :
  ```bash
  npm run server:dev
  ```
- En production, vous pouvez utiliser le Dockerfile fourni :
  ```bash
  docker build -t neurosooth-api .
  docker run --env-file .env -p 4000:4000 neurosooth-api
  ```

L’API expose les routes suivantes (préfixe `/api` configurable via `VITE_API_BASE_URL`) :

| Méthode | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/exercises` | Retourne toutes les pratiques (avec `serverId`, timestamps, métadonnées de modération et `thanksCount`). |
| POST | `/api/exercises` | Crée un exercice communautaire (anonyme) ou partenaire (si jeton `partner`). |
| POST | `/api/exercises/:id/thanks` | Incrémente le compteur `thanksCount` et renvoie l’exercice à jour. |
| PATCH | `/api/exercises/:id/moderation` | Réservé aux modérateurs pour approuver/rejeter, ajouter des notes et éventuellement supprimer côté serveur. |
| GET | `/api/moderation/queue` | File temps réel des propositions en attente + historique des dernières décisions (JWT `moderator` requis). |

### Authentification JWT
Les actions sensibles sont protégées via des Bearer tokens signés avec `JWT_SECRET`. Deux rôles sont supportés :

- `partner` : nécessaire pour publier des contenus partenaires (accès direct au catalogue).
- `moderator` : requis pour consulter la file `/api/moderation/queue` ou appliquer des décisions.

Un utilitaire simplifie la génération locale de tokens :

```bash
# Jeton partenaire (subject facultatif)
npm run server:token partner mon-equipe

# Jeton modérateur
npm run server:token moderator alice
```

Collez ensuite ces jetons dans le panneau administrateur (section « Jetons API »). Les valeurs sont stockées dans `localStorage` et injectées automatiquement dans `apiClient` via les en-têtes `Authorization`.

### Synchronisation front/back
- `services/syncService` continue de gérer la file des mutations (création, remerciements et maintenant modération) puis réconcilie les exercices renvoyés par l’API.
- Les exercices marqués `deletedAt` côté serveur sont supprimés du cache et n’apparaissent plus dans les recommandations.
- Le panel de modération interroge périodiquement `/api/moderation/queue` et se replie automatiquement sur les données locales lorsqu’aucun jeton modérateur n’est fourni ou que l’API est inaccessible.

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

## Progressive Web App
- `vite-plugin-pwa` injecte automatiquement le service worker `src/sw.ts` (Workbox) et le manifeste (`public/manifest.webmanifest`).
- `src/sw.ts` met en cache le shell (`StaleWhileRevalidate`), les réponses API `/api/*` (`NetworkFirst` + `BackgroundSyncPlugin`) et répond aux messages `syncService` pour planifier un `Background Sync` si disponible.
- `services/syncService` déclenche cette synchronisation après chaque mutation pour garantir une reprise automatique même hors-ligne.

### QA « Add to Home Screen »
1. **Android / Chrome**
   - Construire l’app (`npm run build`), déployer le dossier `dist` ou lancer `npm run preview`.
   - Sur un appareil Android réel, ouvrir l’URL via Chrome.
   - Vérifier le bandeau « Installer l’application » ou les trois points > *Installer l’application*.
   - Après installation, ouvrir l’app depuis l’icône et couper le réseau : les écrans principaux doivent rester accessibles et les actions en file doivent se synchroniser dès le retour réseau.
2. **iOS / Safari**
   - Ouvrir l’URL dans Safari, appuyer sur **Partager > Sur l’écran d’accueil**.
   - Confirmer l’icône et le nom, puis lancer l’app en mode standalone.
   - Tester l’expérience hors-ligne (mode avion) : l’écran d’accueil et la bibliothèque doivent se charger depuis le cache.

## Distribution mobile via Capacitor
1. Vérifier/adapter `capacitor.config.ts` (App ID `com.neurosooth.app`, `webDir: dist`).
2. Générer le build web :
   ```bash
   npm run build
   ```
3. Initialiser les plateformes :
   ```bash
   npx cap add ios
   npx cap add android
   ```
4. Copier le build dans les shells natifs après chaque release :
   ```bash
   npx cap sync
   ```
5. Ouvrir les projets correspondants (`npx cap open ios` / `android`), configurer les certificats stores (App Store / Play Store), puis soumettre les binaires. Les assets PWA (manifest + icônes) sont réutilisés automatiquement.

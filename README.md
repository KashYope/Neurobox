# NeuroSooth – Boîte à outils somatique pour profils neurodivergents

NeuroSooth est une application Vite + React pensée comme une boîte à outils pour les personnes neuro-atypiques. Les exercices somatiques sont présentés sous forme de cartes triables par situation émotionnelle (crise, stress, sommeil, etc.). Chaque carte ouvre un parcours détaillé étape par étape et les membres de la communauté peuvent ajouter leurs propres pratiques, remercier celles qui les ont aidés ou — côté pros — injecter des fiches partenaires validées.

## Fonctionnalités principales
- **Onboarding personnalisé** – Collecte du prénom et des neuroprofils (`NeuroType`) pour adapter les recommandations via `getRecommendedExercises`.
- **Filtrage par situations** – Barre de filtres (`Situation`) pour ne voir que les exercices pertinents dans le tableau de bord.
- **Cartes interactives** – Aperçu visuel avec tags, durée, compteur de remerciements et états de modération; clic = vue détaillée avec avertissements et instructions chronologiques.
- **Dire merci** – Bouton « Dire Merci » (`incrementThanks`) avec mise à jour optimiste; la mutation est poussée dans `syncService` puis synchronisée avec l’API quand le réseau revient.
- **Contribution communautaire** – `AddExerciseForm` permet de soumettre une technique (image, étapes, situations) qui reste en statut « pending » jusqu’à modération.
- **Backoffice Partenaires** – `PartnerPortal` offre l’inscription/connexion locale de comptes, la publication immédiate de fiches partenaires et l’import CSV/JSON (mappage automatique des colonnes usuelles).
- **Panel de modération** – Vue dédiée pour approuver/refuser les contributions (locales ou issues de l’API), ajouter des notes et suivre les décisions récentes.
- **Synchronisation hors-ligne** – Cache persistant Dexie (IndexedDB) via `services/storage/offlineDb`, service de synchronisation (`syncService`) et service worker Workbox (`src/sw.ts`) avec Background Sync pour rejouer les mutations.
- **Accès administrateur** – Le tiroir supérieur droit regroupe l’état réseau, la session partenaire en cours, la saisie des jetons JWT (`services/tokenStore`) et l’accès rapide aux vues Partenaires/Modération/Contribution.

## Stack & Architecture
- **Framework** : React 19 + Vite 6 + TypeScript 5.8.
- **UI** : composants maison (ex. `components/Button.tsx`) et classes utilitaires (Tailwind-like).
- **Données** : `INITIAL_EXERCISES` dans `constants.ts`, types partagés dans `types.ts`, `services/dataService.ts` centralise lecture/écriture et scoring, `services/syncService.ts` orchestre cache + mutations offline, et `services/apiClient.ts` pilote les appels REST authentifiés.
- **Stockage offline** : `services/storage/offlineDb.ts` encapsule Dexie + attachments (images encodées) avec migration depuis l’ancien `localStorage`.
- **Tests** : `tests/syncService.test.ts` vérifie l’hydratation offline, la relecture de file et la résolution de conflits via `node:test`.
- **Backend** : Express + PostgreSQL (`server/`) avec routes `exercises` et `moderation`, validation Zod (`utils/validation`), JWT (`auth.ts`) et migrations SQL (`server/migrations`).

```
.
├── components/
│   └── Button.tsx
├── constants.ts                # Exercices préchargés
├── index.tsx                   # Arbre React principal (dashboard, formulaires, panels)
├── services/
│   ├── apiClient.ts            # Client HTTP + gestion des tokens
│   ├── dataService.ts          # Accès données + algorithme de recommandation
│   ├── syncService.ts          # Cache offline, file de mutations, background sync
│   └── storage/offlineDb.ts    # Adaptateur Dexie + migration depuis localStorage
├── tests/
│   └── syncService.test.ts     # Tests node:test des scénarios offline/online
├── server/
│   ├── src/                    # API Express (routes, auth, db, validation)
│   └── migrations/001_init.sql
└── src/sw.ts                   # Service worker Workbox + BackgroundSync
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
3. Ouvrir [http://localhost:5173](http://localhost:5173), compléter l’onboarding et explorer les filtres/suggestions.

Pour préparer une version de production, exécutez `npm run build` puis `npm run preview` afin de vérifier le bundle statique.

### Tests automatisés
Le dépôt inclut une suite `node:test` focalisée sur `syncService` (hydratation offline, replay des mutations, résolution de conflits).

```bash
npm test
```

La commande compile les tests TypeScript (`tsconfig.test.json` + `scripts/fix-test-imports.mjs`) avant d’exécuter `node --test dist-test`.

## Synchronisation & stockage hors-ligne
- `services/storage/offlineDb` utilise Dexie/IndexedDB pour stocker exercices, profil utilisateur, pièces jointes et file `PendingMutationRecord`.
- `syncService` garde le cache en mémoire, notifie l’UI (`subscribe`/`subscribeStatus`) et met en file les mutations (`createExercise`, `incrementThanks`, `moderateExercise`).
- Les mutations sont rejouées quand `navigator.onLine` redevient `true` ou lorsqu’un `background sync` est déclenché par `src/sw.ts`.
- `services/dataService` expose des helpers (enregistrement utilisateur, scoring personnalisé via neurotypes, modération locale) et délègue la persistance à `syncService`.

## API backend Express + PostgreSQL

Une API REST Express vit dans `server/` afin de partager les exercices, remercier une pratique et suivre les décisions de modération.

### Configuration
- Copiez `.env.example` vers `.env` et renseignez au minimum `DATABASE_URL`, `JWT_SECRET`, `PORT` et `VITE_API_BASE_URL` (utilisé par le client React).
- Lancez les migrations PostgreSQL :
  ```bash
  npm run server:migrate
  ```
- Démarrez l’API en mode développement (TypeScript + watch) :
  ```bash
  npm run server:dev
  ```
- Pour un build JS :
  ```bash
  npm run server:build
  npm run server:start
  ```
- En production, vous pouvez utiliser le Dockerfile racine :
  ```bash
  docker build -t neurosooth-api .
  docker run --env-file .env -p 4000:4000 neurosooth-api
  ```

### Routes exposées (préfixe `/api`)

| Méthode | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/exercises` | Retourne toutes les pratiques (avec `serverId`, timestamps, métadonnées de modération et `thanksCount`). |
| POST | `/api/exercises` | Crée un exercice communautaire ou partenaire (jeton `partner` optionnel). |
| POST | `/api/exercises/:id/thanks` | Incrémente le compteur `thanksCount`. |
| PATCH | `/api/exercises/:id/moderation` | Approuve/rejette une contribution et peut la marquer comme supprimée (`shouldDelete`). |
| GET | `/api/moderation/queue` | File des contributions en attente + dernières décisions (JWT `moderator` requis). |

### Authentification JWT
Les actions sensibles sont protégées via des Bearer tokens signés avec `JWT_SECRET`. Deux rôles sont supportés :

- `partner` : publier du contenu directement approuvé et accéder au backoffice.
- `moderator` : charger la file `/api/moderation/queue` et appliquer des décisions.

Un utilitaire simplifie la génération locale de tokens :

```bash
# Jeton partenaire (subject facultatif)
npm run server:token partner mon-equipe

# Jeton modérateur
npm run server:token moderator alice
```

Collez ensuite ces jetons dans la section « Jetons API » du tiroir administrateur. Les valeurs sont stockées dans `localStorage` via `services/tokenStore` et injectées automatiquement dans `apiClient`.

### Synchronisation front/back
- `services/syncService` gère la file des mutations (création, remerciements, modération) puis réconcilie les exercices renvoyés par l’API.
- Les exercices marqués `deletedAt` côté serveur sont supprimés du cache et n’apparaissent plus dans les recommandations.
- Le panel de modération interroge périodiquement `/api/moderation/queue`; en cas d’erreur réseau ou de jeton manquant il bascule automatiquement sur les données locales.

## Ajouter un exercice manuellement
1. Depuis le tableau de bord principal, cliquez sur **Ajouter une technique** pour ouvrir `AddExerciseForm`.
2. Renseignez au minimum le titre, la description et une situation cible.
3. Indiquez chaque étape dans l’ordre; des URL d’images/GIF optionnelles peuvent améliorer la carte.
4. Validez : la contribution est stockée localement, passe en statut « pending » et attend la validation du panel de modération.

## Dire merci et suivi d’impact
- Le bouton « Dire Merci » (vue détail) appelle `incrementThanks`, incrémente le compteur et déclenche un rerender des cartes afin que les techniques les plus utiles montent naturellement dans les recommandations.
- Ces remerciements sont mis en file dans `syncService` afin d’être persistés côté serveur dès que possible.

## Espaces d’administration

### Backoffice Partenaires (`PartnerPortal`)
- Accédez-y via le tiroir administrateur (**Espace Partenaires**).
- Les organisations créent un compte local (stocké dans `localStorage`) ou se connectent à un compte existant.
- Deux workflows sont proposés :
  - **Création manuelle** : formulaire complet (tags, étapes dynamiques, profils ciblés) publié instantanément et marqué « Partenaire ».
  - **Import CSV/JSON** : parsing tolérant (`mapRowToDraft`) avec auto-détection des colonnes (`title`, `description`, `situations`, `steps`, `tags`, `warning`, `imageUrl`). Les listes acceptent `|`, `;` ou `,`.

### Panel de modération
- Accessible via le tiroir administrateur (**Modération**). Sans session partenaire, l’utilisateur est redirigé vers l’espace partenaires pour s’authentifier.
- Affiche les contributions `isCommunitySubmitted` en attente et un historique des décisions approuvées/refusées (8 derniers items).
- Les modérateurs peuvent saisir une note, appliquer **Valider** ou **Refuser** (`moderateExercise`). Les décisions mettent à jour `moderationStatus`, `moderationNotes`, `moderatedAt`, `moderatedBy` et peuvent supprimer l’entrée (`shouldDelete`).
- Si un jeton `moderator` valide est stocké, la file serveur est chargée toutes les 45 s; sinon l’interface reste fonctionnelle avec les données locales.

## Progressive Web App
- `vite-plugin-pwa` injecte automatiquement le service worker `src/sw.ts` (Workbox) et le manifeste (`public/manifest.webmanifest`).
- `src/sw.ts` met en cache le shell (`StaleWhileRevalidate`), les réponses API `/api/*` (`NetworkFirst` + `BackgroundSyncPlugin`) et répond aux messages `syncService` pour planifier un `Background Sync`.
- `services/syncService` déclenche cette synchronisation après chaque mutation pour garantir une reprise automatique même hors-ligne.

### QA « Add to Home Screen »
1. **Android / Chrome**
   - Construire l’app (`npm run build`), déployer `dist` ou lancer `npm run preview`.
   - Sur un appareil Android réel, ouvrir l’URL via Chrome.
   - Vérifier le bandeau « Installer l’application » ou le menu ⋮ > *Installer l’application*.
   - Après installation, couper le réseau : le shell et la bibliothèque doivent rester accessibles et les actions en file se synchroniser dès le retour réseau.
2. **iOS / Safari**
   - Ouvrir l’URL dans Safari, appuyer sur **Partager > Sur l’écran d’accueil**.
   - Lancer l’app en mode standalone et activer le mode avion.
   - Vérifier que l’écran d’accueil et la bibliothèque se chargent depuis le cache et que les actions sont rejouées une fois la connexion rétablie.

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

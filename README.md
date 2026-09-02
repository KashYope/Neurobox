# NDee – La boîte à outils de la neurodiversité

NDee est une application Vite + React qui associe une auto-réflexion privée à une boîte à outils pratique pour la neurodiversité. Chaque partie reste utilisable séparément. Les données de réflexion et la personnalisation restent sur l’appareil et NDee n’est pas un outil médical.

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
├── index.tsx                   # Export de l'app (point d'entrée alternatif)
├── features/
│   ├── admin/                  # Panel de modération et outils admin
│   ├── dashboard/              # Tableau de bord principal
│   └── partners/               # Portail partenaires
├── services/
│   ├── apiClient.ts            # Client HTTP + gestion des tokens
│   ├── dataService.ts          # Accès données + algorithme de recommandation
│   ├── syncService.ts          # Cache offline, file de mutations, background sync
│   ├── languageService.ts      # Gestion préférences langues + chargement lazy
│   ├── translationService.ts   # Traduction dynamique via Google Translate API
│   ├── contentResolver.ts      # Résolution des IDs de chaînes traduites
│   ├── tokenStore.ts           # Stockage sécurisé des jetons JWT
│   └── storage/
│       ├── offlineDb.ts        # Adaptateur IndexedDB + migration localStorage
│       └── dexieShim.ts        # Implémentation légère compatible Dexie
├── src/
│   ├── App.tsx                 # Composant React principal (dashboard, formulaires, panels)
│   ├── main.tsx                # Point d'entrée React (rendu, service worker)
│   ├── i18n.ts                 # Configuration i18next (lazy loading)
│   ├── i18nContext.tsx         # Contexte React pour i18n (compatible React 19)
│   ├── index.css               # Styles Tailwind + styles personnalisés
│   └── sw.ts                   # Service worker Workbox + BackgroundSync
├── public/
│   ├── offline.html            # Page de fallback hors-ligne
│   └── locales/
│       ├── fr/
│       │   ├── common.json     # Labels UI, boutons, filtres
│       │   ├── onboarding.json # Écran d'accueil
│       │   ├── exercise.json   # Interface exercices
│       │   ├── partner.json    # Portail partenaires
│       │   └── moderation.json # Panel de modération
│       ├── en/, de/, es/, nl/  # Mêmes 5 namespaces
├── tests/
│   └── syncService.test.ts     # Tests node:test des scénarios offline/online
└── server/
    ├── src/                    # API Express (routes, auth, db, validation)
    │   ├── index.ts            # Serveur Express principal
    │   ├── auth.ts             # Middleware d'authentification JWT
    │   ├── db.ts               # Connexion PostgreSQL
    │   ├── routes/             # Routes API (exercises, moderation, strings)
    │   ├── services/           # Services métier (batchTranslation, etc.)
    │   └── utils/              # Utilitaires (validation Zod, etc.)
    ├── scripts/                # Scripts d'initialisation et seed
    └── migrations/             # Migrations SQL PostgreSQL
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
3. Ouvrir [http://localhost:3000](http://localhost:3000), compléter l'onboarding et explorer les filtres/suggestions.

Pour préparer une version de production, exécutez `npm run build` puis `npm run preview` afin de vérifier le bundle statique.

### Tests automatisés
Le dépôt inclut une suite `node:test` focalisée sur `syncService` (hydratation offline, replay des mutations, résolution de conflits).

```bash
npm test
```

La commande compile les tests TypeScript (`tsconfig.test.json` + `scripts/fix-test-imports.mjs`) avant d’exécuter `node --test dist-test`.

## Support multi-langues (i18n)

L'application supporte 5 langues avec chargement lazy (optimisé pour réduire le transfert initial de ~80%) :

- **Français** (par défaut)
- **English**
- **Deutsch** (Allemand)
- **Español** (Espagnol)
- **Nederlands** (Néerlandais)

### Architecture
- **Bibliothèque** : `i18next` + `i18next-http-backend` + contexte React personnalisé (`src/i18nContext.tsx`) compatible React 19
- **Lazy loading** : Seule la langue sélectionnée est chargée (5 fichiers JSON au lieu de 25)
- **Namespaces** : 5 namespaces (common, onboarding, exercise, partner, moderation) pour organisation modulaire
- **Stockage prioritaire** : `localStorage.neurobox_user_language` avec timestamp
- **Cache service worker** : `CacheFirst` avec précaching pour les fichiers `/locales/*` (30 jours, max 10 entrées par langue)
- **Traduction dynamique** : `services/translationService.ts` pour contenu généré (exercices) via Google Cloud Translation API

### Configuration utilisateur
1. **À l'onboarding** : 5 boutons de sélection en haut de l'écran permettent de choisir la langue avant même de commencer
2. **Post-onboarding** : Le sélecteur dans le tiroir administrateur permet de basculer à tout moment
3. **Détection automatique** : Si aucune préférence n'est stockée, l'app détecte la langue du navigateur puis bascule sur le français en fallback

### Fichiers de traduction
```
public/locales/
├── fr/
│   ├── common.json       # Labels UI, boutons, filtres, menu admin (103 lignes)
│   ├── onboarding.json   # Écran d'accueil (8 lignes)
│   ├── exercise.json     # Interface exercices et détails
│   ├── partner.json      # Portail partenaires et import CSV
│   └── moderation.json   # Panel de modération
├── en/, de/, es/, nl/    # Mêmes 5 namespaces
```

Tout le contenu statique (boutons, filtres, états de modération, menus) est traduit. Pour ajouter une clé, éditez les 5 fichiers du namespace approprié puis utilisez `t('namespace:cle')` dans les composants React via `useTranslation(['common', 'exercise'])`.

### Traduction de contenu dynamique

Les exercices (titres, descriptions, étapes) sont maintenant entièrement traduits automatiquement :

#### Configuration
1. Obtenir une clé API Google Cloud Translation
2. L'ajouter uniquement à l'environnement du serveur :
   ```bash
   GOOGLE_TRANSLATE_API_KEY=votre_cle_ici
   ```

La clé n'est jamais exposée au bundle Vite ni stockée dans le navigateur.

#### Architecture de traduction

**Backend** :
- `server/src/services/translationService.ts` - Service de traduction serveur avec Google Translate API
- `server/src/services/batchTranslationService.ts` - Traduction batch orchestrée
- Table `exercise_strings` - Textes sources en français
- Table `exercise_translations` - Traductions par langue
- API `/admin/batch-translations` - Endpoint pour lancer des traductions batch
- API `/strings/translations/{lang}` - Récupération des traductions par langue

**Frontend** :
- `services/exerciseTranslationService.ts` - Récupère et applique les traductions
- `hooks/useExerciseTranslation.ts` - Hook React qui traduit automatiquement les exercices selon la langue active
- Cache IndexedDB par langue, avec repli hors-ligne vers la traduction en cache puis le texte source français

#### Utilisation

1. **Seed initial** : Peupler la base avec les chaînes sources
   ```bash
   docker exec neurobox_app npx tsx server/scripts/seedExerciseStrings.ts
   ```

2. **Lancer une traduction batch** : Via le panel admin → "Orchestration des traductions"
   - Sélectionner les langues cibles (EN, DE, ES, NL)
   - Choisir le périmètre ("exercise" pour tous les exercices)
   - Suivre la progression en temps réel

3. **Basculer de langue** : Les exercices se traduisent automatiquement
   - Le hook `useExerciseTranslation` détecte le changement de langue
   - Récupère les traductions depuis l'API
   - Applique les traductions à tous les exercices affichés

**Coût estimé** : 3-6$/mois pour 1000 utilisateurs avec cache agressif (traductions stockées en base).

Sans clé API, le système affiche un message d'erreur lors des traductions batch et le contenu reste en français.

### Tests & débogage

Exécutez `npm test` pour compiler et lancer la suite automatisée. Pour vérifier le chargement différé des langues dans le navigateur, utilisez l'onglet Réseau et IndexedDB des outils de développement après un changement de langue.

## Synchronisation & stockage hors-ligne
- `services/storage/offlineDb` utilise un shim IndexedDB léger (`dexieShim.ts`, compatible Dexie) pour stocker exercices, profil utilisateur, pièces jointes, traductions et file `PendingMutationRecord`.
- `syncService` garde le cache en mémoire, notifie l'UI (`subscribe`/`subscribeStatus`) et met en file les mutations (`createExercise`, `incrementThanks`, `moderateExercise`).
- Les mutations sont rejouées quand `navigator.onLine` redevient `true` ou lorsqu'un `background sync` est déclenché par `src/sw.ts`.
- `services/dataService` expose des helpers (enregistrement utilisateur, scoring personnalisé via neurotypes, modération locale) et délègue la persistance à `syncService`.
- `services/languageService` gère les préférences linguistiques avec chargement lazy pour optimiser les performances.
- `services/contentResolver` résout les IDs de chaînes traduites pour le contenu des exercices depuis la base de données.

## API backend Express + PostgreSQL

Une API REST Express vit dans `server/` afin de partager les exercices, remercier une pratique et suivre les décisions de modération.

### Configuration
- Copiez `.env.example` vers `.env` et renseignez au minimum `DATABASE_URL`, `JWT_SECRET`, `PORT` et `VITE_API_BASE_URL` (utilisé par le client React).
- Lancez les migrations PostgreSQL :
  ```bash
  npm run server:migrate
  ```
- **Créer un compte administrateur** : après avoir configuré `DATABASE_URL`, exécutez le script de seed pour insérer un compte admin par défaut puis changez immédiatement son mot de passe.
  ```bash
  npx tsx server/scripts/seedAdmin.ts
  ```
  Vérifiez que l’utilisateur est bien créé avec le rôle **admin** (utile pour gérer les droits `moderator`) avant de passer en production.
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

### Content Security Policy (CSP)

La politique de sécurité du contenu (Content Security Policy) est gérée côté serveur pour renforcer la sécurité de l'application. Elle est configurée dans le fichier `server/src/index.ts` via le middleware `helmet`.

La configuration se trouve dans la fonction `buildContentSecurityPolicy`. Pour autoriser une nouvelle source pour un type de contenu (par exemple, une image), ajoutez le domaine à la directive correspondante.

Les illustrations publiques sont limitées aux ressources de même origine et aux SVG procéduraux générés localement. Les URL d'images externes ne sont pas acceptées dans les contributions.

## Déploiement Coolify

Créez une ressource **Docker Compose** depuis ce dépôt et utilisez `docker-compose.yaml`. Le manifeste construit l'application, garde PostgreSQL privé, conserve ses données dans le volume `postgres-data` et route le service `app` vers son port interne `4000`.

Coolify génère `SERVICE_PASSWORD_POSTGRES` et `SERVICE_PASSWORD_64_JWT`. Renseignez `CORS_ORIGINS` avec l'origine publique exacte de l'application (par exemple `https://ndee.example.com`) et associez ce domaine au service `app` sur le port interne `4000`. `GOOGLE_TRANSLATE_API_KEY` reste facultative. Les migrations sont exécutées automatiquement au démarrage du conteneur applicatif.

Consultez `deploy/README.md` pour la configuration, la première mise en production et les contrôles après déploiement.

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

# Jeton partenaire (subject facultatif)
npm run server:token partner mon-equipe

## Système de traduction (base de données)

Le contenu des exercices repose sur un système de traduction persistant qui stocke les chaînes dans PostgreSQL et les met en cache dans IndexedDB. `exerciseTranslationService` est l'unique résolveur frontend et retombe sur le texte source français lorsque le réseau et le cache ne fournissent pas de traduction.

### Structure
- **String IDs** : `exercise.resp_478.title`, `exercise.resp_478.description`, `exercise.resp_478.step_1`, etc.
- **Tables PostgreSQL** : `exercise_strings` (chaînes sources) et `exercise_translations` (traductions par langue).
- **Caches IndexedDB** : `exerciseStrings` et `exerciseStringTranslations` pour un usage offline.

### Mise en place / migration
1. Créer les tables :
   ```powershell
   npm run server:migrate
   ```
2. Peupler les chaînes initiales (extraites de `INITIAL_EXERCISES`) :
   ```powershell
   # Assurez-vous que DATABASE_URL est défini
   npx tsx scripts/seedExerciseStrings.ts
   ```
3. Vérifier l’installation (optionnel) :
   ```powershell
   npx tsx scripts/testTranslationSystem.ts
   ```

### Utilisation API
Les routes suivantes exposent les chaînes et traductions (préfixe `/api`). Les rôles se basent sur les Bearer tokens générés via `npm run server:token <role> <subject>`.

| Méthode | Endpoint | Description | Rôle requis |
| --- | --- | --- | --- |
| GET | `/strings` | Lister toutes les chaînes (filtrage possible via `?context=exercise`) | Public |
| GET | `/strings/:id` | Récupérer une chaîne | Public |
| POST | `/strings` | Créer une nouvelle chaîne | Partner ou Moderator |
| DELETE | `/strings/:id` | Supprimer une chaîne | Moderator |
| GET | `/strings/:id/translations` | Voir les traductions d’une chaîne | Public |
| GET | `/strings/translations/:lang` | Lister toutes les traductions d’une langue | Public |
| POST | `/strings/:id/translations` | Ajouter ou mettre à jour une traduction | Partner ou Moderator |
| POST | `/strings/bulk` | Importer en masse chaînes + traductions | Moderator |

### Stratégie de migration
- **Phase 1** : garder les champs legacy (`title`, `description`, `steps`) et ajouter les IDs facultatifs (`titleStringId`, etc.) ; le résolveur retombe sur les champs legacy si l’ID est absent.
- **Phase 2** : exécuter le seed, renseigner les IDs dans `constants.ts` ; les nouvelles fiches utilisent directement les IDs.
- **Phase 3** : généraliser les IDs de chaînes puis retirer les champs legacy (changement majeur).

> Référence unique : toute la documentation du système de traduction est désormais centralisée dans cette section du README.

# Jeton modérateur
npm run server:token moderator alice

Collez ensuite ces jetons dans la section « Jetons API » du tiroir administrateur. Les valeurs sont stockées dans `localStorage` via `services/tokenStore` et injectées automatiquement dans `apiClient`. Les jetons `moderator`/`admin` débloquent le panel de modération, tandis que les jetons `partner` permettent la publication immédiate des fiches partenaires.

### Synchronisation front/back
- `services/syncService` gère la file des mutations (création, remerciements, modération) puis réconcilie les exercices renvoyés par l’API.
- Les exercices marqués `deletedAt` côté serveur sont supprimés du cache et n’apparaissent plus dans les recommandations.
- Le panel de modération interroge périodiquement `/api/moderation/queue`; en cas d’erreur réseau ou de jeton manquant il bascule automatiquement sur les données locales.

## Ajouter un exercice manuellement
1. Depuis le tableau de bord principal, cliquez sur **Ajouter une technique** pour ouvrir `AddExerciseForm`.
2. Renseignez au minimum le titre, la description et une situation cible.
3. Indiquez chaque étape dans l’ordre. Une illustration locale stable sera générée à partir de la situation choisie.
4. Validez : l'interface indique si la contribution a été envoyée ou sauvegardée hors-ligne. Elle reste en attente de modération jusqu'à validation.

## Dire merci et suivi d’impact
- Le bouton « Dire Merci » crée un événement idempotent lié à l'installation. Une installation ne peut voter qu'une fois par exercice et une répétition hors-ligne ne double pas le compteur.
- Le serveur calcule le total à partir des événements vérifiés. Le nombre n'est affiché qu'à partir de 10 votes; avant ce seuil, une mention éditoriale factuelle est utilisée.

## Espaces d’administration

### Backoffice Partenaires (`PartnerPortal`)
- Accédez-y via le tiroir administrateur (**Espace Partenaires**).
- Les organisations créent un compte local (stocké dans `localStorage`) ou se connectent à un compte existant.
- Deux workflows sont proposés :
  - **Création manuelle** : formulaire complet (tags, étapes dynamiques, profils ciblés) publié instantanément et marqué « Partenaire ».
  - **Import CSV/JSON** : parsing tolérant avec auto-détection des colonnes (`title`, `description`, `situations`, `steps`, `tags`, `warning`). Les listes acceptent `|`, `;` ou `,`; aucune URL d'image arbitraire n'est importée.

### Panel de modération
- Accessible via le tiroir administrateur (**Modération**). Sans session partenaire, l’utilisateur est redirigé vers l’espace partenaires pour s’authentifier.
- Affiche les contributions `isCommunitySubmitted` en attente et un historique des décisions approuvées/refusées (8 derniers items).
- Les modérateurs peuvent saisir une note, appliquer **Valider** ou **Refuser** (`moderateExercise`). Les décisions mettent à jour `moderationStatus`, `moderationNotes`, `moderatedAt`, `moderatedBy` et peuvent supprimer l’entrée (`shouldDelete`).
- Si un jeton `moderator` valide est stocké, la file serveur est chargée toutes les 45 s; sinon l’interface reste fonctionnelle avec les données locales.

## Progressive Web App
- `vite-plugin-pwa` injecte automatiquement le service worker `src/sw.ts` (Workbox) et le manifeste (`public/manifest.webmanifest`).
- `src/sw.ts` implémente une stratégie de cache complète pour une utilisation 100% hors-ligne :
  - **App shell** : `StaleWhileRevalidate` pour HTML/JS/CSS avec mise en cache immédiate lors de l'installation.
  - **API** : `NetworkFirst` avec fallback sur cache (timeout 10s) + `BackgroundSyncPlugin` pour rejouer les mutations.
  - **Locales** : `StaleWhileRevalidate` pour fichiers `/locales/*` (7 jours, max 10 entrées) permettant le changement de langue hors-ligne.
  - **Images** : `CacheFirst` avec expiration 30 jours (max 100 entrées).
  - **CDN externes** : `StaleWhileRevalidate` pour fonts.googleapis.com, aistudiocdn.com, cdn.tailwindcss.com, etc. (max 60 entrées, 30 jours).
  - **Fallback offline** : `setCatchHandler` redirige les requêtes échouées vers le cache ou une erreur appropriée.
- `services/syncService` déclenche la synchronisation après chaque mutation pour garantir une reprise automatique dès le retour réseau.

### Installation sur mobile
1. **Android / Chrome**
   - Construire l'app de production : `npm run build`.
   - Démarrer le serveur preview : `npm run preview`.
   - Sur votre PC, identifier votre adresse IP locale (`ipconfig` sur Windows, `ifconfig` sur macOS/Linux).
   - Sur votre appareil Android connecté au **même réseau Wi-Fi**, ouvrir Chrome et accéder à `http://VOTRE_IP:4173`.
   - Chrome affichera un bandeau « Ajouter à l'écran d'accueil » ou accéder via ⋮ > *Installer l'application*.
   - Après installation, l'app fonctionne **entièrement hors-ligne** : le shell, les exercices et les images sont mis en cache automatiquement.
   - Les actions (remerciements, contributions) sont mises en file et synchronisées dès le retour réseau.
2. **iOS / Safari**
   - Même procédure pour accéder à l'URL via Safari.
   - Appuyer sur **Partager > Sur l'écran d'accueil**.
   - Lancer l'app en mode standalone.
   - Activer le mode avion pour vérifier que l'application reste pleinement fonctionnelle hors-ligne.

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

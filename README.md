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
│   ├── languageService.ts      # Gestion préférences langues + chargement lazy
│   ├── translationService.ts   # Traduction dynamique via Google Translate API
│   └── storage/offlineDb.ts    # Adaptateur Dexie + migration depuis localStorage
├── src/
│   ├── i18n.ts                 # Configuration i18next (lazy loading)
│   └── sw.ts                   # Service worker Workbox + BackgroundSync
├── public/
│   └── locales/
│       ├── fr/
│       │   ├── common.json
│       │   └── onboarding.json
│       ├── en/, de/, es/, nl/  # Mêmes namespaces
├── tests/
│   └── syncService.test.ts     # Tests node:test des scénarios offline/online
└── server/
    ├── src/                    # API Express (routes, auth, db, validation)
    └── migrations/001_init.sql
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

## Support multi-langues (i18n)

L'application supporte 5 langues avec chargement lazy (optimisé pour réduire le transfert initial de ~80%) :

- **Français** (par défaut)
- **English**
- **Deutsch** (Allemand)
- **Español** (Espagnol)
- **Nederlands** (Néerlandais)

### Architecture
- **Bibliothèque** : `react-i18next` + `i18next` pour les traductions statiques UI
- **Lazy loading** : Seule la langue sélectionnée est chargée (2 fichiers JSON au lieu de 10)
- **Stockage prioritaire** : `localStorage.neurobox_user_language` avec timestamp
- **Cache service worker** : `StaleWhileRevalidate` pour les fichiers `/locales/*` (7 jours, max 10 entrées)
- **Traduction dynamique** : `services/translationService.ts` pour contenu généré (exercices) via Google Cloud Translation API

### Configuration utilisateur
1. **À l'onboarding** : 5 boutons de sélection en haut de l'écran permettent de choisir la langue avant même de commencer
2. **Post-onboarding** : Le sélecteur dans le tiroir administrateur permet de basculer à tout moment
3. **Détection automatique** : Si aucune préférence n'est stockée, l'app détecte la langue du navigateur puis bascule sur le français en fallback

### Fichiers de traduction
```
public/locales/
├── fr/
│   ├── common.json       # Labels UI, boutons, filtres, menu admin
│   └── onboarding.json   # Écran d'accueil
├── en/, de/, es/, nl/    # Mêmes namespaces
```

Tout le contenu statique (boutons, filtres, états de modération, menus) est traduit. Pour ajouter une clé, éditez les 5 fichiers `common.json` puis utilisez `t('cle')` dans les composants React.

### Traduction de contenu dynamique (optionnel)
Pour traduire les exercices (titres, descriptions, étapes) créés par la communauté :

1. Obtenir une clé API Google Cloud Translation
2. L'ajouter dans `.env` :
   ```bash
   VITE_GOOGLE_TRANSLATE_API_KEY=votre_cle_ici
   ```
3. Le service `translationService.ts` traduit automatiquement à la demande avec cache IndexedDB + mémoire (coût estimé : 3-6$/mois pour 1000 utilisateurs)

Sans clé API, le contenu dynamique reste en français (langue originale).

### Tests & débogage
Un script de validation est fourni dans `test-lazy-loading.js` :

```js
// Dans la console navigateur, coller le contenu du fichier puis :
testLazyLoading.inspectCache()        // Voir les langues en cache
testLazyLoading.simulateSwitch('de')  // Tester le switch allemand
testLazyLoading.clearStorage()        // Réinitialiser les préférences
```

Voir `LAZY_LOADING_TEST.md` pour le guide complet et `LANGUAGE_OPTIMIZATION_COMPLETE.md` pour les détails d'implémentation.

## Synchronisation & stockage hors-ligne
- `services/storage/offlineDb` utilise Dexie/IndexedDB pour stocker exercices, profil utilisateur, pièces jointes, traductions et file `PendingMutationRecord`.
- `syncService` garde le cache en mémoire, notifie l'UI (`subscribe`/`subscribeStatus`) et met en file les mutations (`createExercise`, `incrementThanks`, `moderateExercise`).
- Les mutations sont rejouées quand `navigator.onLine` redevient `true` ou lorsqu'un `background sync` est déclenché par `src/sw.ts`.
- `services/dataService` expose des helpers (enregistrement utilisateur, scoring personnalisé via neurotypes, modération locale) et délègue la persistance à `syncService`.
- `services/languageService` gère les préférences linguistiques avec chargement lazy pour optimiser les performances.

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

## Déploiement VPS (Docker + nginx)

Un guide détaillé est disponible dans `deploy/README.md`. Il couvre :

- La génération d’un fichier `.env.server` à partir de `deploy/env.server.example`
- La construction/pousse de l’image (`docker build -t neurobox:latest .`)
- L’utilisation du manifeste `docker-compose.neurobox.yml` pour exposer l’API sur un port dédié (`4400`) et un réseau isolé (`neurobox_net`) afin de ne pas perturber les autres services Docker du VPS
- La configuration nginx (`deploy/nginx.conf.example`) qui sert les fichiers `dist/` et proxifie `/api/` vers l’API

Suivez ce guide pour installer Docker/compose sur l’hôte, exécuter les migrations (`docker compose -f docker-compose.neurobox.yml run --rm neurobox-api npm run server:migrate`), démarrer le service (`... up -d`) puis activer HTTPS avec certbot.

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

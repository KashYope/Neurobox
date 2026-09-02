# Déploiement Coolify

Le dépôt se déploie comme une ressource **Docker Compose**. `docker-compose.yml` est la source de vérité : il construit le frontend et l'API dans une seule image, démarre PostgreSQL sur le réseau privé de la ressource et conserve la base dans `postgres-data`.

## Configuration

1. Dans Coolify, créez une ressource à partir du dépôt Git et choisissez **Docker Compose**.
2. Conservez `docker-compose.yml` comme chemin du manifeste.
3. Associez le domaine HTTPS au service `app`, port interne `4000`. Aucun port hôte ne doit être publié.
4. Vérifiez les variables détectées :
   - `SERVICE_PASSWORD_POSTGRES` : mot de passe PostgreSQL généré et réutilisé dans `DATABASE_URL`.
   - `SERVICE_PASSWORD_64_JWT` : secret JWT aléatoire de 64 caractères.
   - `SERVICE_URL_APP_4000` : URL publique du service, utilisée comme origine CORS.
   - `GOOGLE_TRANSLATE_API_KEY` : facultative; laissez-la vide si la traduction automatique n'est pas utilisée.
5. Déployez. Le conteneur attend PostgreSQL, exécute les migrations puis démarre l'API qui sert aussi le build Vite.

Les variables `SERVICE_*` sont des [variables magiques Coolify](https://coolify.io/docs/knowledge-base/docker/compose#coolifys-magic-environment-variables). Pour un domaine personnalisé, saisissez par exemple `https://example.com:4000` dans le champ Domains du service `app`; le suffixe indique le port interne et n'expose pas `4000` publiquement.

## Vérifications après déploiement

- `https://votre-domaine/healthz` répond avec un statut HTTP 200.
- `https://votre-domaine/` charge l'application et ses assets.
- `https://votre-domaine/api/exercises` répond sans erreur CORS.
- Les services `app` et `postgres` sont sains dans Coolify.
- Le volume `postgres-data` est présent avant toute mise à jour destructive.

Le healthcheck est défini dans `docker-compose.yml`, conformément au fonctionnement des [healthchecks Compose dans Coolify](https://coolify.io/docs/knowledge-base/health-checks). PostgreSQL n'est pas exposé hors du réseau privé de la ressource.

## Exploitation

- Les migrations sont idempotentes et s'exécutent à chaque démarrage via la commande du `Dockerfile`.
- Une mise à jour normale consiste à redéployer le dernier commit depuis Coolify.
- Sauvegardez PostgreSQL avant une migration risquée ou une modification du volume.
- Ne placez jamais de fichier `.env`, de clé SSH ou de secret dans le dépôt; renseignez les secrets uniquement dans Coolify.

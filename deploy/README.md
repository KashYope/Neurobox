# Neurobox VPS Deployment Guide

This document walks through executing the approved plan so the Neurobox API and Vite frontend can run on an Ubuntu VPS that already hosts other Docker workloads.

## 1. Gather environment variables

1. Copy `deploy/env.server.example` to `.env.server` on your workstation.
2. Fill in production values for:
   - `DATABASE_URL` – point to the managed or self-hosted PostgreSQL instance. The schema is defined in `server/migrations/001_init.sql`. The server exits at startup if this is missing in production.
   - `JWT_SECRET` – generate a long random string (e.g. `openssl rand -hex 32`). The server exits at startup if this is missing in production.
   - `CORS_ORIGINS` – comma-separated list of HTTPS origins allowed to hit the API.
   - Optional overrides like `PORT` if 4000 is already taken in the container.
3. Store the file safely (`chmod 600 .env.server`) and keep it out of version control.

## 2. Build and publish the Docker image

```sh
npm install
docker build -t neurobox:latest .
# Optional: docker tag neurobox registry.example.com/neurobox:latest
# Optional: docker push registry.example.com/neurobox:latest
```

The multi-stage Dockerfile already builds the Vite frontend, the server bundle, and packs migrations/scripts into the final image.

## 3. Prepare the VPS runtime

1. Install Docker Engine and the compose plugin if not already present:
   ```sh
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker "$USER"
   ```
2. Copy `.env.server`, `docker-compose.neurobox.yml`, and this `deploy/` directory to the VPS (e.g. with `scp` or a git checkout).
3. If PostgreSQL also lives on the VPS, create the `neurobox` database and user, then update `DATABASE_URL`.
4. Run migrations once:
   ```sh
   docker compose -f docker-compose.neurobox.yml run --rm neurobox-api npm run server:migrate
   ```

## 4. Run the API container without conflicts

The provided `docker-compose.neurobox.yml`:

- Gives the service a unique container name (`neurobox-api`)
- Publishes container port `4000` on host port `4400` to avoid collisions
- Places the service on an isolated bridge network `neurobox_net`

Bring the service up (or update it) with:

```sh
docker compose -f docker-compose.neurobox.yml up -d
```

Logs stay isolated (`docker compose -f docker-compose.neurobox.yml logs -f neurobox-api`) and the healthcheck verifies `/healthz` before marking the container healthy.

## 5. Serve the Vite frontend via nginx

1. Copy the built `dist/` folder (from `npm run build`) to the VPS, e.g. `/var/www/neurobox`.
2. Use `deploy/nginx.conf.example` as a template. It serves static assets and proxies `/api/` calls to the API running on port `4400` (or `neurobox-api:4000` if nginx runs inside the same compose project).
3. Enable HTTPS with Let’s Encrypt (`sudo certbot --nginx -d neurobox.example.com`).
4. Reload nginx and run smoke tests:
   ```sh
   curl -I https://neurobox.example.com/
   curl https://neurobox.example.com/api/healthz
   ```

This sequence keeps the Neurobox services isolated from any existing Docker workloads on the VPS while remaining easy to maintain. Update this document if the deployment architecture evolves (e.g. you migrate to Kubernetes or add a CDN).



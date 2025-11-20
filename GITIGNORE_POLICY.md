# Git Ignore Policy

## Overview
This document explains what files are excluded from version control and why.

## Ignored Files & Directories

### 1. Environment Variables & Secrets
```
.env
.env.local
.env.production
.env.*.local
```
**Why**: Contains sensitive information like database credentials, API keys, and JWT secrets.
**Alternative**: Use `.env.example` as a template (tracked in git).

### 2. Build Output
```
dist/
build/
```
**Why**: Generated files that are rebuilt on deployment. Keeping them out reduces repo size and prevents conflicts.
**Note**: Built during Docker image creation.

### 3. Dependencies
```
node_modules/
```
**Why**: Large directory (300+ MB) that's restored from `package-lock.json`.
**Note**: Lock files ARE tracked to ensure consistent installations.

### 4. Logs & Runtime Files
```
*.log
*.pid
*.swp
logs/
```
**Why**: Generated at runtime, contain no source code, can be large.

### 5. Deployment Documentation
```
DEPLOYMENT.md
SSL_SETUP_SUMMARY.md
FINAL_SETUP_SUMMARY.md
update-frontend.sh
```
**Why**: Server-specific documentation that varies by deployment environment.
**Note**: These are auto-generated during deployment.

### 6. IDE & OS Files
```
.vscode/
.idea/
.DS_Store
Thumbs.db
```
**Why**: Personal editor settings and OS metadata that shouldn't be shared.

## What IS Tracked

✅ Source code (`.ts`, `.tsx`, `.js`, etc.)
✅ Configuration templates (`.env.example`)
✅ Docker configuration (`Dockerfile`, `docker-compose.yml`)
✅ Package manifests (`package.json`, `package-lock.json`)
✅ Documentation (`README.md`)
✅ Static assets (images, fonts, etc.)

## Setup on New Server

When deploying to a new server:

1. Clone the repository:
```bash
git clone <repo-url>
cd Neurobox
```

2. Create `.env` from template:
```bash
cp .env.example .env
nano .env  # Edit with actual values
```

3. Build and deploy:
```bash
docker-compose build
docker-compose up -d
```

## Checking Ignore Rules

Test if a file is ignored:
```bash
git check-ignore -v filename
```

List all ignored files:
```bash
git status --ignored
```

## Important Notes

- **Never commit `.env`** - It contains secrets
- **Lock files** (`package-lock.json`) ARE tracked for reproducibility
- **Docker compose** is tracked but override files are not
- **Deployment docs** are regenerated per server

## Security Best Practices

1. Always review `.env` before committing anything
2. Use `.env.example` with placeholder values
3. Rotate secrets if accidentally committed
4. Use `git log --all -- .env` to check if ever committed
5. If leaked, immediately:
   - Change all secrets
   - Rotate JWT secret
   - Update database passwords

## Updating .gitignore

If you need to ignore additional files:
```bash
echo "new-file-pattern" >> .gitignore
git add .gitignore
git commit -m "Update gitignore"
```

To unignore a previously ignored file:
```bash
git rm --cached filename
# Remove from .gitignore
git add filename
git commit -m "Track filename"
```

# Git Safety Checklist

Before pushing to remote repository, verify:

## ✅ Pre-Commit Checklist

### 1. Environment Files
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` exists with placeholder values
- [ ] No secrets in `.env.example`
- [ ] Run: `git check-ignore .env` (should match)

### 2. Build Artifacts
- [ ] `dist/` folder is ignored
- [ ] `node_modules/` is ignored
- [ ] No compiled files in staging area
- [ ] Run: `git status` (should not show dist/ or node_modules/)

### 3. Secrets Check
```bash
# Check if .env was ever committed
git log --all --full-history -- .env

# Should return nothing. If it returns commits, secrets may be in history!
```

### 4. Deployment Docs
- [ ] Server-specific docs are ignored (DEPLOYMENT.md, etc.)
- [ ] Only general README.md is tracked

### 5. Logs & Temporary Files
- [ ] No *.log files being tracked
- [ ] No *.swp or *.tmp files
- [ ] Run: `git status --ignored` to verify

## 🔍 Pre-Push Verification

```bash
# View what will be committed
git diff --cached

# Check for sensitive patterns
git diff --cached | grep -i "password\|secret\|key\|token"

# Should return nothing or only .env.example placeholders
```

## 🚨 Emergency: If Secrets Were Committed

If you accidentally committed `.env` or secrets:

### Option 1: Not Pushed Yet (Easy)
```bash
# Undo the last commit, keep changes
git reset --soft HEAD~1

# Remove .env from staging
git reset HEAD .env

# Commit again without .env
git add .
git commit -m "Your commit message"
```

### Option 2: Already Pushed (Requires Force Push)
```bash
# Remove .env from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - coordinate with team!)
git push origin --force --all

# Then immediately:
# 1. Rotate all secrets
# 2. Change JWT_SECRET
# 3. Update database passwords
# 4. Notify team members
```

### Option 3: Use BFG Repo-Cleaner (Recommended for large repos)
```bash
# Install BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env from entire history
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## 🔒 Ongoing Security

### Daily
- [ ] Check `git status` before commits
- [ ] Review `git diff` before staging

### Weekly
- [ ] Verify `.env` is still ignored: `git check-ignore .env`
- [ ] Check for new sensitive files in repo

### Monthly
- [ ] Audit git history for leaks: `git log --all -S "password" -p`
- [ ] Review and update `.gitignore` if needed

## 📋 Quick Commands

```bash
# Test ignore rules
git check-ignore -v <filename>

# See all ignored files
git status --ignored

# Check what's staged
git diff --cached --name-only

# Unstage a file
git reset HEAD <filename>

# Check if a file was ever in git
git log --all --full-history -- <filename>
```

## ✅ Safe to Push When:

1. `git log --all -- .env` returns nothing
2. `git status` shows no dist/ or node_modules/
3. `git diff --cached | grep -i secret` returns nothing (or only placeholders)
4. `.gitignore` is up to date
5. `.env.example` has no real secrets

## 📚 Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git filter-branch docs](https://git-scm.com/docs/git-filter-branch)

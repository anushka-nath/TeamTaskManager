# Railway Deployment Guide

This document covers deploying the Team Task Manager monorepo to Railway.

## Prerequisites

- Railway CLI installed and authenticated (`railway login`)
- A Railway project created (or use `railway init`)

## Project Structure

```
TTM/
├── apps/
│   ├── api/          # Express + Prisma + PostgreSQL
│   └── web/          # React 19 + Vite
├── packages/
│   └── shared/       # Shared Zod schemas
├── deploy/
│   └── web/          # Static deploy bundle for web service
├── railway.json      # Root API deployment config
└── package.json      # Monorepo root with workspaces
```

## Initial Setup

### 1. Create Railway Project

```bash
railway login
railway init --name welcoming-surprise
```

### 2. Add PostgreSQL Database

Via Railway Dashboard or CLI:
```bash
railway add --database postgres
```

This creates a `Postgres` service. Note its service ID for later.

### 3. Create Services

Create two empty services:
- **API service**: `shimmering-intuition`
- **Web service**: `perpetual-integrity`

```bash
# Note service IDs after creation
railway service list
```

## Environment Variables

### API Service (`shimmering-intuition`)

Link to the API service and set variables:

```bash
# Switch to API service context
cd /path/to/project
cp railway.json railway.json.bak  # backup root config if needed

# Set environment variables
railway variables --service <API_SERVICE_ID> \
  DATABASE_URL="<from-postgres-service>" \
  JWT_SECRET="<generate-strong-secret>" \
  JWT_REFRESH_SECRET="<generate-strong-secret>" \
  PORT=3001 \
  NODE_ENV=production \
  FRONTEND_URL="https://<web-service-domain>.up.railway.app"
```

**Generate secrets locally:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Web Service (`perpetual-integrity`)

```bash
# Switch to web service context
cd deploy/web
railway link --service <WEB_SERVICE_ID>

# Set environment variables
railway variables --service <WEB_SERVICE_ID> \
  VITE_API_URL="https://<api-service-domain>.up.railway.app/api/v1"
```

## Deployment

### API Deployment

The root `railway.json` configures the API deployment:

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": { "startCommand": "npm run db:migrate && npm start" }
}
```

Deploy from project root:

```bash
cd /path/to/project
railway up --service <API_SERVICE_ID> --detach
```

**What happens:**
1. Nixpacks detects Node.js monorepo
2. Runs `npm ci` with workspaces
3. Builds `@ttm/shared` → `@ttm/api` → `@ttm/web`
4. Runs `npm run db:migrate` (Prisma deploy)
5. Starts API server on `PORT=3001`

### Web Deployment

The web app is built locally and deployed as a static bundle.

#### Step 1: Build the web app with production API URL

```bash
cd apps/web
VITE_API_URL=https://<api-domain>.up.railway.app/api/v1 npm run build
```

#### Step 2: Prepare deploy bundle

```bash
cd /path/to/project
rm -rf deploy/web/dist
cp -r apps/web/dist deploy/web/
```

The `deploy/web/` directory contains:
- `dist/` — built static files
- `package.json` — with `serve` dependency
- `package-lock.json` — lockfile for Nixpacks
- `railway.json` — minimal config (no startCommand needed, npm script handles it)

#### Step 3: Deploy

```bash
cd deploy/web
railway up . --path-as-root --no-gitignore --detach
```

**Important flags:**
- `--path-as-root` — Treats `deploy/web/` as project root, not the monorepo root
- `--no-gitignore` — Includes `dist/` folder (ignored by root `.gitignore`)

**What happens:**
1. Nixpacks installs `serve` from `package.json`
2. Runs `npm start` → `serve -s dist -l ${PORT:-3000}`
3. Static files served on Railway-assigned port

## Post-Deployment Verification

### Check service status

```bash
railway service status --service <API_SERVICE_ID>
railway service status --service <WEB_SERVICE_ID>
```

### View logs

```bash
railway logs --service <API_SERVICE_ID> --lines 50
railway logs --service <WEB_SERVICE_ID> --lines 50
```

### Test endpoints

```bash
# API health check
curl https://<api-domain>.up.railway.app/api/v1/health

# Web app
curl https://<web-domain>.up.railway.app | head -20
```

## Redeployment Commands

### Redeploy API (after backend code changes)

```bash
cd /path/to/project
railway up --service <API_SERVICE_ID> --detach
```

### Redeploy Web (after frontend code changes)

```bash
cd /path/to/project/apps/web
VITE_API_URL=https://<api-domain>.up.railway.app/api/v1 npm run build

cd /path/to/project
rm -rf deploy/web/dist && cp -r apps/web/dist deploy/web/

cd deploy/web
railway up . --path-as-root --no-gitignore --detach
```

## Common Issues & Fixes

### 1. DNS Not Resolving on Local Machine

If domains work on phone but not MacBook:

```bash
# Flush macOS DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

Or switch to public DNS: `8.8.8.8`, `1.1.1.1`

### 2. Web Service Returns 502 / "Application failed to respond"

**Cause:** `serve` listening on wrong port (e.g., hardcoded port 80).

**Fix:** Ensure `package.json` start script uses `$PORT`:
```json
{
  "scripts": {
    "start": "serve -s dist -l ${PORT:-3000}"
  }
}
```

### 3. Web Service Shows 404 (serve's 404 page, not the app)

**Cause:** `dist/` folder excluded by `.gitignore` during upload.

**Fix:** Use `--no-gitignore` flag:
```bash
railway up . --path-as-root --no-gitignore
```

### 4. Web Service Deploys Monorepo Instead of Static Bundle

**Cause:** Railway detects parent git repo and deploys from root.

**Fix:** Use `--path-as-root` flag:
```bash
railway up . --path-as-root
```

### 5. API Service Runs Web Static Server (serve)

**Cause:** Deployed from wrong directory or service context.

**Fix:** Ensure deploying from monorepo root with correct `--service` flag:
```bash
cd /path/to/project
railway up --service <API_SERVICE_ID>
```

### 6. Auth Refresh Loop on Login/Register Pages

**Cause:** API interceptor doing `window.location.href = "/login"` on every failed token refresh, causing hard reloads even when already on `/login` or `/register`.

**Fix:** Remove `window.location.href` from API interceptor. Let `ProtectedRoute` and page-level `useEffect` hooks handle navigation via React Router (`useNavigate`).

## Domain Reference

| Service | Domain Example |
|---------|---------------|
| API | `https://shimmering-intuition-production-6535.up.railway.app` |
| Web | `https://perpetual-integrity-production-c522.up.railway.app` |

Replace with your actual generated domains from Railway.

# Phase 6: Polish & Deploy Plan

**Objective:** Add loading skeletons, empty states, error toasts, responsive design (mobile sidebar drawer), Railway deployment configuration (Dockerfiles, railway.json, start commands), database migration automation, and end-to-end smoke tests.

**PRD Sections Implemented:** 10 (Deployment Plan, Railway Services, Dockerfiles, CORS), 13 (Testing Checklist), 14 (Railway CLI / Prisma Commands), 15 (File Structure), 16 (Success Criteria)

---

## 1. Files to Create

### Root
| File | Purpose |
|------|---------|
| `railway.json` | Railway monorepo config for API service deploy |
| `.dockerignore` | Ignore node_modules, dist, .git, .env |

### API — New Files
| File | Purpose |
|------|---------|
| `apps/api/Dockerfile` | Multi-stage build: install → generate prisma → build ts → start with `prisma migrate deploy && node dist/index.js` |
| `apps/api/.dockerignore` | API-specific ignores |

### API — Modified Files
| File | Change |
|------|--------|
| `apps/api/package.json` | Ensure `build` script compiles TS, `start` script runs `node dist/index.js` |
| `apps/api/src/index.ts` | Ensure CORS origin reads `FRONTEND_URL` env var, fallback to `http://localhost:5173`. Ensure cookie `secure` flag respects `NODE_ENV`. |

### Web — New Files
| File | Purpose |
|------|---------|
| `apps/web/Dockerfile` | Multi-stage build: install → build Vite → serve with nginx or `npx serve` |
| `apps/web/.dockerignore` | Web-specific ignores |
| `apps/web/src/components/ui/Skeleton.tsx` | Loading skeleton component for cards, lists, stats |
| `apps/web/src/components/ui/EmptyState.tsx` | Empty state illustration + message component |
| `apps/web/src/components/ui/Toast.tsx` | Toast notification component |
| `apps/web/src/components/ui/Drawer.tsx` | Mobile sidebar drawer (shadcn-style or custom) |

### Web — Modified Files
| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Add toast provider wrapper. Ensure all routes handle loading/error states. |
| `apps/web/src/components/layout/Sidebar.tsx` | Convert to responsive: hidden on mobile, hamburger menu opens drawer |
| `apps/web/src/components/layout/Topbar.tsx` | Add hamburger menu button for mobile |
| `apps/web/src/components/layout/AppLayout.tsx` | Integrate mobile drawer, handle overflow-x |
| `apps/web/src/pages/DashboardPage.tsx` | Replace loading text with `Skeleton` components. Add empty states. |
| `apps/web/src/pages/ProjectsPage.tsx` | Replace loading text with `Skeleton` components. Add empty state. |
| `apps/web/src/pages/ProjectDetailPage.tsx` | Replace loading text with `Skeleton` components. Add empty states for tabs. |
| `apps/web/src/pages/TaskDetailPage.tsx` | Replace loading text with `Skeleton` component. |
| `apps/web/src/pages/LoginPage.tsx` | Add error toast on failed login. |
| `apps/web/src/pages/RegisterPage.tsx` | Add error toast on failed registration. |
| `apps/web/src/lib/api.ts` | Add response interceptor for 403 → toast "Access denied" and redirect to `/dashboard`. Add global error toast for network failures. |

---

## 2. Packages / Dependencies to Install

No new packages required. Verify existing packages:

```bash
# In apps/web (if lucide-react not present)
npm install lucide-react@^0.460.0
```

If using a toast library (optional), could install `sonner`:
```bash
cd apps/web && npm install sonner@^1.7.0
```

---

## 3. Prisma Schema Changes

No schema changes.

**Migration:** None in this phase, but ensure `prisma migrate deploy` is wired into deploy start command.

---

## 4. REST API Endpoints

No new endpoints. Ensure all existing endpoints return the standardized format (PRD Section 11).

---

## 5. React Components / Pages

### New Components
- `Skeleton({ className }: { className?: string }): JSX.Element`
  - Animated pulse div using Tailwind `animate-pulse bg-muted rounded`.
  - Used to build `StatCardSkeleton`, `ProjectCardSkeleton`, `TaskCardSkeleton`.

- `EmptyState({ title, description, icon, action }: { title: string; description: string; icon?: LucideIcon; action?: ReactNode }): JSX.Element`
  - Centered layout with icon, title, description, optional action button.

- `ToastProvider({ children }: { children: ReactNode }): JSX.Element`
  - Wraps app with toast context.
  - If using `sonner`, this is `<Toaster />` from `sonner`.

- `MobileDrawer({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: ReactNode }): JSX.Element`
  - Slide-in drawer from the left on mobile.
  - Backdrop overlay.
  - Contains the same navigation links as Sidebar.

### Updated Pages — Responsive & Polish
- All pages must be usable at 375px width.
- Grid layouts switch from multi-column to single-column on mobile (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
- Tables become stacked cards or scrollable on mobile.
- Forms have full-width inputs on mobile.

---

## 6. Middleware, Utilities, Hooks, Contexts

### API — CORS & Cookies
- In `apps/api/src/index.ts`, ensure CORS:
  ```ts
  app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }));
  ```
- Refresh token cookie options:
  ```ts
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  ```

### Web — API Interceptors
- In `apps/web/src/lib/api.ts`:
  - On 403: show toast "Access denied", redirect to `/dashboard`.
  - On network error: show toast "Network error. Please check your connection.".

---

## 7. Database Seeding / Setup

- No seeding for production.
- For local testing, consider a `prisma/seed.ts` script (optional) that creates a test user and project.

---

## 8. Environment Variables

### Production Environment Variables (Railway)

**API Service:**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="<generate-strong-secret-32+chars>"
JWT_REFRESH_SECRET="<generate-different-secret-32+chars>"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://<railway-web-domain>"
```

**Web Service:**
```env
VITE_API_URL="https://<railway-api-domain>/api/v1"
```

---

## 9. Deployment Configuration

### `railway.json` (root or API service)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start"
  }
}
```

### `apps/api/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

### `apps/web/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

*(If no custom nginx.conf, use `npx serve dist -s -l 80` as fallback in final stage.)*

---

## 10. Acceptance Criteria

Before declaring the project complete, ALL of the following must pass:

- [ ] All Phase 1-5 acceptance criteria still pass.
- [ ] Loading skeletons display on every page while data is fetching.
- [ ] Empty states display when there are no projects, no tasks, no overdue items, or no recent activity.
- [ ] Error toasts appear for API errors (401, 403, 409, 500, network errors).
- [ ] 403 response from API triggers toast "Access denied" and redirects to `/dashboard`.
- [ ] Sidebar collapses to hamburger menu on mobile (width < 768px).
- [ ] Mobile drawer opens/closes smoothly.
- [ ] All pages are usable at 375px width without horizontal scroll.
- [ ] No console errors in dev or production builds.
- [ ] `apps/api` Dockerfile builds successfully and starts the server.
- [ ] `apps/web` Dockerfile builds successfully and serves the static files.
- [ ] `railway.json` (or Railway UI settings) runs `npx prisma migrate deploy` before starting the API.
- [ ] CORS allows only `FRONTEND_URL` in production.
- [ ] Refresh token cookie is `httpOnly`, `secure` in production, `sameSite=strict`.
- [ ] Healthcheck endpoint `GET /api/v1/health` returns 200.
- [ ] End-to-end smoke test: register → login → create project → invite member → create task → update task status → view dashboard → logout. All steps succeed.
- [ ] No `TODO` comments remain in any file.
- [ ] All files listed in PRD Section 15 exist and are functional.

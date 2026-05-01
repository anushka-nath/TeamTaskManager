# Phase 1: Foundation Plan

**Objective:** Set up the monorepo, shared packages, database schema, Express server with middleware, and shared Zod schemas. No auth, no UI yet. This phase establishes the structural backbone upon which all subsequent phases depend.

**PRD Sections Implemented:** 2 (Tech Stack), 3 (Database Schema), 10 (Monorepo Structure / Deployment Plan), 11 (Error Handling & Response Format), 15 (File Structure)

---

## 1. Files to Create

### Root Workspace
| File | Purpose |
|------|---------|
| `package.json` | Root workspace config with `workspaces: ["apps/*", "packages/*"]` |
| `.gitignore` | Ignore node_modules, dist, .env, etc. |
| `turbo.json` | Turborepo pipeline config for build/test pipelines (optional but recommended) |

### Shared Package
| File | Purpose |
|------|---------|
| `packages/shared/package.json` | Package name `@ttm/shared`, exports `./schemas` |
| `packages/shared/tsconfig.json` | Shared TypeScript config, `compilerOptions.declaration: true` |
| `packages/shared/src/schemas.ts` | All Zod schemas for Auth, Project, Task, Member, Dashboard (PRD Section 5) |
| `packages/shared/src/types.ts` | TypeScript inference types derived from Zod schemas (e.g., `type RegisterInput = z.infer<typeof registerSchema>`) |

### API App
| File | Purpose |
|------|---------|
| `apps/api/package.json` | Express API dependencies and scripts |
| `apps/api/tsconfig.json` | API TypeScript config, `outDir: "dist"`, `rootDir: "src"` |
| `apps/api/prisma/schema.prisma` | Full Prisma schema exactly as PRD Section 3 specifies |
| `apps/api/src/index.ts` | Express app entry point: create app, attach middleware, mount routes, start server |
| `apps/api/src/config/env.ts` | Centralized env validation using Zod; validates `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `FRONTEND_URL`, `NODE_ENV` |
| `apps/api/src/utils/prisma.ts` | Singleton PrismaClient export with `$connect`/`$disconnect` lifecycle |
| `apps/api/src/utils/apiResponse.ts` | `successResponse(data, meta?)` and `errorResponse(code, message, details?)` helpers (PRD Section 11) |
| `apps/api/src/middleware/errorHandler.ts` | Global Express error handler: catches ZodError → 400 VALIDATION_ERROR, Prisma errors → appropriate codes, generic → 500 INTERNAL_ERROR. Must return the exact JSON shape from PRD Section 11 |
| `apps/api/src/middleware/validate.ts` | `validateBody(schema: ZodSchema)` middleware: parses `req.body`, calls `next()` on success, calls `next(errorResponse(...))` on ZodError |

### Web App
| File | Purpose |
|------|---------|
| `apps/web/package.json` | React 19 + Vite dependencies and scripts |
| `apps/web/tsconfig.json` | Web TypeScript config with strict mode |
| `apps/web/tsconfig.app.json` | App-specific TS config for Vite |
| `apps/web/tsconfig.node.json` | TS config for Vite config file |
| `apps/web/vite.config.ts` | Vite config with `@` path alias pointing to `src/` |
| `apps/web/index.html` | HTML entry point with `<div id="root"></div>` |
| `apps/web/tailwind.config.js` | Tailwind CSS config, `content: ["./index.html", "./src/**/*.{ts,tsx}"]` |
| `apps/web/postcss.config.js` | PostCSS config with tailwindcss and autoprefixer plugins |
| `apps/web/src/main.tsx` | React DOM root render entry |
| `apps/web/src/App.tsx` | Root App component with BrowserRouter placeholder (no real routes yet) |
| `apps/web/src/index.css` | Tailwind directives `@tailwind base; @tailwind components; @tailwind utilities;` + basic global styles |
| `apps/web/src/lib/utils.ts` | `cn()` utility merging `clsx` + `tailwind-merge` (shadcn standard) |

---

## 2. Packages / Dependencies to Install

### Root
```bash
npm install -g npm@latest   # ensure latest
# No root deps initially; workspaces handle children
```

### `packages/shared`
```bash
npm install zod@^3.23.8
npm install -D typescript@^5.6.0
```

### `apps/api`
```bash
npm install express@^4.21.0 cors@^2.8.5 helmet@^8.0.0 express-rate-limit@^7.4.0 bcrypt@^5.1.1 jsonwebtoken@^9.0.2 zod@^3.23.8 dotenv@^16.4.0 cookie-parser@^1.4.0
npm install -D typescript@^5.6.0 @types/express@^4.17.0 @types/cors@^2.8.0 @types/bcrypt@^5.0.0 @types/jsonwebtoken@^9.0.0 @types/cookie-parser@^1.4.0 @types/node@^20.0.0 ts-node@^10.9.0 nodemon@^3.1.0 prisma@^5.22.0
# Prisma client generated after schema exists
npx prisma generate
```

### `apps/web`
```bash
npm install react@^19.0.0 react-dom@^19.0.0 react-router-dom@^7.0.0 @tanstack/react-query@^5.60.0 axios@^1.7.7 recharts@^2.13.0 date-fns@^4.1.0 lucide-react@^0.460.0 clsx@^2.1.1 tailwind-merge@^2.5.0
npm install -D typescript@^5.6.0 @types/react@^19.0.0 @types/react-dom@^19.0.0 vite@^6.0.0 @vitejs/plugin-react@^4.3.0 tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

---

## 3. Prisma Schema & Migrations

### Schema File
**File:** `apps/api/prisma/schema.prisma`

Must contain **exactly** the models, enums, fields, and `@map` annotations from PRD Section 3:

- `User` model with fields: `id`, `email`, `passwordHash` (@map("password_hash")), `name`, `avatarUrl` (@map("avatar_url")), `createdAt` (@map("created_at")), `updatedAt` (@map("updated_at")). Relations: `ownedProjects`, `memberships`, `assignedTasks`, `createdTasks`, `refreshTokens`. @@map("users").
- `RefreshToken` model with fields: `id`, `token`, `userId` (@map("user_id")), `expiresAt` (@map("expires_at")), `createdAt` (@map("created_at")). Relation to `User`. @@map("refresh_tokens").
- `Project` model with fields: `id`, `name`, `description`, `status` (ProjectStatus @default(ACTIVE)), `ownerId` (@map("owner_id")), `createdAt` (@map("created_at")), `updatedAt` (@map("updated_at")). Relations: `owner`, `members`, `tasks`. @@map("projects").
- `ProjectMember` model with fields: `id`, `projectId` (@map("project_id")), `userId` (@map("user_id")), `role` (MemberRole @default(MEMBER)), `joinedAt` (@map("joined_at")). Relations: `project`, `user`. @@unique([projectId, userId]). @@map("project_members").
- `Task` model with fields: `id`, `title`, `description`, `status` (TaskStatus @default(TODO)), `priority` (Priority @default(MEDIUM)), `dueDate` (@map("due_date")), `projectId` (@map("project_id")), `assigneeId` (@map("assignee_id")), `creatorId` (@map("creator_id")), `createdAt` (@map("created_at")), `updatedAt` (@map("updated_at")). Relations: `project`, `assignee`, `creator`. @@map("tasks").
- Enums: `ProjectStatus` (ACTIVE, ARCHIVED), `MemberRole` (ADMIN, MEMBER), `TaskStatus` (TODO, IN_PROGRESS, REVIEW, DONE), `Priority` (LOW, MEDIUM, HIGH, URGENT).

### Migration
- **Migration name:** `init`
- **Command:** `npx prisma migrate dev --name init`
- This creates the initial migration SQL in `prisma/migrations/YYYYMMDD_HHMMSS_init/`.

---

## 4. REST API Endpoints (Phase 1)

Only healthcheck endpoint in this phase. All other endpoints come in later phases.

| Method | Route | Status Codes | Description |
|--------|-------|--------------|-------------|
| GET | `/api/v1/health` | 200 | Returns `{ success: true, data: { status: "ok" } }` |

---

## 5. React Components / Pages (Phase 1)

No real pages yet. Only the minimal app shell:

- `App.tsx`: Returns a `<div>Team Task Manager — Foundation Phase</div>` placeholder.
- `main.tsx`: Renders `<App />` into `#root` using `React.StrictMode`.

---

## 6. Middleware, Utilities, Hooks, Contexts (Phase 1)

### API Middleware
- `errorHandler.ts`: Must catch any error passed to `next(err)`. Logic:
  - If `err instanceof ZodError` → 400, code `VALIDATION_ERROR`, message "Invalid input data", details array of `{ field: path.join('.'), message: issue.message }`.
  - If `err.name === "JsonWebTokenError"` → 401, code `UNAUTHORIZED`.
  - If Prisma `P2002` → 409, code `CONFLICT`.
  - If Prisma `P2025` → 404, code `NOT_FOUND`.
  - Else → 500, code `INTERNAL_ERROR`, message "Internal server error" (hide details in production).
- `validate.ts`: Factory `validateBody(schema)` returning Express middleware. On failure, call `next()` with an error object shaped for `errorHandler`.

### API Utilities
- `prisma.ts`: Export `const prisma = new PrismaClient();` and attach process exit handlers for `$disconnect`.
- `apiResponse.ts`: Two functions:
  - `successResponse(data: unknown, meta?: Record<string, unknown>) => { success: true, data, meta }`
  - `errorResponse(code: string, message: string, details?: Array<{field?: string, message: string}>) => Error & { code, details }` (must be throwable).

### Web Utilities
- `cn(...inputs: ClassValue[])` in `apps/web/src/lib/utils.ts`.

---

## 7. Database Seeding / Setup

- No seeding in Phase 1.
- Must verify `npx prisma migrate dev --name init` succeeds against a local PostgreSQL instance (or Railway dev DB).
- Must verify `npx prisma generate` produces a valid client.

---

## 8. Environment Variables

Create `.env` files (not committed; add to `.gitignore`):

**`apps/api/.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ttm_db"
JWT_SECRET="dev-jwt-secret-min-32-chars-long!!!"
JWT_REFRESH_SECRET="dev-jwt-refresh-secret-min-32-chars!!!"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

**`apps/web/.env`**
```env
VITE_API_URL="http://localhost:3001/api/v1"
```

---

## 9. Acceptance Criteria

Before proceeding to Phase 2, ALL of the following must pass:

- [ ] `npm install` succeeds in root, `packages/shared`, `apps/api`, and `apps/web` without peer dependency conflicts.
- [ ] `packages/shared` builds successfully (`tsc --noEmit` or `npm run build` if build script exists) and exports all Zod schemas.
- [ ] `apps/api/prisma/schema.prisma` contains **exactly** the models, fields, enums, `@map` annotations, and relations specified in PRD Section 3.
- [ ] `npx prisma migrate dev --name init` runs without errors and creates the initial migration.
- [ ] `npx prisma generate` succeeds and TypeScript recognizes the Prisma client types.
- [ ] `apps/api` starts with `npm run dev` (nodemon/ts-node) and responds to `GET http://localhost:3001/api/v1/health` with `{ success: true, data: { status: "ok" } }`.
- [ ] The API responds with the standardized success format (PRD Section 11) for the health endpoint.
- [ ] CORS middleware is configured with `origin: FRONTEND_URL || "http://localhost:5173"` and `credentials: true`.
- [ ] Helmet and express-rate-limit middleware are mounted.
- [ ] The global error handler returns the exact error JSON shape from PRD Section 11 for a simulated validation error.
- [ ] `apps/web` starts with `npm run dev` (Vite) and displays the placeholder text at `http://localhost:5173`.
- [ ] Tailwind CSS is active (utility classes work on the placeholder page).
- [ ] `cn()` utility is importable from `@/lib/utils`.
- [ ] No `TODO` comments or placeholder stubs remain in any committed file.

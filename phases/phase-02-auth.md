# Phase 2: Authentication Plan

**Objective:** Implement the complete authentication system end-to-end: backend JWT flow (register, login, refresh, logout, me), password hashing, auth middleware, frontend auth context, login/register forms, protected route wrapper, and axios interceptors with automatic token refresh.

**PRD Sections Implemented:** 4 (Auth Endpoints), 5 (Auth Schemas), 6 (JWT Strategy / Middleware Stack), 7 (Login/Register Pages, AuthContext), 8 (useAuth hook, Axios interceptors), 9 (Member Rules — creator auto-admin), 11 (Error Codes — UNAUTHORIZED, CONFLICT, VALIDATION_ERROR), 13 (Auth Testing Checklist)

---

## 1. Files to Create

### API — New Files
| File | Purpose |
|------|---------|
| `apps/api/src/middleware/auth.ts` | `authenticate` middleware: verify Bearer token, attach `req.user = { id, email, name }` |
| `apps/api/src/utils/jwt.ts` | `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)` helpers |
| `apps/api/src/routes/auth.routes.ts` | Express router for `/auth` endpoints |
| `apps/api/src/controllers/auth.controller.ts` | Handler functions for register, login, refresh, logout, me |
| `apps/api/src/services/auth.service.ts` | Business logic: create user with hashed password, validate credentials, create/rotate/invalidate refresh tokens, fetch current user |
| `apps/api/src/types/index.ts` | Express type augmentations for `req.user` and `req.projectMember` |

### API — Modified Files
| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Mount `authRouter` at `/api/v1/auth`; mount `authenticate` on `/auth/logout` and `/auth/me` routes |

### Web — New Files
| File | Purpose |
|------|---------|
| `apps/web/src/lib/api.ts` | Axios instance with baseURL from `VITE_API_URL`, request interceptor to attach `Authorization: Bearer <token>`, response interceptor to handle 401 by queuing requests, calling `/auth/refresh`, and retrying |
| `apps/web/src/context/AuthContext.tsx` | React Context providing: `user`, `isLoading`, `login(email, password)`, `register(data)`, `logout()`, `isAuthenticated` |
| `apps/web/src/hooks/useAuth.ts` | Convenience hook `useAuth()` returning context value with runtime error if used outside provider |
| `apps/web/src/components/layout/AppLayout.tsx` | Layout shell with Sidebar, Topbar, and outlet for page content |
| `apps/web/src/components/layout/Sidebar.tsx` | Navigation sidebar with links: Dashboard, Projects, Profile |
| `apps/web/src/components/layout/Topbar.tsx` | Top bar with user avatar display and logout button |
| `apps/web/src/pages/LoginPage.tsx` | Login form page with email/password inputs, submit to `/auth/login`, store access token in memory via context |
| `apps/web/src/pages/RegisterPage.tsx` | Registration form page with name/email/password inputs, submit to `/auth/register`, auto-login on success |
| `apps/web/src/pages/ProfilePage.tsx` | Display current user info, read-only in this phase |
| `apps/web/src/components/auth/ProtectedRoute.tsx` | Wrapper component: if not authenticated, redirect to `/login`; if loading, show spinner |
| `apps/web/src/components/ui/Spinner.tsx` | Loading spinner component |
| `apps/web/src/components/ui/Button.tsx` | Reusable button component (can be shadcn `Button` or custom) |
| `apps/web/src/components/ui/Input.tsx` | Reusable input component |
| `apps/web/src/App.tsx` | Define routes: `/login` → LoginPage, `/register` → RegisterPage, `/profile` → ProfilePage (all wrapped in AuthContext); protected routes under AppLayout |

### Shared Package — Modified Files
| File | Change |
|------|--------|
| `packages/shared/src/schemas.ts` | Add `registerSchema`, `loginSchema`, `refreshResponseSchema` |
| `packages/shared/src/types.ts` | Export inferred types: `RegisterInput`, `LoginInput`, `AuthUser` |

---

## 2. Packages / Dependencies to Install

### `apps/api`
```bash
npm install bcrypt@^5.1.1 jsonwebtoken@^9.0.2 cookie-parser@^1.4.0
npm install -D @types/bcrypt@^5.0.0 @types/jsonwebtoken@^9.0.0 @types/cookie-parser@^1.4.0
```
*(Note: these may already be installed in Phase 1; verify and install if missing.)*

### `apps/web`
```bash
npm install axios@^1.7.7 lucide-react@^0.460.0
npm install -D @types/react@^19.0.0 @types/react-dom@^19.0.0
```
*(Note: axios and lucide-react may already be installed in Phase 1; verify.)*

---

## 3. Prisma Schema Changes

No schema changes in Phase 2 — all models (User, RefreshToken) already exist from Phase 1.

**Migration:** None.

---

## 4. REST API Endpoints

All under base `/api/v1`.

| Method | Route | Auth | Status Codes | Zod Schema (request) | Description |
|--------|-------|------|--------------|----------------------|-------------|
| POST | `/auth/register` | No | 201, 400, 409 | `registerSchema` | Create account. On success, return `{ user: { id, email, name } }` and set refresh cookie. |
| POST | `/auth/login` | No | 200, 400, 401 | `loginSchema` | Validate credentials. Return `{ user, accessToken }` and set `refreshToken` HTTP-only cookie. |
| POST | `/auth/refresh` | No (cookie) | 200, 401 | — | Read `refreshToken` cookie, verify against DB, rotate token (delete old, create new), return `{ accessToken }` and set new cookie. |
| POST | `/auth/logout` | Yes (Bearer) | 200, 401 | — | Invalidate refresh token in DB, clear cookie, return success. |
| GET | `/auth/me` | Yes (Bearer) | 200, 401 | — | Return current user object `{ id, email, name, avatarUrl }`. |

### Response Details

**POST /auth/register**
- Request body validated by `registerSchema`:
  ```ts
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
    name: z.string().min(2).max(100),
  });
  ```
- Password hashed with bcrypt cost 12.
- If email already exists → 409 `CONFLICT`.
- On success: create refresh token (7 days), set HTTP-only cookie `refreshToken`, return 201 with `user` and `accessToken`.

**POST /auth/login**
- Request body validated by `loginSchema`:
  ```ts
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });
  ```
- If user not found or password mismatch → 401 `UNAUTHORIZED`.
- On success: rotate/create refresh token, set cookie, return `user` and `accessToken`.

**POST /auth/refresh**
- Cookie name: `refreshToken`.
- Verify token exists in DB and not expired.
- Delete old token, create new token, update cookie.
- Return `{ accessToken }`.
- If invalid/missing → 401 `UNAUTHORIZED`.

**POST /auth/logout**
- Must use `authenticate` middleware.
- Read refresh token from cookie, delete from DB.
- Clear cookie (`maxAge: 0`).
- Return 200 success.

**GET /auth/me**
- Must use `authenticate` middleware.
- Return `req.user` extended with `avatarUrl` from DB lookup.

---

## 5. React Components / Pages

### Pages (with prop interfaces)
- `LoginPage(props: {}): JSX.Element`
  - Two controlled inputs: `email` (type="email"), `password` (type="password").
  - Submit button calls `login(email, password)` from `useAuth()`.
  - On success: navigate to `/dashboard`.
  - On error: display error message from API response.
  - Link to `/register`.

- `RegisterPage(props: {}): JSX.Element`
  - Three controlled inputs: `name`, `email`, `password`.
  - Submit button calls `register({ name, email, password })`.
  - On success: auto-login and navigate to `/dashboard`.
  - Link to `/login`.

- `ProfilePage(props: {}): JSX.Element`
  - Read-only display of `user` from `useAuth()`.
  - Shows name, email, avatar placeholder.

### Components (with prop interfaces)
- `ProtectedRoute({ children }: { children: React.ReactNode }): JSX.Element`
  - If `isLoading`: return `<Spinner />`.
  - If `!isAuthenticated`: return `<Navigate to="/login" replace />`.
  - Else return `children`.

- `AppLayout({ children }: { children: React.ReactNode }): JSX.Element`
  - Renders `<Sidebar />`, `<Topbar />`, and main content area.

- `Sidebar(props: {}): JSX.Element`
  - Navigation links: `/dashboard`, `/projects`, `/profile`.
  - Uses `NavLink` from react-router-dom for active state.

- `Topbar(props: {}): JSX.Element`
  - Displays `user.name` and logout button.
  - Logout calls `logout()` from `useAuth()` and navigates to `/login`.

- `Spinner(props: { size?: 'sm' | 'md' | 'lg' }): JSX.Element`
  - Simple CSS or SVG spinner.

---

## 6. Middleware, Utilities, Hooks, Contexts

### API Middleware
- `authenticate(req, res, next)` in `apps/api/src/middleware/auth.ts`:
  - Read `Authorization` header.
  - If missing or not `Bearer <token>` → 401.
  - Verify token with `verifyAccessToken()`.
  - Attach `req.user = { id: payload.id, email: payload.email, name: payload.name }`.
  - Call `next()`.
  - On any JWT error → 401 `UNAUTHORIZED`.

### API Utilities
- `apps/api/src/utils/jwt.ts`:
  - `signAccessToken({ id, email, name })` → JWT signed with `JWT_SECRET`, expiresIn `15m`.
  - `signRefreshToken({ id })` → JWT signed with `JWT_REFRESH_SECRET`, expiresIn `7d`.
  - `verifyAccessToken(token)` → verifies with `JWT_SECRET`.
  - `verifyRefreshToken(token)` → verifies with `JWT_REFRESH_SECRET`.

### API Types
- `apps/api/src/types/index.ts`:
  ```ts
  declare global {
    namespace Express {
      interface Request {
        user?: { id: string; email: string; name: string };
        projectMember?: { id: string; role: MemberRole; projectId: string };
      }
    }
  }
  ```

### Web Context
- `AuthContext` in `apps/web/src/context/AuthContext.tsx`:
  - State: `user: AuthUser | null`, `isLoading: boolean`.
  - On mount: call `GET /auth/me` with stored access token. If 401, try `/auth/refresh`. If both fail, set `user = null`.
  - `login(email, password)`: POST `/auth/login`, store `accessToken` in state (memory only), set `user`.
  - `register(data)`: POST `/auth/register`, then auto-call `login`.
  - `logout()`: POST `/auth/logout`, clear `accessToken` and `user`.

### Web API Client
- `apps/web/src/lib/api.ts`:
  - `axios.create({ baseURL: import.meta.env.VITE_API_URL, withCredentials: true })`.
  - Request interceptor: if `accessToken` exists in memory (exported getter), attach `Authorization: Bearer <token>`.
  - Response interceptor: on 401, queue the failed request, call `POST /auth/refresh`, get new `accessToken`, retry queued requests. If refresh fails, redirect to `/login`.
  - Export `setAccessToken(token: string | null)` and `getAccessToken()` for the context to use.

### Web Hooks
- `useAuth()` in `apps/web/src/hooks/useAuth.ts`:
  - Returns `useContext(AuthContext)`.
  - Throws if used outside provider.

---

## 7. Database Seeding / Setup

- No seeding required.
- For manual testing, you may insert a test user directly into the DB after registering.

---

## 8. Environment Variables

No new env vars beyond Phase 1. Verify these exist:

**`apps/api/.env`**
```env
JWT_SECRET="dev-jwt-secret-min-32-chars-long!!!"
JWT_REFRESH_SECRET="dev-jwt-refresh-secret-min-32-chars!!!"
```

**`apps/web/.env`**
```env
VITE_API_URL="http://localhost:3001/api/v1"
```

---

## 9. Acceptance Criteria

Before proceeding to Phase 3, ALL of the following must pass:

- [ ] `POST /auth/register` creates a new user in the `users` table with `passwordHash` from bcrypt.
- [ ] Duplicate email registration returns 409 `CONFLICT` with standardized error format.
- [ ] `POST /auth/login` returns 200 with `user` object and `accessToken`, and sets `refreshToken` HTTP-only cookie.
- [ ] Invalid login credentials return 401 `UNAUTHORIZED`.
- [ ] `POST /auth/refresh` with valid cookie returns new `accessToken` and rotates the refresh token in DB.
- [ ] `POST /auth/refresh` with invalid/missing cookie returns 401.
- [ ] `POST /auth/logout` (with valid Bearer token) invalidates the refresh token and clears the cookie.
- [ ] `GET /auth/me` (with valid Bearer) returns the current user.
- [ ] `GET /auth/me` without Bearer returns 401.
- [ ] Access token expires in 15 minutes (verified by JWT `exp`).
- [ ] Refresh token expires in 7 days (verified by JWT `exp`).
- [ ] Frontend Login page submits to API and stores access token in memory.
- [ ] Frontend Register page creates account and auto-logs in.
- [ ] Frontend logout clears token and redirects to `/login`.
- [ ] Axios 401 response triggers automatic token refresh and retries the original request seamlessly.
- [ ] If token refresh fails, user is redirected to `/login`.
- [ ] `ProtectedRoute` blocks unauthenticated users and shows spinner while auth state initializes.
- [ ] Sidebar, Topbar, and AppLayout render correctly when authenticated.
- [ ] No `TODO` comments remain in any file.

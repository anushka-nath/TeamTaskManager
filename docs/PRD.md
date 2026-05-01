 Product Requirements Document (PRD)

## Team Task Manager — Full-Stack Web Application

**Version:** 1.0.0  
**Date:** 2026-05-01  
**Deploy Target:** Railway  
**Author:** Anushka Nath

---

## 1. Executive Summary

Build a role-based team task management platform where users can create projects, invite team members, assign tasks with deadlines, and track progress via a real-time dashboard. The application supports two roles: **Admin** (full control) and **Member** (task execution & limited project visibility).

---

## 2. Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React 19 + Vite + TypeScript | Fast DX, strong typing, Railway static hosting compatible |
| **UI Library** | Tailwind CSS + shadcn/ui | Rapid, consistent, accessible components |
| **State Management** | TanStack Query (React Query) | Server state caching, optimistic updates |
| **Backend** | Node.js + Express + TypeScript | Railway native support, robust REST framework |
| **ORM** | Prisma | Type-safe DB queries, migration management |
| **Database** | PostgreSQL 15 | Railway-native managed DB, relational integrity for RBAC |
| **Auth** | JWT (access + refresh tokens) | Stateless, scalable, Railway-friendly |
| **Validation** | Zod (shared between FE/BE) | Single source of truth for schemas |
| **Deployment** | Railway | Monorepo with 2 services (API + Web) + PostgreSQL |

---

## 3. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String
  avatarUrl     String?   @map("avatar_url")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  ownedProjects   Project[]     @relation("ProjectOwner")
  memberships     ProjectMember[]
  assignedTasks   Task[]        @relation("TaskAssignee")
  createdTasks    Task[]        @relation("TaskCreator")
  refreshTokens   RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  ownerId     String   @map("owner_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  owner      User            @relation("ProjectOwner", fields: [ownerId], references: [id])
  members    ProjectMember[]
  tasks      Task[]

  @@map("projects")
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

model ProjectMember {
  id        String    @id @default(uuid())
  projectId String    @map("project_id")
  userId    String    @map("user_id")
  role      MemberRole @default(MEMBER)
  joinedAt  DateTime  @default(now()) @map("joined_at")

  // Relations
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
}

enum MemberRole {
  ADMIN      // Can manage project, members, all tasks
  MEMBER     // Can view project, update assigned tasks
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  dueDate     DateTime?  @map("due_date")
  projectId   String     @map("project_id")
  assigneeId  String?    @map("assignee_id")
  creatorId   String     @map("creator_id")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Relations
  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee User?   @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator  User    @relation("TaskCreator", fields: [creatorId], references: [id])

  @@map("tasks")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

---

## 4. API Specification (REST)

### Base URL
- Local: `http://localhost:3001/api/v1`
- Production: `https://<railway-api-domain>/api/v1`

### Auth Endpoints (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Create account | No |
| POST | `/auth/login` | Login, get tokens | No |
| POST | `/auth/refresh` | Rotate access token | No (refresh cookie) |
| POST | `/auth/logout` | Invalidate refresh token | Yes |
| GET | `/auth/me` | Get current user | Yes |

### Project Endpoints (`/projects`)

| Method | Endpoint | Description | RBAC |
|--------|----------|-------------|------|
| POST | `/projects` | Create new project | Auth |
| GET | `/projects` | List my projects (owned + member) | Auth |
| GET | `/projects/:id` | Get project details | Project Member |
| PATCH | `/projects/:id` | Update project | Project Admin |
| DELETE | `/projects/:id` | Archive/delete project | Project Admin |
| POST | `/projects/:id/members` | Invite member by email | Project Admin |
| DELETE | `/projects/:id/members/:userId` | Remove member | Project Admin |
| PATCH | `/projects/:id/members/:userId` | Change member role | Project Admin |

### Task Endpoints (`/projects/:projectId/tasks`)

| Method | Endpoint | Description | RBAC |
|--------|----------|-------------|------|
| POST | `/projects/:projectId/tasks` | Create task | Project Admin |
| GET | `/projects/:projectId/tasks` | List project tasks | Project Member |
| GET | `/projects/:projectId/tasks/:taskId` | Get task details | Project Member |
| PATCH | `/projects/:projectId/tasks/:taskId` | Update task | Project Admin (any) / Member (own assigned only) |
| DELETE | `/projects/:projectId/tasks/:taskId` | Delete task | Project Admin |

### Dashboard Endpoints (`/dashboard`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard/stats` | Aggregated stats | Auth |
| GET | `/dashboard/overdue` | Overdue tasks across projects | Auth |
| GET | `/dashboard/recent` | Recently updated tasks | Auth |

---

## 5. Request/Response Schemas (Zod)

### Auth

```typescript
// Register
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
});

// Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
```

### Project

```typescript
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});
```

### Task

```typescript
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
});
```

---

## 6. Authentication & Authorization Flow

### JWT Strategy
1. **Access Token:** Short-lived (15 min), stored in `memory` (React Context), sent via `Authorization: Bearer <token>` header.
2. **Refresh Token:** Long-lived (7 days), HTTP-only cookie (`/auth/refresh` endpoint), rotated on each use.
3. **Logout:** Clear client memory + invalidate refresh token in DB.

### Middleware Stack (Express)
```typescript
// 1. authenticate(req, res, next)
//    - Verify Bearer token from Authorization header
//    - Attach req.user = { id, email, name }

// 2. authorizeProjectRole(roles: MemberRole[])
//    - Check if req.user is member of req.params.projectId
//    - Verify role is in allowed roles
//    - Attach req.projectMember for downstream use

// 3. authorizeTaskUpdate
//    - If Admin: allow any update
//    - If Member: only allow if task.assigneeId === req.user.id AND only status field changes
```

---

## 7. Frontend Architecture

### Route Structure

| Route | Page | Auth Required | Role Guard |
|-------|------|---------------|------------|
| `/login` | LoginPage | No | — |
| `/register` | RegisterPage | No | — |
| `/dashboard` | DashboardPage | Yes | — |
| `/projects` | ProjectsListPage | Yes | — |
| `/projects/:id` | ProjectDetailPage | Yes | Project Member |
| `/projects/:id/tasks/:taskId` | TaskDetailPage | Yes | Project Member |
| `/profile` | ProfilePage | Yes | — |

### Key Components

1. **Layout Shell**
   - Sidebar navigation (Projects, Dashboard, Profile)
   - Top bar with user avatar + logout
   - Breadcrumb for project/task context

2. **Dashboard View**
   - Stat cards: Total Projects, Active Tasks, Overdue Tasks, Completed This Week
   - Overdue tasks list (priority sorted)
   - Recent activity feed
   - Task status distribution chart (Recharts pie chart)

3. **Project List View**
   - Grid of project cards (name, status, member count, task count)
   - "Create Project" modal
   - Quick actions (archive for owners)

4. **Project Detail View**
   - Project header with tabs: Tasks | Members | Settings
   - **Tasks Tab:** Kanban-style board (Todo → In Progress → Review → Done) + List toggle
     - Drag-and-drop to change status (optional v2, start with click-to-edit)
     - Task cards show: title, priority badge, assignee avatar, due date, overdue indicator
     - "New Task" modal with assignee dropdown (project members only)
   - **Members Tab:** List with role badges, invite form (email input), role switcher, remove button (Admin only)
   - **Settings Tab:** Edit name/description, archive project, transfer ownership (Admin only)

5. **Task Detail Modal/Drawer**
   - Full task info with inline editing
   - Status dropdown
   - Assignee selector
   - Due date picker
   - Activity history (created/updated timestamps)
   - Delete button (Admin only)

---

## 8. Data Flow & State Management

### Server State (TanStack Query)
- `useAuth()` — manages current user, login, logout, token refresh
- `useProjects()` — list, create, update, invalidate on mutation
- `useProject(id)` — single project with members and tasks
- `useTasks(projectId)` — CRUD with optimistic updates for status changes
- `useDashboard()` — aggregated stats, auto-refetch every 60s

### Client State (React Context)
- `AuthContext` — currentUser, isLoading, login(), logout()
- `ThemeContext` — light/dark mode (shadcn default)

### API Client (Axios)
```typescript
// Interceptors:
// Request: Attach Authorization: Bearer <accessToken>
// Response 401: Queue requests, call /auth/refresh, retry with new token
// Response 403: Redirect to /dashboard with toast "Access denied"
```

---

## 9. Business Rules & Validations

### Project Rules
- A user can create unlimited projects.
- Project creator is automatically Admin.
- Only Admins can invite/remove members or change roles.
- Only Admins can create/delete tasks.
- Members can update status of tasks assigned to them only.
- Archiving a project hides it from default lists but preserves data.

### Task Rules
- `dueDate` must be in the future on creation (can be updated to past? No, keep strict).
- Overdue = `dueDate < now() AND status !== DONE`.
- When task status changes to DONE, record completion (use `updatedAt` as proxy).
- Priority determines sort order: URGENT > HIGH > MEDIUM > LOW.

### Member Rules
- Cannot remove the last Admin (project must have at least one Admin).
- Cannot invite a user who is already a member.
- If invited user doesn't exist, return 404 (no auto-registration for security).

---

## 10. Deployment Plan (Railway)

### Monorepo Structure
```
team-task-manager/
├── apps/
│   ├── api/                 # Express + Prisma
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── Dockerfile       # Railway deployment
│   └── web/                 # React + Vite
│       ├── src/
│       ├── package.json
│       └── Dockerfile       # Railway deployment (nginx serve)
├── packages/
│   └── shared/              # Zod schemas, types (optional)
├── railway.json             # Railway config
└── README.md
```

### Railway Services Setup
1. **PostgreSQL Database**
   - Provision via Railway dashboard
   - Copy `DATABASE_URL` to API service variables

2. **API Service (`api`)**
   - Root Directory: `apps/api`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
   - Healthcheck: `GET /api/v1/health`

3. **Web Service (`web`)**
   - Root Directory: `apps/web`
   - Build: `npm install && npm run build`
   - Start: Serve `dist/` via nginx or `npx serve dist -s`
   - Environment: `VITE_API_URL` pointing to Railway API domain

### Required Environment Variables

**API Service:**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="<generate-strong-secret>"
JWT_REFRESH_SECRET="<generate-different-secret>"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://<railway-web-domain>"
```

**Web Service:**
```env
VITE_API_URL="https://<railway-api-domain>/api/v1"
```

### Database Migration on Deploy
```json
// railway.json for API service
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start"
  }
}
```

### CORS Configuration
```typescript
// API: Allow only FRONTEND_URL in production
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
```

---

## 11. Error Handling & Response Format

### Standard API Response
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Error Codes
| Code | HTTP Status | Scenario |
|------|-------------|----------|
| `UNAUTHORIZED` | 401 | Invalid/missing token |
| `FORBIDDEN` | 403 | Valid token, insufficient role |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `CONFLICT` | 409 | Duplicate email, already member |

---

## 12. Development Phases (MVP → v1)

### Phase 1: Foundation (Day 1)
- [ ] Monorepo setup with shared TypeScript config
- [ ] PostgreSQL + Prisma schema + initial migration
- [ ] Express server with middleware (cors, helmet, rate-limit, error handler)
- [ ] Zod shared schemas package

### Phase 2: Auth (Day 1-2)
- [ ] Register/Login/Refresh/Logout endpoints
- [ ] Password hashing (bcrypt, cost 12)
- [ ] JWT middleware
- [ ] React auth context + login/register forms
- [ ] Protected route wrapper

### Phase 3: Projects (Day 2)
- [ ] CRUD endpoints with RBAC
- [ ] Invite member flow (by email lookup)
- [ ] Project list page
- [ ] Project creation modal

### Phase 4: Tasks (Day 3)
- [ ] Task CRUD endpoints
- [ ] Task authorization middleware (member-only status updates)
- [ ] Kanban board UI (4 columns)
- [ ] Task creation/editing modal
- [ ] Overdue highlighting (red badge if past due)

### Phase 5: Dashboard (Day 3-4)
- [ ] Dashboard stats aggregation (Prisma $queryRaw or grouped counts)
- [ ] Overdue tasks endpoint
- [ ] Dashboard UI with Recharts
- [ ] Recent activity (last 10 updated tasks)

### Phase 6: Polish & Deploy (Day 4-5)
- [ ] Loading skeletons, empty states, error toasts
- [ ] Responsive design (mobile sidebar drawer)
- [ ] Railway deployment config
- [ ] Database migration on deploy
- [ ] End-to-end smoke tests

---

## 13. Testing Checklist (Manual)

### Auth
- [ ] Register with invalid email → validation error
- [ ] Register duplicate email → conflict error
- [ ] Login wrong password → 401
- [ ] Access protected route without token → redirect to login
- [ ] Token expiry → auto-refresh seamless

### Projects
- [ ] Create project → appears in list
- [ ] Non-member tries to access project URL → 403 redirect
- [ ] Member sees project but cannot access Settings tab
- [ ] Admin archives project → disappears from list, accessible via filter

### Tasks
- [ ] Admin creates task, assigns to Member
- [ ] Member sees task in their dashboard
- [ ] Member updates status to DONE → success
- [ ] Member tries to change task title → 403
- [ ] Admin changes task assignee → member sees update
- [ ] Overdue task shows red warning on dashboard and task card

### Members
- [ ] Admin invites new member by email → appears in list
- [ ] Admin tries to remove last Admin → error "Project must have at least one admin"
- [ ] Admin changes Member to Admin → both have full control

---

## 14. Appendix

### Railway CLI Commands (for reference)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy API service
cd apps/api
railway up

# Deploy Web service
cd apps/web
railway up

# View logs
railway logs
```

### Prisma Commands
```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma studio
npx prisma migrate deploy   # production
```

### Useful Packages
```json
{
  "api": {
    "express": "^4.21.0",
    "prisma": "^5.22.0",
    "@prisma/client": "^5.22.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "express-rate-limit": "^7.4.0"
  },
  "web": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@tanstack/react-query": "^5.60.0",
    "axios": "^1.7.7",
    "tailwindcss": "^3.4.0",
    "recharts": "^2.13.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0"
  }
}
```

---

## 15. File Structure (Target)

```
team-task-manager/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── env.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── validate.ts
│   │   │   │   └── rbac.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── project.routes.ts
│   │   │   │   ├── task.routes.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── project.controller.ts
│   │   │   │   ├── task.controller.ts
│   │   │   │   └── dashboard.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── project.service.ts
│   │   │   │   ├── task.service.ts
│   │   │   │   └── dashboard.service.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── jwt.ts
│   │   │   │   └── apiResponse.ts
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/           # shadcn components
│       │   │   ├── layout/
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Topbar.tsx
│       │   │   │   └── AppLayout.tsx
│       │   │   ├── project/
│       │   │   │   ├── ProjectCard.tsx
│       │   │   │   ├── ProjectForm.tsx
│       │   │   │   └── MemberList.tsx
│       │   │   ├── task/
│       │   │   │   ├── TaskCard.tsx
│       │   │   │   ├── TaskBoard.tsx
│       │   │   │   ├── TaskForm.tsx
│       │   │   │   └── PriorityBadge.tsx
│       │   │   └── dashboard/
│       │   │       ├── StatCard.tsx
│       │   │       ├── OverdueList.tsx
│       │   │       └── StatusChart.tsx
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── ProjectsPage.tsx
│       │   │   └── ProjectDetailPage.tsx
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useProjects.ts
│       │   │   └── useTasks.ts
│       │   ├── context/
│       │   │   └── AuthContext.tsx
│       │   ├── lib/
│       │   │   ├── api.ts        # axios instance
│       │   │   └── utils.ts
│       │   ├── types/
│       │   │   └── index.ts
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── package.json
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── Dockerfile
├── packages/
│   └── shared/
│       ├── src/
│       │   └── schemas.ts        # All Zod schemas
│       ├── package.json
│       └── tsconfig.json
├── .gitignore
├── package.json                  # Root workspace config
├── turbo.json                    # Turborepo config (optional)
└── README.md
```

---

## 16. Success Criteria

- [ ] User can register, login, and persist session across refreshes
- [ ] Admin creates project → invites member by email → member sees project
- [ ] Admin creates 5 tasks with varying priorities/due dates → Kanban board displays correctly
- [ ] Member updates 2 task statuses → changes reflect in real-time (TanQuery refetch)
- [ ] Dashboard shows accurate counts and overdue list
- [ ] Railway deployment is live with HTTPS
- [ ] Database migrations run automatically on deploy
- [ ] No console errors; responsive on 375px mobile width

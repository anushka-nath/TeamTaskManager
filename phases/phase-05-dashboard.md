# Phase 5: Dashboard Plan

**Objective:** Implement the dashboard backend (aggregated stats, overdue tasks, recent activity) and frontend dashboard page with stat cards, overdue task list, recent activity feed, and a Recharts pie chart showing task status distribution.

**PRD Sections Implemented:** 4 (Dashboard Endpoints), 7 (DashboardPage, StatCard, OverdueList, StatusChart), 8 (useDashboard hook), 9 (Overdue definition, Priority sort), 11 (Error Handling), 13 (Dashboard Testing Checklist)

---

## 1. Files to Create

### API — New Files
| File | Purpose |
|------|---------|
| `apps/api/src/routes/dashboard.routes.ts` | Express router for `/dashboard` endpoints |
| `apps/api/src/controllers/dashboard.controller.ts` | Handlers for stats, overdue, recent |
| `apps/api/src/services/dashboard.service.ts` | Aggregation queries using Prisma `$queryRaw` or grouped counts |

### API — Modified Files
| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Mount `dashboardRouter` at `/api/v1/dashboard` with `authenticate` middleware |

### Web — New Files
| File | Purpose |
|------|---------|
| `apps/web/src/pages/DashboardPage.tsx` | Main dashboard layout with stat cards, charts, and lists |
| `apps/web/src/components/dashboard/StatCard.tsx` | Card showing a metric label and value |
| `apps/web/src/components/dashboard/OverdueList.tsx` | List of overdue tasks across all user projects |
| `apps/web/src/components/dashboard/StatusChart.tsx` | Recharts PieChart showing task status distribution |
| `apps/web/src/components/dashboard/RecentActivity.tsx` | List of recently updated tasks |
| `apps/web/src/hooks/useDashboard.ts` | TanStack Query hooks: `useDashboardStats()`, `useOverdueTasks()`, `useRecentActivity()` |

### Web — Modified Files
| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Ensure `/dashboard` route renders DashboardPage inside AppLayout and ProtectedRoute |
| `apps/web/src/components/layout/Sidebar.tsx` | Ensure Dashboard link is present and active state works |

---

## 2. Packages / Dependencies to Install

No new API packages.

Verify `recharts` is installed in `apps/web`:
```bash
cd apps/web && npm install recharts@^2.13.0
```

---

## 3. Prisma Schema Changes

No schema changes.

**Migration:** None.

---

## 4. REST API Endpoints

All prefixed with `/api/v1/dashboard`. All require `authenticate`.

| Method | Route | Auth | Status Codes | Response Data |
|--------|-------|------|--------------|---------------|
| GET | `/dashboard/stats` | Auth | 200 | `{ stats: DashboardStats }` |
| GET | `/dashboard/overdue` | Auth | 200 | `{ tasks: OverdueTask[] }` |
| GET | `/dashboard/recent` | Auth | 200 | `{ tasks: RecentTask[] }` |

### Endpoint Details

**GET /dashboard/stats**
- Returns aggregated stats for the authenticated user:
  ```ts
  type DashboardStats = {
    totalProjects: number;        // count of projects user owns or is member of
    activeTasks: number;          // count of tasks in user's projects where status !== DONE
    overdueTasks: number;         // count of tasks where dueDate < now AND status !== DONE
    completedThisWeek: number;    // count of tasks where status === DONE AND updatedAt >= startOfWeek
  };
  ```
- Use Prisma `count` and `groupBy` or `$queryRaw` for efficiency.

**GET /dashboard/overdue**
- Returns overdue tasks across all projects the user is a member of.
- Overdue = `dueDate < new Date() AND status !== DONE`.
- Sorted by priority desc (URGENT > HIGH > MEDIUM > LOW), then dueDate asc.
- Each task includes: `id`, `title`, `priority`, `dueDate`, `status`, `project: { id, name }`, `assignee: { id, name }`.

**GET /dashboard/recent**
- Returns the 10 most recently updated tasks across all user's projects.
- Sorted by `updatedAt` desc.
- Each task includes: `id`, `title`, `status`, `updatedAt`, `project: { id, name }`.

---

## 5. React Components / Pages

### Pages
- `DashboardPage(props: {}): JSX.Element`
  - Uses `useDashboardStats()`, `useOverdueTasks()`, `useRecentActivity()`.
  - Auto-refetch stats every 60 seconds (`refetchInterval: 60000`).
  - Responsive grid layout:
    - Top row: 4 `StatCard`s.
    - Middle row: `StatusChart` (left, 60%) + `OverdueList` (right, 40%).
    - Bottom row: `RecentActivity` full width.
  - Loading skeletons while data fetching.
  - Empty states for overdue/recent when no data.

### Components
- `StatCard({ label, value, icon }: { label: string; value: number; icon: LucideIcon }): JSX.Element`
  - Rounded card with icon, label, and large number.
  - Colors vary by stat type.

- `StatusChart({ tasks }: { tasks: TaskSummary[] }): JSX.Element`
  - Recharts `PieChart` with 4 segments: TODO, IN_PROGRESS, REVIEW, DONE.
  - Colors: TODO = gray, IN_PROGRESS = blue, REVIEW = yellow, DONE = green.
  - `Tooltip` and `Legend`.
  - ResponsiveContainer for mobile compatibility.

- `OverdueList({ tasks }: { tasks: OverdueTask[] }): JSX.Element`
  - List of overdue tasks.
  - Each item shows: task title (truncated), project name, due date (formatted), priority badge.
  - Click navigates to task detail.
  - Red left border or background for urgency.

- `RecentActivity({ tasks }: { tasks: RecentTask[] }): JSX.Element`
  - List of 10 recently updated tasks.
  - Each item shows: task title, status badge, project name, "Updated X minutes ago" (relative time).
  - Click navigates to task detail.

---

## 6. Middleware, Utilities, Hooks, Contexts

### API Services — `apps/api/src/services/dashboard.service.ts`

Functions:
- `getStats(userId: string) => Promise<DashboardStats>`
  - `totalProjects`: `prisma.project.count({ where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } })`
  - `activeTasks`: `prisma.task.count({ where: { project: { OR: [...] }, status: { not: 'DONE' } } })`
  - `overdueTasks`: `prisma.task.count({ where: { project: { OR: [...] }, dueDate: { lt: new Date() }, status: { not: 'DONE' } } })`
  - `completedThisWeek`: count tasks with `status: 'DONE'` and `updatedAt >= startOfWeek(new Date())`.

- `getOverdueTasks(userId: string) => Promise<OverdueTask[]>`
  - Query tasks with `dueDate < now()`, `status !== DONE`, project membership condition.
  - Include `project` (id, name) and `assignee` (id, name).
  - Order by priority desc, dueDate asc.

- `getRecentTasks(userId: string, limit = 10) => Promise<RecentTask[]>`
  - Query tasks with project membership condition.
  - Include `project` (id, name).
  - Order by `updatedAt` desc.
  - Take `limit`.

### Web Hooks — `apps/web/src/hooks/useDashboard.ts`

TanStack Query hooks:
- `useDashboardStats()` → `useQuery({ queryKey: ['dashboard', 'stats'], queryFn: fetchStats, refetchInterval: 60000 })`
- `useOverdueTasks()` → `useQuery({ queryKey: ['dashboard', 'overdue'], queryFn: fetchOverdue })`
- `useRecentActivity()` → `useQuery({ queryKey: ['dashboard', 'recent'], queryFn: fetchRecent })`

---

## 7. Database Seeding / Setup

- No seeding.
- Manual test: create multiple projects with tasks in various statuses and due dates to verify dashboard aggregation.

---

## 8. Environment Variables

No new env vars.

---

## 9. Acceptance Criteria

Before proceeding to Phase 6, ALL of the following must pass:

- [ ] `GET /dashboard/stats` returns correct total projects count for the user.
- [ ] `GET /dashboard/stats` returns correct active tasks count (status !== DONE).
- [ ] `GET /dashboard/stats` returns correct overdue tasks count (dueDate < now && status !== DONE).
- [ ] `GET /dashboard/stats` returns correct completed this week count.
- [ ] `GET /dashboard/overdue` returns only overdue tasks from projects the user is a member of.
- [ ] Overdue tasks are sorted by priority desc, then dueDate asc.
- [ ] `GET /dashboard/recent` returns the 10 most recently updated tasks.
- [ ] Dashboard page displays 4 stat cards with correct values.
- [ ] Dashboard page shows Recharts pie chart with 4 status segments.
- [ ] Dashboard page shows overdue task list with red indicators.
- [ ] Dashboard page shows recent activity list with relative timestamps.
- [ ] Dashboard stats auto-refetch every 60 seconds.
- [ ] All dashboard lists are clickable and navigate to the relevant task/project.
- [ ] Empty states render gracefully when there are no overdue/recent tasks.
- [ ] No `TODO` comments remain.

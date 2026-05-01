# Phase 4: Tasks Plan

**Objective:** Implement the complete task lifecycle: backend CRUD endpoints with RBAC (including member-only status updates), frontend Kanban board (4 columns), task cards with priority badges and overdue indicators, task creation/editing modals, and assignee selection.

**PRD Sections Implemented:** 4 (Task Endpoints), 5 (Task Schemas), 6 (authorizeTaskUpdate middleware), 7 (TaskCard, TaskBoard, TaskForm, PriorityBadge, Kanban columns, TaskDetailPage), 8 (useTasks hook), 9 (Task Rules, Member Rules), 11 (Error Codes — FORBIDDEN, VALIDATION_ERROR), 13 (Tasks Testing Checklist)

---

## 1. Files to Create

### API — New Files
| File | Purpose |
|------|---------|
| `apps/api/src/routes/task.routes.ts` | Express router for `/projects/:projectId/tasks` endpoints |
| `apps/api/src/controllers/task.controller.ts` | Handlers for create, list, get, update, delete task |
| `apps/api/src/services/task.service.ts` | Business logic for task CRUD, overdue detection, priority sorting |

### API — Modified Files
| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Mount `taskRouter` at `/api/v1/projects/:projectId/tasks`; ensure `authenticate` and `authorizeProjectRole` are applied appropriately |

### Web — New Files
| File | Purpose |
|------|---------|
| `apps/web/src/pages/TaskDetailPage.tsx` | Task detail view (can be modal or page at `/projects/:projectId/tasks/:taskId`) |
| `apps/web/src/components/task/TaskCard.tsx` | Card showing title, priority badge, assignee avatar, due date, overdue indicator |
| `apps/web/src/components/task/TaskBoard.tsx` | Kanban board with 4 columns: TODO, IN_PROGRESS, REVIEW, DONE |
| `apps/web/src/components/task/TaskForm.tsx` | Modal form for creating/editing tasks (title, description, priority, due date, assignee dropdown) |
| `apps/web/src/components/task/PriorityBadge.tsx` | Colored badge component for LOW/MEDIUM/HIGH/URGENT |
| `apps/web/src/components/task/StatusColumn.tsx` | Single Kanban column wrapper for a TaskStatus |
| `apps/web/src/hooks/useTasks.ts` | TanStack Query hooks: `useTasks(projectId)`, `useTask(projectId, taskId)`, `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()` |

### Web — Modified Files
| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Add route `/projects/:projectId/tasks/:taskId` → TaskDetailPage |
| `apps/web/src/pages/ProjectDetailPage.tsx` | Implement Tasks tab: render `TaskBoard` with real task data |

### Shared Package — Modified Files
| File | Change |
|------|--------|
| `packages/shared/src/schemas.ts` | Add `createTaskSchema`, `updateTaskSchema` |
| `packages/shared/src/types.ts` | Export inferred types: `CreateTaskInput`, `UpdateTaskInput` |

---

## 2. Packages / Dependencies to Install

No new packages if Phase 1/2 deps are installed.

If `date-fns` is not in `apps/web`:
```bash
cd apps/web && npm install date-fns@^4.1.0
```

---

## 3. Prisma Schema Changes

No schema changes — `Task` model exists from Phase 1.

**Migration:** None.

---

## 4. REST API Endpoints

All routes prefixed with `/api/v1/projects/:projectId`.

| Method | Route | RBAC | Status Codes | Zod Schema (request) | Response Data |
|--------|-------|------|--------------|----------------------|---------------|
| POST | `/tasks` | Project Admin | 201, 400, 403 | `createTaskSchema` | `{ task: TaskWithAssignee }` |
| GET | `/tasks` | Project Member | 200, 403 | — | `{ tasks: TaskWithAssignee[] }` |
| GET | `/tasks/:taskId` | Project Member | 200, 403, 404 | — | `{ task: TaskWithDetails }` |
| PATCH | `/tasks/:taskId` | Admin (any) / Member (own status only) | 200, 400, 403, 404 | `updateTaskSchema` | `{ task: TaskWithAssignee }` |
| DELETE | `/tasks/:taskId` | Project Admin | 200, 403, 404 | — | `{ success: true }` |

### Endpoint Details

**POST /tasks**
- Uses `authorizeProjectRole(["ADMIN"])`.
- `createTaskSchema`:
  ```ts
  const createTaskSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeId: z.string().uuid().optional().nullable(),
  });
  ```
- `creatorId = req.user.id`.
- `projectId = req.params.projectId`.
- If `dueDate` provided, must be in the future (compare to `new Date()`). If not → 400 `VALIDATION_ERROR`, message "Due date must be in the future".
- If `assigneeId` provided, verify assignee is a project member. If not → 400 `VALIDATION_ERROR`.
- Returns 201 with task including assignee details.

**GET /tasks**
- Uses `authorizeProjectRole(["ADMIN", "MEMBER"])`.
- Returns all tasks for the project.
- Default sort: priority desc (URGENT > HIGH > MEDIUM > LOW), then createdAt desc.
- Includes assignee: `{ id, name, email, avatarUrl }`.

**GET /tasks/:taskId**
- Uses `authorizeProjectRole(["ADMIN", "MEMBER"])`.
- Returns task with assignee and creator details.
- If task does not belong to project → 404.

**PATCH /tasks/:taskId**
- Uses `authorizeTaskUpdate` middleware (see below).
- `updateTaskSchema`:
  ```ts
  const updateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assigneeId: z.string().uuid().optional().nullable(),
  });
  ```
- **Admin:** can update any field.
- **Member:** can only update `status` AND only if `task.assigneeId === req.user.id`. Any other field in request body → 403 `FORBIDDEN`.
- If `dueDate` is being updated to a past date → 400 `VALIDATION_ERROR` (keep strict per PRD Section 9).
- Returns 200 with updated task.

**DELETE /tasks/:taskId**
- Uses `authorizeProjectRole(["ADMIN"])`.
- Deletes task.
- Returns 200 success.

---

## 5. React Components / Pages

### Pages
- `TaskDetailPage(props: {}): JSX.Element`
  - Reads `projectId` and `taskId` from `useParams()`.
  - Uses `useTask(projectId, taskId)`.
  - Full task info display: title, description, status dropdown, priority badge, assignee selector, due date picker.
  - Inline editing for admins.
  - Members can only change status if assigned.
  - Activity history: createdAt, updatedAt timestamps.
  - Delete button (admin only).
  - Back button to project.

### Components
- `TaskBoard({ projectId, tasks, isAdmin }: { projectId: string; tasks: TaskWithAssignee[]; isAdmin: boolean }): JSX.Element`
  - 4 columns: TODO, IN_PROGRESS, REVIEW, DONE.
  - Each column is a `StatusColumn`.
  - Tasks filtered by `status` into respective columns.
  - "New Task" button (admin only) opens `TaskForm` modal.

- `StatusColumn({ status, tasks, isAdmin, projectId }: { status: TaskStatus; tasks: TaskWithAssignee[]; isAdmin: boolean; projectId: string }): JSX.Element`
  - Column header with status name and task count.
  - Renders `TaskCard` for each task in the column.
  - Sorts tasks by priority within column.

- `TaskCard({ task, isAdmin }: { task: TaskWithAssignee; isAdmin: boolean }): JSX.Element`
  - Displays: title (truncated if long), `PriorityBadge`, assignee avatar/initials, due date.
  - Overdue indicator: red border or badge if `dueDate < now && status !== DONE`.
  - Click navigates to task detail.
  - Admin sees quick edit/delete actions.

- `TaskForm({ mode, task, projectId, projectMembers, onClose, onSubmit }: { mode: 'create' | 'edit'; task?: Task; projectId: string; projectMembers: ProjectMemberWithUser[]; onClose: () => void; onSubmit: (data: CreateTaskInput | UpdateTaskInput) => void }): JSX.Element`
  - Title input (required).
  - Description textarea.
  - Priority select (LOW/MEDIUM/HIGH/URGENT).
  - Due date datetime-local input.
  - Assignee select dropdown (project members only; includes "Unassigned" option).
  - Submit button.
  - Validation errors displayed inline.

- `PriorityBadge({ priority }: { priority: Priority }): JSX.Element`
  - Color mapping: LOW = blue, MEDIUM = green, HIGH = orange, URGENT = red.
  - Small rounded badge with priority text.

---

## 6. Middleware, Utilities, Hooks, Contexts

### API Middleware — `authorizeTaskUpdate` in `apps/api/src/middleware/rbac.ts`

**`authorizeTaskUpdate(req, res, next)`**
- Must run AFTER `authenticate` AND `authorizeProjectRole(["ADMIN", "MEMBER"])`.
- Read `req.projectMember.role`.
- If role is `ADMIN`: call `next()` (allow any update).
- If role is `MEMBER`:
  - Fetch the task from DB using `req.params.taskId`.
  - If `task.assigneeId !== req.user.id` → 403 `FORBIDDEN`.
  - Check request body keys. If any key other than `status` is present → 403 `FORBIDDEN`.
  - Call `next()`.

### API Services — `apps/api/src/services/task.service.ts`

Functions:
- `createTask(projectId: string, creatorId: string, data: CreateTaskInput) => Promise<TaskWithAssignee>`
- `getTasksByProject(projectId: string) => Promise<TaskWithAssignee[]>`
- `getTaskById(taskId: string) => Promise<TaskWithDetails | null>`
- `updateTask(taskId: string, data: UpdateTaskInput) => Promise<TaskWithAssignee>`
- `deleteTask(taskId: string) => Promise<void>`
- `isAssigneeProjectMember(projectId: string, assigneeId: string) => Promise<boolean>`

Priority sort order mapping:
```ts
const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
```

### Web Hooks — `apps/web/src/hooks/useTasks.ts`

TanStack Query hooks:
- `useTasks(projectId: string)` → `useQuery({ queryKey: ['tasks', projectId], queryFn: () => fetchTasks(projectId) })`
- `useTask(projectId: string, taskId: string)` → `useQuery({ queryKey: ['task', projectId, taskId], queryFn: () => fetchTask(projectId, taskId) })`
- `useCreateTask()` → `useMutation({ mutationFn: ({ projectId, data }) => createTask(projectId, data), onSuccess: invalidate ['tasks', projectId] })`
- `useUpdateTask()` → `useMutation({ mutationFn: ({ projectId, taskId, data }) => updateTask(projectId, taskId, data), onSuccess: invalidate ['tasks', projectId] and ['task', projectId, taskId] })`
  - **Optimistic update:** for status changes, update cache immediately before server response.
- `useDeleteTask()` → `useMutation({ mutationFn: ({ projectId, taskId }) => deleteTask(projectId, taskId), onSuccess: invalidate ['tasks', projectId] })`

---

## 7. Database Seeding / Setup

- No seeding.
- Manual test: Admin creates 5 tasks with varying priorities/due dates and assigns some to a Member.

---

## 8. Environment Variables

No new env vars.

---

## 9. Acceptance Criteria

Before proceeding to Phase 5, ALL of the following must pass:

- [ ] `POST /projects/:projectId/tasks` creates a task with correct projectId and creatorId.
- [ ] Creating a task with past dueDate returns 400.
- [ ] Creating a task with non-member assigneeId returns 400.
- [ ] `GET /projects/:projectId/tasks` returns all project tasks sorted by priority desc.
- [ ] `GET /projects/:projectId/tasks/:taskId` returns task details with assignee.
- [ ] Admin can update any field on any task.
- [ ] Member can update `status` on their assigned tasks.
- [ ] Member updating `status` on unassigned task returns 403.
- [ ] Member trying to update `title`, `description`, `priority`, `dueDate`, or `assigneeId` returns 403.
- [ ] `DELETE /projects/:projectId/tasks/:taskId` returns 403 for members.
- [ ] Frontend Kanban board shows 4 columns with tasks in correct columns.
- [ ] Tasks within columns sorted by priority (URGENT first).
- [ ] Task cards show priority badge, assignee avatar/initials, due date.
- [ ] Overdue tasks (dueDate < now && status !== DONE) show red warning indicator.
- [ ] Admin sees "New Task" button and can create tasks via modal.
- [ ] Task creation modal has assignee dropdown limited to project members.
- [ ] Task detail page allows inline status editing.
- [ ] Admin can delete tasks from detail page.
- [ ] Optimistic updates immediately move task cards when status changes.
- [ ] No `TODO` comments remain.

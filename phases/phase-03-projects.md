# Phase 3: Projects Plan

**Objective:** Implement the complete project lifecycle: backend CRUD endpoints for projects with RBAC, member invitation/removal/role changes, frontend project list page, project creation modal, and project detail shell with tabs.

**PRD Sections Implemented:** 4 (Project Endpoints), 5 (Project Schemas), 6 (authorizeProjectRole middleware), 7 (Project List / Detail Pages, MemberList, ProjectCard, ProjectForm), 8 (useProjects hook), 9 (Project Rules, Member Rules), 11 (Error Codes — FORBIDDEN, NOT_FOUND, CONFLICT), 13 (Projects / Members Testing Checklist)

---

## 1. Files to Create

### API — New Files
| File | Purpose |
|------|---------|
| `apps/api/src/middleware/rbac.ts` | `authorizeProjectRole(roles: MemberRole[])` middleware + `authorizeTaskUpdate` middleware |
| `apps/api/src/routes/project.routes.ts` | Express router for `/projects` endpoints |
| `apps/api/src/controllers/project.controller.ts` | Handlers for create, list, get, update, delete, invite member, remove member, change role |
| `apps/api/src/services/project.service.ts` | Business logic for all project and member operations |

### API — Modified Files
| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Mount `projectRouter` at `/api/v1/projects`; ensure `authenticate` middleware is applied to all project routes |

### Web — New Files
| File | Purpose |
|------|---------|
| `apps/web/src/pages/ProjectsPage.tsx` | Displays grid of `ProjectCard`s, "Create Project" button opening modal |
| `apps/web/src/pages/ProjectDetailPage.tsx` | Project detail with tabs: Tasks (default) \| Members \| Settings |
| `apps/web/src/components/project/ProjectCard.tsx` | Card showing project name, status badge, member count, task count |
| `apps/web/src/components/project/ProjectForm.tsx` | Modal form for creating/editing projects (name, description) |
| `apps/web/src/components/project/MemberList.tsx` | List of project members with role badges, invite form, role switcher, remove button |
| `apps/web/src/hooks/useProjects.ts` | TanStack Query hooks: `useProjects()`, `useProject(id)`, `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`, `useInviteMember()`, `useRemoveMember()`, `useUpdateMemberRole()` |

### Web — Modified Files
| File | Change |
|------|--------|
| `apps/web/src/App.tsx` | Add routes: `/projects` → ProjectsPage, `/projects/:id` → ProjectDetailPage |
| `apps/web/src/components/layout/Sidebar.tsx` | Ensure Projects link is present and active state works |

### Shared Package — Modified Files
| File | Change |
|------|--------|
| `packages/shared/src/schemas.ts` | Add `createProjectSchema`, `updateProjectSchema`, `inviteMemberSchema` |
| `packages/shared/src/types.ts` | Export inferred types: `CreateProjectInput`, `UpdateProjectInput`, `InviteMemberInput` |

---

## 2. Packages / Dependencies to Install

No new packages required for Phase 3 if Phase 1/2 deps are installed. Verify `@ttm/shared` is resolvable by both apps.

If not already present:
```bash
# In apps/web (if not installed)
npm install @ttm/shared
```

---

## 3. Prisma Schema Changes

No schema changes — all models (`Project`, `ProjectMember`, `User`) exist from Phase 1.

**Migration:** None.

---

## 4. REST API Endpoints

All routes prefixed with `/api/v1`. All require `authenticate` middleware.

### Project CRUD

| Method | Route | RBAC | Status Codes | Zod Schema (request) | Response Data |
|--------|-------|------|--------------|----------------------|---------------|
| POST | `/projects` | Auth | 201, 400 | `createProjectSchema` | `{ project: ProjectWithOwner }` |
| GET | `/projects` | Auth | 200 | — | `{ projects: ProjectSummary[] }` |
| GET | `/projects/:id` | Project Member | 200, 403, 404 | — | `{ project: ProjectWithMembersAndTasks }` |
| PATCH | `/projects/:id` | Project Admin | 200, 403, 404, 400 | `updateProjectSchema` | `{ project: Project }` |
| DELETE | `/projects/:id` | Project Admin | 200, 403, 404 | — | `{ success: true }` |

### Member Management (all Project Admin only)

| Method | Route | Status Codes | Zod Schema (request) | Response Data |
|--------|-------|--------------|----------------------|---------------|
| POST | `/projects/:id/members` | 201, 400, 404, 409 | `inviteMemberSchema` | `{ member: ProjectMemberWithUser }` |
| DELETE | `/projects/:id/members/:userId` | 200, 400, 403, 404 | — | `{ success: true }` |
| PATCH | `/projects/:id/members/:userId` | 200, 400, 403, 404 | `z.object({ role: z.enum(["ADMIN","MEMBER"]) })` | `{ member: ProjectMemberWithUser }` |

### Endpoint Details

**POST /projects**
- `createProjectSchema`:
  ```ts
  const createProjectSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  });
  ```
- Creates `Project` with `ownerId = req.user.id`.
- Also creates `ProjectMember` with `role = ADMIN` for the creator.
- Returns 201 with full project object.

**GET /projects**
- Returns all projects where `req.user.id` is either `ownerId` OR a member of via `ProjectMember`.
- Each project summary includes: `id`, `name`, `description`, `status`, `ownerId`, `createdAt`, `updatedAt`, `_count: { members, tasks }`.
- Default filter excludes `ARCHIVED` unless query param `?includeArchived=true`.

**GET /projects/:id**
- Uses `authorizeProjectRole(["ADMIN", "MEMBER"])`.
- Returns project with `owner`, `members` (with user details), `tasks` (summary: id, title, status, priority), `_count`.

**PATCH /projects/:id**
- Uses `authorizeProjectRole(["ADMIN"])`.
- `updateProjectSchema`:
  ```ts
  const updateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  });
  ```
- Updates allowed fields.
- Returns updated project.

**DELETE /projects/:id**
- Uses `authorizeProjectRole(["ADMIN"])`.
- Soft-delete not required; Prisma `delete` with cascading deletes is acceptable per schema.
- Returns 200 success.

**POST /projects/:id/members**
- Uses `authorizeProjectRole(["ADMIN"])`.
- `inviteMemberSchema`:
  ```ts
  const inviteMemberSchema = z.object({
    email: z.string().email(),
    role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  });
  ```
- Looks up user by email. If not found → 404 `NOT_FOUND`.
- If user is already a member → 409 `CONFLICT`.
- Creates `ProjectMember` with given role.
- Returns 201 with member + user details.

**DELETE /projects/:id/members/:userId**
- Uses `authorizeProjectRole(["ADMIN"])`.
- Cannot remove self if they are the last Admin. Query: count admins in project. If count === 1 and target is ADMIN → 400 with code `VALIDATION_ERROR`, message "Project must have at least one admin".
- Deletes `ProjectMember` record.
- Returns 200 success.

**PATCH /projects/:id/members/:userId**
- Uses `authorizeProjectRole(["ADMIN"])`.
- Request body: `{ role: "ADMIN" | "MEMBER" }`.
- Cannot demote the last Admin. If changing from ADMIN to MEMBER and count of admins === 1 → 400 with same error as above.
- Returns 200 with updated member.

---

## 5. React Components / Pages

### Pages
- `ProjectsPage(props: {}): JSX.Element`
  - Uses `useProjects()` to fetch project list.
  - Displays grid of `ProjectCard` components.
  - "Create Project" button opens `ProjectForm` modal.
  - Shows empty state if no projects.

- `ProjectDetailPage(props: {}): JSX.Element`
  - Reads `id` from `useParams()`.
  - Uses `useProject(id)` to fetch details.
  - Tabs:
    - **Tasks Tab:** Placeholder for Phase 4 (shows "Tasks coming in Phase 4" or basic list if eager).
    - **Members Tab:** Renders `MemberList`.
    - **Settings Tab:** Shows project name/description editor, archive button (Admin only). Hidden if user is Member.
  - Project header with name, status badge, breadcrumb.

### Components
- `ProjectCard({ project }: { project: ProjectSummary }): JSX.Element`
  - Shows: name, status badge (ACTIVE/ARCHIVED), member count, task count.
  - Click navigates to `/projects/${project.id}`.
  - Admin sees quick archive button on card.

- `ProjectForm({ mode, project, onClose, onSubmit }: { mode: 'create' | 'edit'; project?: Project; onClose: () => void; onSubmit: (data: CreateProjectInput | UpdateProjectInput) => void }): JSX.Element`
  - Modal/dialog wrapper.
  - Name input (required).
  - Description textarea (optional).
  - Submit button calls `onSubmit`.
  - On success, close modal.

- `MemberList({ projectId, members, isAdmin }: { projectId: string; members: ProjectMemberWithUser[]; isAdmin: boolean }): JSX.Element`
  - List of members: avatar placeholder, name, email, role badge.
  - If `isAdmin`:
    - Invite form: email input + role select (default MEMBER) + Invite button.
    - Role dropdown for each member to switch ADMIN/MEMBER.
    - Remove button for each member (with last-admin guard handled by API).
  - If not admin: read-only list.

---

## 6. Middleware, Utilities, Hooks, Contexts

### API Middleware — `apps/api/src/middleware/rbac.ts`

**`authorizeProjectRole(roles: MemberRole[])`**
- Must run AFTER `authenticate`.
- Read `req.params.id` (projectId).
- Query `ProjectMember` where `projectId` + `userId = req.user.id`.
- If no membership → 403 `FORBIDDEN`.
- If membership role not in `roles` → 403 `FORBIDDEN`.
- Attach `req.projectMember = { id, role, projectId }`.
- Call `next()`.

### API Services — `apps/api/src/services/project.service.ts`

Functions:
- `createProject(userId: string, data: CreateProjectInput) => Promise<Project>`
- `getProjectsForUser(userId: string, includeArchived?: boolean) => Promise<ProjectSummary[]>`
- `getProjectById(projectId: string) => Promise<ProjectWithDetails | null>`
- `updateProject(projectId: string, data: UpdateProjectInput) => Promise<Project>`
- `deleteProject(projectId: string) => Promise<void>`
- `inviteMember(projectId: string, email: string, role: MemberRole) => Promise<ProjectMemberWithUser>`
- `removeMember(projectId: string, userId: string) => Promise<void>`
- `updateMemberRole(projectId: string, userId: string, role: MemberRole) => Promise<ProjectMemberWithUser>`
- `getAdminCount(projectId: string) => Promise<number>` — helper for last-admin guard.

### Web Hooks — `apps/web/src/hooks/useProjects.ts`

TanStack Query hooks:
- `useProjects()` → `useQuery({ queryKey: ['projects'], queryFn: fetchProjects })`
- `useProject(id: string)` → `useQuery({ queryKey: ['project', id], queryFn: () => fetchProject(id) })`
- `useCreateProject()` → `useMutation({ mutationFn: createProject, onSuccess: invalidate ['projects'] })`
- `useUpdateProject()` → `useMutation({ mutationFn: ({ id, data }) => updateProject(id, data), onSuccess: invalidate ['project', id] and ['projects'] })`
- `useDeleteProject()` → `useMutation({ mutationFn: deleteProject, onSuccess: invalidate ['projects'] })`
- `useInviteMember()` → `useMutation({ mutationFn: ({ projectId, data }) => inviteMember(projectId, data), onSuccess: invalidate ['project', projectId] })`
- `useRemoveMember()` → `useMutation({ mutationFn: ({ projectId, userId }) => removeMember(projectId, userId), onSuccess: invalidate ['project', projectId] })`
- `useUpdateMemberRole()` → `useMutation({ mutationFn: ({ projectId, userId, role }) => updateMemberRole(projectId, userId, role), onSuccess: invalidate ['project', projectId] })`

---

## 7. Database Seeding / Setup

- No seeding.
- For manual testing: register two users, have User A create a project and invite User B as MEMBER.

---

## 8. Environment Variables

No new env vars. Reuse Phase 1/2 vars.

---

## 9. Acceptance Criteria

Before proceeding to Phase 4, ALL of the following must pass:

- [ ] `POST /projects` creates a project and auto-creates an ADMIN membership for the creator.
- [ ] `GET /projects` returns only projects the user owns or is a member of.
- [ ] `GET /projects/:id` returns 403 for non-members.
- [ ] `PATCH /projects/:id` returns 403 for members (non-admin).
- [ ] `DELETE /projects/:id` returns 403 for members.
- [ ] `POST /projects/:id/members` invites an existing user by email and creates a membership.
- [ ] Inviting a non-existent user returns 404.
- [ ] Inviting an already-member user returns 409.
- [ ] `DELETE /projects/:id/members/:userId` removes a member.
- [ ] Removing the last admin returns 400 with message "Project must have at least one admin".
- [ ] `PATCH /projects/:id/members/:userId` changes role.
- [ ] Demoting the last admin to member returns 400 with same last-admin error.
- [ ] Frontend Projects page lists all user projects with member/task counts.
- [ ] Frontend "Create Project" modal creates a project and updates the list.
- [ ] Frontend Project Detail page shows Tasks/Members/Settings tabs.
- [ ] Members tab shows invite form, role switcher, and remove button for admins only.
- [ ] Settings tab is hidden or disabled for non-admin members.
- [ ] Non-member accessing `/projects/:id` via URL gets 403 and appropriate UI feedback.
- [ ] No `TODO` comments remain.

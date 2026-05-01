# Project Document: Team Task Manager

**Version:** 1.0  
**Last Updated:** May 2026  
**Status:** Production (Deployed on Railway)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Core Features](#4-core-features)
5. [User Stories](#5-user-stories)
6. [User Flows](#6-user-flows)
7. [Data Model](#7-data-model)
8. [Security & Compliance](#8-security--compliance)
9. [Performance Requirements](#9-performance-requirements)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Executive Summary

Team Task Manager (TTM) is a full-stack web application designed for small to medium-sized teams to collaborate on projects and track tasks through a visual Kanban workflow. It combines project management, task assignment, role-based access control, and real-time analytics in a single cohesive platform.

The application is built as a monorepo with a React frontend and Express backend, both written in TypeScript, sharing validation schemas through a common package. It is deployed on Railway with a managed PostgreSQL database.

**Key differentiators:**
- Per-project RBAC with admin/member roles (not global roles)
- In-memory JWT access tokens + HTTP-only cookie refresh tokens (secure by default)
- Automatic token refresh with request queuing (seamless UX)
- Kanban board with priority-based sorting and overdue detection
- Auto-refreshing dashboard with data visualization

---

## 2. Problem Statement

Small teams often struggle with:
- **Scattered task tracking** across spreadsheets, chat apps, and sticky notes
- **Unclear ownership** — who is responsible for what task and when is it due?
- **No visibility** into overall project health, overdue items, or workload distribution
- **Poor access control** — either everyone can edit everything, or nothing is editable
- **Context switching** between project planning, task execution, and team communication tools

TTM addresses these by providing a unified workspace where teams can create projects, assign tasks with clear ownership, track progress visually, and manage member permissions granularly.

---

## 3. Target Users

### Primary Personas

| Persona | Role | Goals | Pain Points |
|---------|------|-------|-------------|
| **Alex** | Team Lead / Project Admin | Create projects, assign tasks, monitor progress, manage team access | Needs clear visibility into who is doing what and what's overdue |
| **Jordan** | Team Member | View assigned tasks, update status, collaborate on projects | Wants a simple view of their tasks without noise from other projects |
| **Taylor** | Freelancer / External Contributor | Join specific projects, complete assigned work, report progress | Needs limited access — only sees what they're invited to |

### Usage Context
- Small development teams (3–15 people)
- Design agencies managing multiple client projects
- Internal product teams tracking sprint work
- Remote teams needing async task coordination

---

## 4. Core Features

### 4.1 Authentication System

**Registration**
- Email validation, password minimum 8 characters, name minimum 2 characters
- Duplicate email prevention with clear error messaging
- Automatic login after registration

**Login & Session Management**
- JWT access token (15-minute expiry) stored in application memory
- Refresh token (7-day expiry) stored in HTTP-only, SameSite=strict cookie
- Automatic silent refresh on token expiry — queued requests wait for refresh to complete
- Logout invalidates refresh token server-side and clears cookie

**Security Model**
- No tokens in `localStorage` (XSS-safe)
- bcrypt hashing with cost factor 12
- Rate limiting: 100 requests per 15 minutes per IP
- Helmet security headers
- CORS restricted to configured frontend origin

### 4.2 Project Management

**Project Lifecycle**
- Create: Name + optional description
- Update: Edit name, description, or status
- Archive: Soft-archive (retains data, hides from default view)
- Unarchive: Restore to active status
- Delete: Permanent removal (cascades to members and tasks)

**Visibility Rules**
- Users see only projects they own or are members of
- Dashboard stats aggregate across all accessible projects
- No global project discovery — membership-based access only

### 4.3 Member Management

**Invitation Flow**
1. Admin enters email address and selects role (Admin or Member)
2. If the user exists, they are immediately added to the project
3. If the user does not exist, invitation fails with a clear message
4. Admin can change member roles or remove members at any time

**Role System**
| Capability | Admin | Member |
|------------|-------|--------|
| Edit project details | ✅ | ❌ |
| Archive/delete project | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Create tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Edit any task field | ✅ | ❌ |
| Update task status (own tasks) | ✅ | ✅ |
| View all project tasks | ✅ | ✅ |

**Safety Guard:** The system enforces that at least one admin must remain in every project. Attempting to remove or demote the last admin returns a `400 VALIDATION_ERROR`.

### 4.4 Task Management

**Task Properties**
| Field | Type | Constraints |
|-------|------|-------------|
| Title | String | Required, 1–200 chars |
| Description | String | Optional, max 2000 chars |
| Status | Enum | TODO (default), IN_PROGRESS, REVIEW, DONE |
| Priority | Enum | LOW, MEDIUM (default), HIGH, URGENT |
| Due Date | ISO Datetime | Optional, must be in the future |
| Assignee | User | Optional, must be a project member |
| Creator | User | Auto-set to task creator |

**Kanban Board**
- 4 columns corresponding to task statuses
- Cards sorted by priority within each column (Urgent → High → Medium → Low)
- Cards display: title, priority badge, assignee name, due date, overdue indicator
- Clicking a card navigates to the task detail page
- Quick status-change buttons on cards (respects RBAC)

**Task Detail Page**
- Full task information with metadata
- Inline edit modal for admins and assignees
- Status dropdown for non-admin assignees
- Delete button for admins
- Navigation back to parent project

**Overdue Detection**
- Tasks with `dueDate < now()` and `status !== DONE` are flagged as overdue
- Overdue tasks show red border and alert icon on the board
- Dashboard displays a dedicated overdue tasks panel

### 4.5 Dashboard Analytics

**Stat Cards**
- Total Projects — count of accessible projects
- Active Tasks — count of non-DONE tasks
- Overdue Tasks — count of overdue tasks
- Completed This Week — count of DONE tasks updated since Monday

**Task Status Distribution**
- Pie chart (Recharts) showing breakdown across TODO, IN_PROGRESS, REVIEW, DONE
- Updated automatically with dashboard data

**Overdue Tasks Panel**
- Lists up to 50 overdue tasks across all accessible projects
- Sorted by priority (Urgent first)
- Shows project name, task title, due date, and assignee

**Recent Activity**
- Last 10 updated tasks across all projects
- Shows task title, project name, and relative update time

**Auto-Refresh**
- Dashboard stats refetch every 60 seconds
- Other pages use standard TanStack Query stale-time behavior

---

## 5. User Stories

### Authentication
- **As a** new user, **I want to** register with my email and password, **so that** I can access the platform.
- **As a** returning user, **I want to** log in and have my session persist across page refreshes, **so that** I don't have to log in repeatedly.
- **As a** security-conscious user, **I want** my tokens to be securely managed, **so that** my account remains protected from XSS attacks.

### Projects
- **As a** team lead, **I want to** create a project with a name and description, **so that** my team has a dedicated workspace.
- **As a** project admin, **I want to** archive completed projects, **so that** my project list stays organized.
- **As a** project member, **I want to** see only the projects I'm part of, **so that** I don't get distracted by irrelevant work.

### Members
- **As a** team lead, **I want to** invite team members by email and assign them roles, **so that** I can control who can do what.
- **As a** project admin, **I want to** promote a member to admin, **so that** they can help manage the project.
- **As a** team member, **I want to** see who else is on my project, **so that** I know who to reach out to.

### Tasks
- **As a** project admin, **I want to** create tasks with priorities and due dates, **so that** my team knows what to work on and when.
- **As a** team member, **I want to** see tasks assigned to me on a Kanban board, **so that** I can track my work visually.
- **As a** team member, **I want to** move a task to "Done" when I complete it, **so that** everyone knows it's finished.
- **As a** project admin, **I want to** see overdue tasks highlighted, **so that** I can follow up on delayed work.

### Dashboard
- **As a** team lead, **I want to** see how many tasks are in each status across all my projects, **so that** I can gauge overall team velocity.
- **As a** team lead, **I want to** see a list of overdue tasks, **so that** I can prioritize follow-ups.

---

## 6. User Flows

### Flow 1: First-Time User Onboarding

```
Landing Page → Register → Dashboard
                                    ↓
                              "Welcome! Let's get started"
                              [Create Project] CTA
                                    ↓
                              Projects Page
                              [Create Project] → Enter name
                                    ↓
                              Project Detail (Tasks tab)
                              [New Task] → Fill form → Submit
                                    ↓
                              Task appears on Kanban board
```

### Flow 2: Daily Task Update

```
Login (auto-redirect if remembered) → Dashboard
                                          ↓
                                    Click "Projects" in sidebar
                                          ↓
                                    Click project card
                                          ↓
                                    Kanban board visible
                                    Click task card / status button
                                          ↓
                                    Task status updated
                                    Board re-sorts automatically
```

### Flow 3: Inviting a New Team Member

```
Project Detail → Members tab
                      ↓
               [Invite Member] form
               Email: [____________] Role: [Admin/Member ▼]
                      ↓
               Click [Invite]
                      ↓
               Member appears in list
               (If user doesn't exist, error message shown)
```

### Flow 4: Token Refresh (Invisible to User)

```
User clicks action → API request with expired access token
                            ↓
                     Server returns 401
                            ↓
                     Axios interceptor queues request
                     Calls POST /auth/refresh with cookie
                            ↓
                     Server validates refresh token
                     Issues new access token + new cookie
                            ↓
                     Queued request replayed with new token
                     User sees result (no visible interruption)
```

---

## 7. Data Model

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    User     │       │  ProjectMember  │       │   Project   │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ id (PK)         │──────►│ id (PK)     │
│ email (UQ)  │  1:N  │ projectId (FK)  │  N:1  │ name        │
│ passwordHash│       │ userId (FK)     │       │ description │
│ name        │       │ role            │       │ status      │
│ avatarUrl   │       │ joinedAt        │       │ ownerId(FK) │
└─────────────┘       └─────────────────┘       └──────┬──────┘
       ▲                                               │
       │                                               │
       │          ┌─────────────┐                     │
       │          │    Task     │                     │
       │          ├─────────────┤                     │
       └──────────┤ id (PK)     │◄────────────────────┘
          1:N     │ title       │              1:N
                  │ description │
                  │ status      │
                  │ priority    │
                  │ dueDate     │
                  │ projectId   │
                  │ assigneeId  │
                  │ creatorId   │
                  └─────────────┘

┌───────────────┐
│ RefreshToken  │
├───────────────┤
│ id (PK)       │
│ token (UQ)    │
│ userId (FK)   │
│ expiresAt     │
└───────────────┘
```

### Key Constraints
- `ProjectMember` has a unique composite index on `(projectId, userId)`
- `Task.projectId` cascades on project deletion
- `Task.assigneeId` sets null on user deletion (task remains)
- `ProjectMember` cascades on both project and user deletion

---

## 8. Security & Compliance

### Authentication Security
- **No localStorage tokens:** Access tokens live only in application memory, making them immune to XSS extraction
- **HTTP-only refresh cookies:** Refresh tokens are inaccessible to JavaScript
- **Token rotation:** Every refresh generates a new refresh token and invalidates the old one (one-time use pattern)
- **bcrypt hashing:** Passwords hashed with cost factor 12

### Authorization Security
- **Layered RBAC:** Route-level (`authorizeProjectRole`) + action-level (`authorizeTaskUpdate`) middleware
- **Field-level restrictions:** Members can only send `status` in task update bodies; other fields are rejected
- **Ownership verification:** All project-scoped endpoints verify membership before proceeding

### Transport Security
- **CORS:** Strict origin matching with credentials
- **Helmet:** Security headers including CSP, HSTS, X-Frame-Options
- **Rate limiting:** 100 requests per 15 minutes per IP

### Data Privacy
- Users only see projects and tasks they are members of
- No email enumeration vulnerability (registration returns generic "already exists" without confirming the email is real)

---

## 9. Performance Requirements

### API Response Times
| Endpoint | Target |
|----------|--------|
| Auth endpoints | < 200ms |
| Project CRUD | < 150ms |
| Task CRUD | < 150ms |
| Dashboard stats | < 300ms |
| List endpoints | < 200ms |

### Frontend
- Time to First Contentful Paint: < 1.5s
- Client-side navigation: < 100ms
- Dashboard auto-refresh: 60 seconds (configurable)

### Database
- Prisma connection pooling enabled
- Selective field queries (no `SELECT *`)
- Indexed foreign keys and unique constraints

---

## 10. Future Roadmap

### Near Term
- [ ] Email notifications for task assignments and due dates
- [ ] Task comments / activity thread
- [ ] File attachments on tasks
- [ ] Project templates for quick project creation

### Medium Term
- [ ] Real-time updates via WebSockets
- [ ] Sub-tasks and task dependencies
- [ ] Time tracking on tasks
- [ ] Custom project fields

### Long Term
- [ ] Mobile app (React Native)
- [ ] Calendar view for tasks
- [ ] Gantt chart for project timelines
- [ ] Third-party integrations (Slack, GitHub, Google Calendar)

---

## Appendix: Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate or conflicting data |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

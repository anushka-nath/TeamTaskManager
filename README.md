# Team Task Manager

A full-stack project and task management platform built for teams. Features JWT authentication, role-based access control, Kanban boards, real-time dashboard analytics, and member collaboration — all deployed on Railway.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)](https://tailwindcss.com/)
[![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E)](https://railway.app/)

---

## Live Demo

| Service | URL |
|---------|-----|
| Web App | [https://perpetual-integrity-production-c522.up.railway.app](https://perpetual-integrity-production-c522.up.railway.app) |
| API | [https://shimmering-intuition-production-6535.up.railway.app/api/v1/health](https://shimmering-intuition-production-6535.up.railway.app/api/v1/health) |

---

## Features

### Authentication & Security
- JWT-based authentication with **access tokens** (15 min) and **refresh tokens** (7 days, HTTP-only cookie)
- Automatic silent token refresh with request queuing
- bcrypt password hashing (cost factor 12)
- Helmet security headers, CORS protection, rate limiting (100 req/15 min)

### Projects
- Create and manage projects with descriptions
- Archive / unarchive projects
- Member invitation by email with role selection
- Project-level role-based access control

### Tasks
- Create tasks with title, description, priority, due date, and assignee
- **Kanban board** with 4 columns: TODO → In Progress → Review → Done
- Drag-and-drop-like status updates via quick-action buttons
- Priority sorting (Urgent > High > Medium > Low)
- Overdue task highlighting
- Task detail page with full edit history

### Dashboard
- Real-time stat cards: Total Projects, Active Tasks, Overdue Tasks, Completed This Week
- Pie chart visualization of task status distribution (Recharts)
- Overdue tasks list sorted by priority
- Recent activity feed (auto-refreshes every 60 seconds)

### Roles & Permissions
| Role | Permissions |
|------|-------------|
| **Admin** | Full CRUD on projects, tasks, and members. Can invite, remove, and change roles. |
| **Member** | Can view projects and tasks. Can update **status only** on tasks assigned to them. |

> **Safety Guard:** A project must always retain at least one admin.

### Responsive UI
- Mobile-friendly layout with collapsible sidebar drawer
- Loading skeletons and spinners for async states
- Toast notifications for user feedback
- Empty states with actionable guidance

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Express.js** | HTTP server framework |
| **Prisma ORM** | Type-safe database access and migrations |
| **PostgreSQL** | Relational database |
| **JWT** | Access & refresh token authentication |
| **bcrypt** | Password hashing |
| **Zod** | Runtime request validation |
| **Helmet** | Security headers |
| **express-rate-limit** | API rate limiting |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **Vite 6** | Build tool and dev server |
| **React Router v7** | Client-side routing |
| **TanStack Query v5** | Server-state caching and synchronization |
| **Tailwind CSS v3** | Utility-first styling |
| **Recharts** | Data visualization charts |
| **Axios** | HTTP client with interceptors |
| **Lucide React** | Icon library |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Turborepo** | Monorepo task orchestration |
| **npm workspaces** | Workspace dependency management |
| **Docker** | Containerization |
| **Railway** | Cloud deployment and PostgreSQL hosting |

---

## Project Structure

```
team-task-manager/
├── apps/
│   ├── api/                  # Express + Prisma backend
│   │   ├── src/
│   │   │   ├── controllers/  # HTTP request handlers
│   │   │   ├── services/     # Business logic & DB queries
│   │   │   ├── routes/       # Route definitions
│   │   │   ├── middleware/   # Auth, RBAC, validation, errors
│   │   │   ├── utils/        # Prisma client, JWT, API responses
│   │   │   └── config/       # Environment validation
│   │   └── prisma/
│   │       ├── schema.prisma # Database schema
│   │       └── migrations/   # Prisma migrations
│   └── web/                  # React + Vite frontend
│       ├── src/
│       │   ├── pages/        # Route-level page components
│       │   ├── components/   # Reusable UI & feature components
│       │   ├── hooks/        # TanStack Query hooks
│       │   ├── context/      # React Context providers
│       │   └── lib/          # API client, utilities
│       └── dist/             # Production build output
├── packages/
│   └── shared/               # Shared Zod schemas & types
├── deploy/
│   └── web/                  # Static deploy bundle for Railway
├── docs/
│   ├── PRD.md                # Product Requirements Document
│   └── RAILWAY_DEPLOYMENT.md # Deployment guide
└── phases/                   # Development phase notes
```

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 20+ and npm 10+
- [Docker](https://www.docker.com/) (for local PostgreSQL)

### 1. Clone and Install

```bash
git clone <repo-url>
cd team-task-manager
npm install
```

### 2. Start Local Database

```bash
docker run -d --name ttm-postgres \
  -e POSTGRES_USER=ttm \
  -e POSTGRES_PASSWORD=ttm \
  -e POSTGRES_DB=ttm \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Configure Environment

```bash
# apps/api/.env
DATABASE_URL="postgresql://ttm:ttm@localhost:5432/ttm"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# apps/web/.env
VITE_API_URL="http://localhost:3001/api/v1"
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev
```

### 5. Start Development Servers

```bash
# From project root — starts both API and web in parallel
npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:5173

---

## API Overview

**Base URL:** `/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Login and receive tokens |
| POST | `/auth/refresh` | Rotate access token (cookie) |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Get current user profile |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/projects` | Any authenticated user |
| GET | `/projects` | Any authenticated user |
| GET | `/projects/:id` | Project member |
| PATCH | `/projects/:id` | Project admin |
| DELETE | `/projects/:id` | Project admin |
| POST | `/projects/:id/members` | Project admin |
| DELETE | `/projects/:id/members/:userId` | Project admin |
| PATCH | `/projects/:id/members/:userId` | Project admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/projects/:projectId/tasks` | Project admin |
| GET | `/projects/:projectId/tasks` | Project member |
| GET | `/projects/:projectId/tasks/:taskId` | Project member |
| PATCH | `/projects/:projectId/tasks/:taskId` | Admin / Member (own status only) |
| DELETE | `/projects/:projectId/tasks/:taskId` | Project admin |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Aggregate stats & chart data |
| GET | `/dashboard/overdue` | Overdue tasks across all projects |
| GET | `/dashboard/recent` | Recently updated tasks |

All responses follow a standardized envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [{ "field": "email", "message": "Invalid email" }]
  }
}
```

---

## Deployment

This project is configured for deployment on [Railway](https://railway.app/).

See [`docs/RAILWAY_DEPLOYMENT.md`](docs/RAILWAY_DEPLOYMENT.md) for the complete deployment guide including:
- Project and service setup
- Environment variable configuration
- API and web deployment commands
- Common issues and fixes

**Quick redeploy:**

```bash
# API
cd /path/to/project
railway up --service <API_SERVICE_ID> --detach

# Web
cd apps/web
VITE_API_URL=<production-api-url> npm run build
cd /path/to/project/deploy/web
railway up . --path-as-root --no-gitignore --detach
```

---

## Screenshots

*Dashboard showing project stats, task distribution chart, and overdue tasks*

*Kanban board with task cards across TODO, In Progress, Review, and Done columns*

*Project detail with member management and task creation*

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/PROJECT.md`](docs/PROJECT.md) | Detailed project description, user stories, and feature specifications |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, design patterns, data flow diagrams, and sequence diagrams |
| [`docs/PRD.md`](docs/PRD.md) | Original Product Requirements Document |
| [`docs/RAILWAY_DEPLOYMENT.md`](docs/RAILWAY_DEPLOYMENT.md) | Step-by-step Railway deployment guide |

---

# Architecture Overview

This document describes the high-level architecture of **redo**, a web application for managing recurring tasks.

## System Context

```
┌──────────┐       HTTPS        ┌──────────────────────────┐
│  Browser  │ ◄────────────────► │      redo application    │
│  (SPA)    │   JSON / REST      │                          │
└──────────┘                    │  ┌────────┐  ┌─────────┐ │
                                │  │Frontend│  │ Backend  │ │
                                │  │(Static)│  │ (API)    │ │
                                │  └────────┘  └────┬─────┘ │
                                │                   │        │
                                │              ┌────▼─────┐  │
                                │              │PostgreSQL │  │
                                │              └──────────┘  │
                                └──────────────────────────┘
```

The system is a single-user-per-account web application. There is no collaboration, no push notifications, and no third-party integrations in v1. The frontend is a React SPA served as static files. The backend exposes a JSON REST API and manages all persistence through PostgreSQL.

## High-Level Components

### Frontend (React SPA)

The frontend is a single-page application built with React and TypeScript, bundled by Vite.

| Layer | Responsibility |
|-------|---------------|
| **Pages** | Top-level route components. Each page composes smaller components and hooks. |
| **Components** | Reusable, presentational UI elements. No direct API calls or business logic. |
| **Hooks** | Encapsulate stateful logic, data fetching, and UI behavior (e.g., `useRedos`, `useCompleteRedo`). |
| **Services** | Thin API client layer. Every backend call goes through a service function — components never call `fetch` directly. |
| **Types** | Shared TypeScript interfaces and type aliases used across the frontend. |
| **Utils** | Pure utility functions (date formatting, interval display, etc.). |

**Key pages:**

- **Dashboard / Active list** — shows all non-archived redos, sorted by due status. Due and overdue items are prominent.
- **Redo detail** — view and edit a single redo, see its completion history, complete/skip/undo.
- **Create redo** — form for defining a new recurring task.
- **Archive** — list of archived redos with the option to unarchive.
- **Login / Register** — authentication screens.

### Backend (Node.js API)

The backend follows clean architecture with four layers. Dependencies point inward: API → Application → Domain. Infrastructure implements interfaces defined by inner layers.

```
┌─────────────────────────────────────────┐
│                API Layer                │
│  Routes, controllers, request/response  │
│  validation, authentication middleware  │
├─────────────────────────────────────────┤
│           Application Layer             │
│  Use cases: CreateRedo, CompleteRedo,   │
│  SkipRedo, UndoCompletion, EditRedo,    │
│  ArchiveRedo, ListRedos, etc.           │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  Entities: Redo, Completion, User       │
│  Value objects: Interval, Category      │
│  Business rules: due-date computation,  │
│  interval recomputation, archiving      │
├─────────────────────────────────────────┤
│          Infrastructure Layer           │
│  PostgreSQL repositories, Prisma/       │
│  Drizzle ORM, password hashing,         │
│  session/token management               │
└─────────────────────────────────────────┘
```

### Database (PostgreSQL)

#### Entity-Relationship Model

```
┌──────────┐       ┌──────────────┐       ┌──────────────────┐
│   User   │ 1───* │     Redo     │ 1───* │   Completion     │
├──────────┤       ├──────────────┤       ├──────────────────┤
│ id       │       │ id           │       │ id               │
│ email    │       │ user_id (FK) │       │ redo_id (FK)     │
│ password │       │ name         │       │ completed_at     │
│ created  │       │ description  │       │ metadata (JSONB) │
│          │       │ category     │       └──────────────────┘
│          │       │ interval_val │
│          │       │ interval_unit│
│          │       │ next_due_at  │
│          │       │ last_done_at │
│          │       │ archived     │
│          │       │ created_at   │
└──────────┘       └──────────────┘
```

Key design decisions:

- **Completion metadata** is stored as a JSONB column — free-form key-value pairs without a fixed schema.
- **Categories** are a predefined enum, not a separate table, since users cannot create or modify them.
- **`next_due_at`** is persisted (not computed on read) so that queries for due items are simple index scans.
- **`last_done_at`** is denormalized from the completions table for efficient due-date recomputation on edits and undos.

## API Design

The backend exposes a RESTful JSON API. All endpoints require authentication except registration and login.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Authenticate and receive a session/token |
| POST | `/api/auth/logout` | End the current session |
| GET | `/api/redos` | List active (non-archived) redos for the current user |
| GET | `/api/redos/archived` | List archived redos |
| POST | `/api/redos` | Create a new redo |
| GET | `/api/redos/:id` | Get a single redo with its completion history |
| PATCH | `/api/redos/:id` | Edit a redo (name, description, category, interval, archive state) |
| POST | `/api/redos/:id/complete` | Mark a redo as completed |
| POST | `/api/redos/:id/skip` | Skip the current cycle |
| DELETE | `/api/redos/:id/completions/latest` | Undo the most recent completion |

All responses follow a consistent envelope:

```json
{ "data": { ... } }
```

Errors use standard HTTP status codes with a body:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## Authentication

v1 uses session-based or token-based authentication (exact mechanism TBD). The key constraints are:

- Every request to a protected endpoint must carry a valid credential.
- The backend validates ownership on every data access — a user can never read or modify another user's redos.
- Passwords are hashed with a strong algorithm (bcrypt or argon2).

## Core Business Logic

The most important business rules live in the domain layer:

1. **Due-date computation on completion**: `next_due_at = completion_timestamp + interval`
2. **Due-date computation on skip**: `next_due_at = current_next_due_at + interval`
3. **Due-date recomputation on interval edit**: `next_due_at = reference_date + new_interval`, where `reference_date` is `last_completed_at` or `created_at`.
4. **Undo completion**: Remove the latest completion, revert `last_completed_at`, and recompute `next_due_at` from the new reference date.
5. **Archiving**: Archived redos are hidden from active views and cannot be completed or skipped. Unarchiving restores the redo without modifying any data.

All date arithmetic respects calendar semantics (e.g., adding 1 month to Jan 31 yields Feb 28/29).

## Cross-Cutting Concerns

- **Input validation**: All user input is validated at the API boundary before reaching application logic.
- **Error handling**: Domain errors (e.g., completing an archived redo) are modeled as typed errors, not exceptions, and mapped to appropriate HTTP status codes in the API layer.
- **Logging**: Structured logging for request tracing and error diagnosis.
- **Security**: OWASP best practices — parameterized queries (via ORM), CSRF protection, secure cookie settings, rate limiting on auth endpoints.

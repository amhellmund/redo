# Work Packages

This file contains the initial work packages for the redo project. Each section maps to a GitHub issue.

---

## Issue 1: Repository Skeleton — Backend and Frontend Project Setup

**Labels:** `setup`, `backend`, `frontend`

### Description

Set up the monorepo structure with working `backend/` and `frontend/` packages, including TypeScript configuration, build tooling, linting, formatting, and test frameworks. No business logic — just the skeleton that all future work builds on.

### Tasks

#### Backend (`backend/`)

- [x] Initialize `package.json` with project metadata (name: `@redo/backend`, private, license: AGPL-3.0)
- [x] Install and configure TypeScript with `strict: true` in `tsconfig.json`
- [x] Set up the directory structure: `src/domain/`, `src/application/`, `src/infrastructure/`, `src/api/`
- [x] Install and configure Vitest as the test framework; add `tests/unit/` and `tests/integration/` directories
- [x] Create a minimal Express (or Fastify) server entry point (`src/main.ts`) that starts on a configurable port and responds to `GET /health` with `{ "status": "ok" }`
- [x] Add `build`, `dev`, `test`, `lint`, and `format` scripts to `package.json`

#### Frontend (`frontend/`)

- [x] Scaffold a Vite + React + TypeScript project
- [x] Configure `tsconfig.json` with `strict: true`
- [x] Set up the directory structure: `src/components/`, `src/pages/`, `src/hooks/`, `src/services/`, `src/types/`, `src/utils/`
- [x] Install and configure Vitest + React Testing Library for unit tests
- [x] Install and configure Playwright for browser-based tests (`tests/`)
- [x] Create a minimal `App.tsx` that renders a placeholder page
- [x] Add `build`, `dev`, `test`, `test:e2e`, `lint`, and `format` scripts to `package.json`

#### Shared / Root

- [x] Add a root `package.json` with workspace configuration (npm or pnpm workspaces)
- [x] Configure ESLint at the root with `typescript-eslint`, `eslint-plugin-import`; extend in each package with package-specific plugins (`eslint-plugin-react`, `eslint-plugin-react-hooks` for frontend)
- [x] Configure Prettier at the root with a shared `.prettierrc`
- [x] Set up Husky + lint-staged for pre-commit hooks (run ESLint + Prettier on staged files)
- [x] Add a root-level `README.md` update noting how to install, build, and run both packages

### Acceptance Criteria

- [x] Running `npm install` (or `pnpm install`) at the root installs all dependencies for both packages
- [x] `npm run build` succeeds for both backend and frontend
- [x] `npm run lint` passes with zero errors and zero warnings for both packages
- [x] `npm run format -- --check` passes (all files formatted)
- [x] `npm run test` runs and passes (even if there are only placeholder tests)
- [x] The backend health endpoint responds correctly when the dev server is started
- [x] The frontend renders the placeholder page when the dev server is started
- [x] Pre-commit hook fires and blocks commits with lint/format violations

---

## Issue 2: GitHub Actions CI Pipeline

**Labels:** `ci`, `setup`

### Description

Create a GitHub Actions workflow that runs on every push and pull request. This is the quality gate — no PR merges without all checks passing.

### Tasks

- [ ] Create `.github/workflows/ci.yml`
- [ ] **Lint & Format**: Run ESLint (fail on warnings) and Prettier check for both backend and frontend
- [ ] **Type Check**: Run `tsc --noEmit` for both backend and frontend
- [ ] **Unit Tests**: Run Vitest for backend and frontend with coverage reporting
- [ ] **Build**: Verify that both backend and frontend build successfully
- [ ] **Security — Dependency Audit**: Run `npm audit` (or equivalent) and fail on high/critical vulnerabilities
- [ ] **Security — Secret Scanning**: Add a `gitleaks` step to detect accidentally committed secrets
- [ ] **Dependency Review**: Use `actions/dependency-review-action` to flag new vulnerable dependencies on PRs
- [ ] Use caching for `node_modules` to speed up CI runs
- [ ] Configure the workflow to run on `push` to `main` and on all pull requests

### Out of Scope (for now)

- Integration tests (no database yet)
- E2E / Playwright tests (no real UI yet)
- SAST scanning (CodeQL/Semgrep — add later when there is code to scan)
- Deployment

### Acceptance Criteria

- [ ] The CI workflow runs successfully on a push to `main`
- [ ] A PR with a lint violation fails the pipeline
- [ ] A PR with a TypeScript error fails the pipeline
- [ ] A PR with a failing test fails the pipeline
- [ ] `npm audit` step runs and reports results
- [ ] `gitleaks` step runs and reports results
- [ ] Dependency review step runs on PRs
- [ ] CI completes in a reasonable time (under 5 minutes for the initial skeleton)

---

## Issue 3: Domain Layer — Entities and Business Rules

**Labels:** `backend`, `domain`

### Description

Implement the core domain entities (Redo, Completion, User, Interval, Category) and all business rules as pure TypeScript with no external dependencies. This is the foundation all other layers build on.

### Tasks

- [ ] Define the `Interval` value object (value + unit) with validation (positive integer, valid unit)
- [ ] Define the `Category` type as a fixed set of predefined values (Health, Home, Vehicle, etc.)
- [ ] Define the `Completion` entity (id, redoId, completedAt, metadata as key-value pairs)
- [ ] Define the `User` entity (id, email, passwordHash, createdAt)
- [ ] Define the `Redo` entity with all attributes from the requirements (id, userId, name, description, category, interval, nextDueAt, lastCompletedAt, archived, createdAt)
- [ ] Implement due-date computation on completion: `nextDueAt = completionTimestamp + interval`
- [ ] Implement due-date computation on skip: `nextDueAt = currentNextDueAt + interval`
- [ ] Implement due-date recomputation on interval edit using the reference date rule
- [ ] Implement undo-completion logic: revert `lastCompletedAt`, recompute `nextDueAt`
- [ ] Implement archive/unarchive rules (archived redos cannot be completed or skipped)
- [ ] Ensure all date arithmetic respects calendar semantics (e.g., +1 month from Jan 31 → Feb 28/29)
- [ ] Define repository interfaces (e.g., `RedoRepository`, `CompletionRepository`, `UserRepository`) in the domain layer

### Acceptance Criteria

- [ ] All entities are implemented as plain TypeScript classes/types with no I/O or framework dependencies
- [ ] Unit tests cover: creation with defaults, completion updates due date, skip advances due date, interval edit recomputes due date, undo reverts state, archive blocks completion/skip
- [ ] Calendar edge cases are tested (month boundaries, leap years)
- [ ] All tests pass with `npm run test` in the backend package
- [ ] Test coverage on the domain layer is above 90%

---

## Issue 4: Application Layer — Use Cases

**Labels:** `backend`, `application`

### Description

Implement the application-layer use cases that orchestrate domain objects and repository interfaces. These are the entry points that the API layer will call.

### Tasks

- [ ] `CreateRedo` — validates input, creates a Redo entity, persists it
- [ ] `EditRedo` — updates allowed fields, triggers due-date recomputation if interval changed
- [ ] `CompleteRedo` — creates a Completion, updates the Redo's due date and lastCompletedAt
- [ ] `SkipRedo` — advances the Redo's due date without creating a Completion
- [ ] `UndoCompletion` — deletes the latest Completion, reverts the Redo's state
- [ ] `ArchiveRedo` / `UnarchiveRedo` — toggles the archived flag with validation
- [ ] `ListRedos` — returns active redos for a user, sorted by due status
- [ ] `ListArchivedRedos` — returns archived redos for a user
- [ ] `GetRedo` — returns a single redo with its completion history
- [ ] `RegisterUser` — validates input, hashes password, creates user
- [ ] `LoginUser` — validates credentials, returns session/token
- [ ] `LogoutUser` — invalidates session/token

### Acceptance Criteria

- [ ] Each use case has unit tests with mocked repositories
- [ ] Authorization checks are enforced (user can only access own redos)
- [ ] Domain errors (e.g., completing an archived redo) are handled gracefully, not thrown as unhandled exceptions
- [ ] All tests pass

---

## Issue 5: Infrastructure Layer — Database and Repositories

**Labels:** `backend`, `infrastructure`, `database`

### Description

Set up PostgreSQL with an ORM (Prisma or Drizzle), define the database schema, and implement the repository interfaces defined in the domain layer.

### Tasks

- [ ] Choose and install the ORM (Prisma or Drizzle)
- [ ] Define the database schema: `users`, `redos`, `completions` tables matching the ER model
- [ ] Create the initial database migration
- [ ] Implement `UserRepository` (create, findByEmail, findById)
- [ ] Implement `RedoRepository` (create, update, findById, findActiveByUser, findArchivedByUser)
- [ ] Implement `CompletionRepository` (create, delete, findByRedoId, findLatestByRedoId)
- [ ] Set up database connection configuration (env-based: `DATABASE_URL`)
- [ ] Add a Docker Compose file for local PostgreSQL development
- [ ] Write integration tests for each repository against a test database

### Acceptance Criteria

- [ ] Migrations run successfully and create the expected schema
- [ ] All repository methods are implemented and tested against a real PostgreSQL instance
- [ ] Docker Compose spins up a working PostgreSQL for local dev
- [ ] Integration tests pass in CI (using a service container or test-container)

---

## Issue 6: API Layer — REST Endpoints

**Labels:** `backend`, `api`

### Description

Implement the REST API endpoints as defined in the architecture document. The API layer is a thin adapter: validate input, call the appropriate use case, return the response.

### Tasks

- [ ] Set up Express/Fastify with JSON body parsing, CORS, and error handling middleware
- [ ] Implement authentication middleware (session or JWT-based)
- [ ] Implement all endpoints from the API design table:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/redos`
  - `GET /api/redos/archived`
  - `POST /api/redos`
  - `GET /api/redos/:id`
  - `PATCH /api/redos/:id`
  - `POST /api/redos/:id/complete`
  - `POST /api/redos/:id/skip`
  - `DELETE /api/redos/:id/completions/latest`
- [ ] Add input validation at the API boundary (request body/params validation)
- [ ] Use consistent response envelope: `{ "data": ... }` for success, `{ "error": { "code", "message" } }` for errors
- [ ] Use meaningful HTTP status codes (201 for creation, 404 for not found, 403 for forbidden, 422 for validation, etc.)
- [ ] Write integration tests for each endpoint

### Acceptance Criteria

- [ ] All endpoints are reachable and return correct response shapes
- [ ] Authentication is enforced on all protected endpoints
- [ ] Ownership checks prevent cross-user data access
- [ ] Input validation rejects malformed requests with clear error messages
- [ ] Integration tests cover happy paths and key error paths
- [ ] All tests pass

---

## Issue 7: Frontend — Authentication Pages and API Client

**Labels:** `frontend`

### Description

Implement the login and registration pages, the API client service layer, and authentication state management. This is the foundation for all other frontend work.

### Tasks

- [ ] Implement the API client service layer (`src/services/api.ts`) with typed request/response functions
- [ ] Add authentication state management (React context or equivalent)
- [ ] Build the Login page with email/password form and error handling
- [ ] Build the Registration page with email/password/confirm form and validation
- [ ] Add route protection (redirect unauthenticated users to login)
- [ ] Set up React Router for page navigation
- [ ] Add basic layout component (header with logout, main content area)

### Acceptance Criteria

- [ ] Users can register, log in, and log out
- [ ] Unauthenticated users are redirected to the login page
- [ ] Form validation provides clear feedback on invalid input
- [ ] API errors are displayed to the user
- [ ] Unit tests cover the API client and auth hooks
- [ ] Playwright test covers the login/register flow end-to-end

---

## Issue 8: Frontend — Dashboard and Redo Management

**Labels:** `frontend`

### Description

Implement the core user-facing pages: the active redo list (dashboard), redo creation, redo detail/edit, and archive view.

### Tasks

- [ ] Build the Dashboard page showing active redos sorted by due status (overdue → due → upcoming)
- [ ] Build the Create Redo page/modal with form for name, interval, description, category
- [ ] Build the Redo Detail page showing redo info, completion history, and action buttons
- [ ] Implement Complete action (with optional metadata input)
- [ ] Implement Skip action
- [ ] Implement Undo (delete latest completion)
- [ ] Implement Edit redo (name, description, category, interval)
- [ ] Implement Archive/Unarchive
- [ ] Build the Archive page listing archived redos
- [ ] Add responsive styling for phone, tablet, and desktop

### Acceptance Criteria

- [ ] All CRUD operations work end-to-end through the UI
- [ ] Due/overdue redos are visually distinct on the dashboard
- [ ] Completion with metadata works correctly
- [ ] Undo reverts the most recent completion
- [ ] Archive hides redos from the dashboard; unarchive restores them
- [ ] The UI is usable on mobile viewports
- [ ] Playwright tests cover: create redo, complete, skip, undo, archive/unarchive

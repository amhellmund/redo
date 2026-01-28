# CLAUDE.md

## Project Overview

**redo** is a web app for managing recurring tasks (oil changes, dentist visits, filter replacements, etc.). Users define a task and an interval, and redo shows what's due and lets them mark it done. Licensed under AGPL-3.0.

See `requirements.md` for the full product specification.

## Architecture

Clean architecture with clear separation of concerns:

```
redo/
├── backend/                # Node.js + TypeScript backend
│   ├── src/
│   │   ├── domain/         # Entities, value objects, business rules (no dependencies)
│   │   ├── application/    # Use cases / service layer (depends on domain only)
│   │   ├── infrastructure/ # Database, external services, repository implementations
│   │   └── api/            # HTTP controllers, routes, request/response DTOs
│   └── tests/
│       ├── unit/           # Unit tests for domain and application layers
│       └── integration/    # Integration tests for API and infrastructure
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components / routes
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client layer
│   │   ├── types/          # Shared TypeScript types
│   │   └── utils/          # Pure utility functions
│   └── tests/              # Browser-based tests (Playwright)
├── LICENSE
├── README.md
├── requirements.md
└── CLAUDE.md
```

### Clean Architecture Principles

- **Domain layer**: Pure business logic, no framework or I/O dependencies. Contains entities (Redo, Completion, User) and business rules (interval recomputation, due-date logic).
- **Application layer**: Orchestrates use cases by composing domain objects and repository interfaces. No direct DB or HTTP access.
- **Infrastructure layer**: Implements repository interfaces, database access, and external integrations.
- **API layer**: Thin HTTP adapter — validates input, calls application services, returns responses.
- **Frontend**: Components are small and focused. Business logic lives in hooks and services, not in components. API calls go through a dedicated service layer.

## Tech Stack

### Backend
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js
- **Framework**: Express or Fastify (TBD)
- **Database**: PostgreSQL
- **ORM**: Prisma or Drizzle (TBD)

### Frontend
- **Language**: TypeScript (strict mode)
- **Framework**: React 18+
- **Build tool**: Vite
- **Styling**: TBD (CSS Modules, Tailwind, or similar)

### Build System
- **Monorepo**: Single repo, separate `backend/` and `frontend/` packages
- **Build tool**: Vite for frontend bundling and dev server
- **Package manager**: npm or pnpm (TBD)

## Testing

### Backend
- **Framework**: Vitest
- **Unit tests**: Cover domain logic (interval calculations, due-date recomputation, archiving rules) and application-layer use cases with mocked repositories.
- **Integration tests**: Test API endpoints against a real (or test-container) database.
- **Coverage**: Aim for high coverage on domain and application layers.

### Frontend
- **Browser-based tests**: Playwright for end-to-end and component testing.
- **Unit tests**: Vitest + React Testing Library for hooks and utility functions.
- **Coverage**: Focus on user flows (create redo, complete, skip, undo, archive).

## Linting & Formatting

- **Linter**: ESLint with `typescript-eslint` and recommended rule sets for both backend and frontend.
- **Formatter**: Prettier with consistent config across the repo.
- **Import sorting**: `eslint-plugin-import` or equivalent.
- **React-specific**: `eslint-plugin-react`, `eslint-plugin-react-hooks`.
- **Pre-commit**: Husky + lint-staged to run linting and formatting on staged files.

## CI/CD

GitHub Actions pipeline with the following checks:

- **Lint & format**: ESLint + Prettier (fail on warnings).
- **Type check**: `tsc --noEmit` for both backend and frontend.
- **Unit tests**: Vitest for backend and frontend.
- **Integration tests**: Backend API tests with test database.
- **E2E tests**: Playwright browser tests.
- **Security**:
  - `npm audit` to check for known vulnerabilities in dependencies.
  - Secret scanning (e.g., `gitleaks` or `trufflehog`) to prevent accidental commits of passwords, API keys, or tokens.
  - SAST scanning (e.g., CodeQL or Semgrep) for code-level security issues.
- **Build**: Verify that both backend and frontend build successfully.
- **Dependency review**: Flag new dependencies with known vulnerabilities on PRs.

## Conventions

- License: GNU Affero General Public License v3 (AGPL-3.0)
- Author: Andi Hellmund (am.hellmund@gmail.com)
- Use strict TypeScript (`strict: true`) in all `tsconfig.json` files.
- Prefer `const` over `let`; never use `var`.
- Use named exports over default exports.
- Keep functions small and single-purpose.
- All API endpoints return consistent JSON response shapes.
- Use meaningful HTTP status codes.
- All user input is validated at the API boundary.

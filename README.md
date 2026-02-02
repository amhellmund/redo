# redo

App to manage recurring tasks (oil changes, dentist visits, filter replacements, etc.).

Licensed under AGPL-3.0.

## Prerequisites

- Node.js >= 20
- npm >= 10

## Setup

Install all dependencies for both backend and frontend:

```bash
npm install
```

## Scripts

All scripts can be run from the root directory:

| Command | Description |
|---------|-------------|
| `npm run build` | Build both backend and frontend |
| `npm run test` | Run tests for both packages |
| `npm run lint` | Lint both packages |
| `npm run format` | Check formatting across the repo |
| `npm run format:fix` | Fix formatting across the repo |
| `npm run dev:backend` | Start backend dev server |
| `npm run dev:frontend` | Start frontend dev server |

## Project Structure

```
redo/
├── backend/    # Node.js + Express + TypeScript
├── frontend/   # React + Vite + TypeScript
└── package.json  # Workspace root
```

See `CLAUDE.md` for architecture details and conventions.

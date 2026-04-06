# Infosys Inventory & Sales Management System

Production-focused monorepo for inventory, sales, expense accounting, reporting, audit tracking, and ML-assisted forecasting.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Current Delivery Status](#current-delivery-status)
5. [Tech Stack](#tech-stack)
6. [Quick Start (Local Development)](#quick-start-local-development)
7. [Environment Configuration](#environment-configuration)
8. [Scripts and Commands](#scripts-and-commands)
9. [API Surface](#api-surface)
10. [Roles and Access Model](#roles-and-access-model)
11. [Data Model Summary](#data-model-summary)
12. [Testing and Quality Gates](#testing-and-quality-gates)
13. [Deployment Notes](#deployment-notes)
14. [Troubleshooting](#troubleshooting)
15. [Documentation Index](#documentation-index)
16. [Contributing](#contributing)
17. [License](#license)

## Overview

This repository contains three main services:

- Frontend web application (`frontend/`) for UI and user workflows
- Backend API (`backend/`) for auth, business logic, reporting, and persistence
- ML microservice (`ml-service/`) for forecasting and predictive analytics

The system is designed for role-based business operations with auditability and operational reporting.

## Architecture

```text
Frontend (React + Vite)  --->  Backend API (Express + Prisma)  --->  PostgreSQL
                                         |                        --->  Redis
                                         |
                                         +----------------------->  ML Service (Flask)
```

### Default Local Ports

| Service | Default Port | Notes |
|---|---:|---|
| Frontend (Vite dev) | 5173 | Can change if occupied |
| Backend API | 5000 | Main REST API |
| ML service | 5001 | Flask forecasting service |
| PostgreSQL | 5432 | Docker container |
| Redis | 6379 | Docker container |
| Nginx (compose) | 80 / 443 | Reverse proxy and LB |

## Project Structure

```text
app/
  backend/
    prisma/
      schema.prisma
      migrations/
    src/
      app.js
      server.js
      controllers/
      middleware/
      routes/
      services/
      uploads/
      data/
  frontend/
    docs/
      DESIGN_SYSTEM.md
      REFACTORING_GUIDE.md
    src/
      app/
      auth/
      components/
      hooks/
      lib/
      pages/
      services/
      types/
      css/
      __tests__/
    README.md
  ml-service/
    app.py
    routes/
    services/
    config/
    trained_models/
    README.md
  docker-compose.yml
  nginx.conf
  README.md
```

## Current Delivery Status

### Completed

- Security baseline: CORS, security headers, JWT auth, role middleware
- Audit logging persisted to PostgreSQL
- Prisma migration from CSV-first flows to PostgreSQL-backed models
- Core CRUD endpoints for catalog, sales, expenses, reports, users
- Frontend component library and major page refactors (TypeScript + React Query)
- Docker compose foundation for multi-instance backend + Nginx reverse proxy

### In Progress / Remaining

- Full migration of remaining legacy frontend JSX areas (notably ML analytics path/components)
- Session/cache strategy hardening for distributed runtime
- End-to-end deployment verification for load-balanced production profile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript 5, Tailwind CSS 4, React Query 5, React Hook Form, Zod, Recharts |
| Backend | Node.js, Express 5, Prisma 5, Joi, JWT, Pino |
| Data | PostgreSQL 15, Redis 7 |
| ML | Flask, Prophet, scikit-learn |
| Infra | Docker Compose, Nginx |

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Root (optional convenience scripts)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# ML service
cd ../ml-service
pip install -r requirements.txt
```

### 2. Configure Environment

Copy from examples:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`
- `ml-service/.env.example` -> `ml-service/.env`

### 3. Start Database and Cache

```bash
docker compose up -d postgres redis
```

### 4. Run Backend Migrations

```bash
cd backend
npx prisma migrate deploy
```

### 5. Run Services (separate terminals)

```bash
# Terminal A
cd backend
npm run dev

# Terminal B
cd frontend
npm run dev

# Terminal C
cd ml-service
python app.py
```

## Environment Configuration

### Backend (`backend/.env`)

Required minimum:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/infosys_app?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_strong_random_secret
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
PORT=5000
ML_SERVICE_URL=http://localhost:5001
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_UPLOAD_BASE_URL=http://localhost:5000
```

### ML Service (`ml-service/.env`)

```env
FLASK_PORT=5001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/infosys_app
```

## Scripts and Commands

### Root Scripts

| Script | Command |
|---|---|
| Run all tests | `npm test` |
| Frontend tests | `npm run test:frontend` |
| Backend tests | `npm run test:backend` |
| Frontend coverage | `npm run test:coverage:frontend` |
| Backend coverage | `npm run test:coverage:backend` |
| Backend tests in Docker profile | `npm run test:backend:docker` |

### Backend Scripts (`backend/package.json`)

| Script | Command |
|---|---|
| Dev server | `npm run dev` |
| Production start | `npm start` |
| Unit/integration tests | `npm test` |
| Coverage | `npm run test:coverage` |
| Integration only | `npm run test:integration` |

### Frontend Scripts (`frontend/package.json`)

| Script | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview | `npm run preview` |
| Lint | `npm run lint` |
| Tests | `npm test` |
| Coverage | `npm run test:coverage` |

## API Surface

All backend routes are mounted under `/api` in `backend/src/app.js`.

### Authentication and User Admin

- `/api/auth/login`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/add-user` (owner)
- `/api/auth/update-user/:id` (owner)
- `/api/auth/delete-user/:id` (owner)
- `/api/auth/users` (owner)

### Business Entities

- `/api/products`
- `/api/sales`
- `/api/expenses`
- `/api/categories`
- `/api/brands`
- `/api/models`
- `/api/variants`
- `/api/invoices/:id`

### Reporting and Analytics

- `/api/reports/summary`
- `/api/reports/quick-stats`
- `/api/reports/low-stock`
- `/api/reports/sales-trend`
- `/api/reports/profit-trend`
- `/api/reports/expense-distribution`
- `/api/reports/export`
- `/api/reports/schedule`
- `/api/reports/schedules/*`

### ML Proxy Endpoints

- `/api/ml/predictions/summary`
- `/api/ml/predictions/forecast/:type`
- `/api/ml/predictions/train`
- `/api/ml/predictions/evaluate/:type`

### User Preferences

- `/api/users/profile`
- `/api/users/preferences/reports`
- `/api/users/:userId/preferences/reports` (owner)

## Roles and Access Model

The current role model in backend logic and schema:

- `OWNER`
- `ACCOUNTANT`
- `STAFF`

Role checks are enforced in route middleware via `backend/src/middleware/roleMiddleware.js`.

## Data Model Summary

Prisma models defined in `backend/prisma/schema.prisma` include:

- User
- Category
- Brand
- Model
- Variant
- Product
- Sale
- ExpenseCategory
- Expense
- AuditLog

Design characteristics:

- Soft delete support on major entities
- Timestamp fields for lifecycle auditing
- Foreign key relations with indexed access paths
- User-linked creation trails for operational accountability

## Testing and Quality Gates

### Recommended pre-merge checks

```bash
# Root
npm test

# Backend
cd backend
npm run test:coverage

# Frontend
cd ../frontend
npm run lint
npm run build
npm run test:coverage
```

### Coverage thresholds in config

- Backend jest threshold: 60% global branches/functions/lines/statements
- Frontend jest threshold: 50% global branches/functions/lines/statements

## Deployment Notes

### Docker Compose stack

`docker-compose.yml` defines:

- PostgreSQL
- Redis
- Nginx
- Backend instances: `backend_1`, `backend_2`, `backend_3`
- Frontend dev container
- Backend test runner profile

### Nginx behavior

`nginx.conf` currently provides:

- Upstream load balancing for backend instances
- Rate limiting (`general_limit`, `auth_limit`)
- Security headers
- `/api/` and `/uploads/` proxying to backend upstream

If you plan SPA-first production serving via Nginx root (`/`), review and adjust the current root location block for your target deployment model.

## Troubleshooting

### CORS failures in local dev

If frontend runs on 5173 while backend allows only 5174, update `backend/.env`:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Prisma engine issues in Alpine containers

The compose file sets `PRISMA_QUERY_ENGINE_LIBRARY` for linux-musl compatibility. Keep this value aligned with Prisma client output when upgrading Prisma.

### Login loop / unauthorized responses

- Confirm `JWT_SECRET` is identical for all backend instances
- Clear browser storage keys (`token`, `user`)
- Re-authenticate

### Service startup delays in compose

Backend containers install dependencies on startup (`npm install && npm start`). First boot may be slow.

## Documentation Index

- Frontend implementation guide: `frontend/README.md`
- Frontend design system: `frontend/docs/DESIGN_SYSTEM.md`
- Frontend refactor process: `frontend/docs/REFACTORING_GUIDE.md`
- Component catalog: `frontend/src/components/README.md`
- ML service guide: `ml-service/README.md`
- Deployment notes: `PHASE_6_DEPLOYMENT.md`
- Testing notes: `PHASE_7_TESTING.md`

## Contributing

1. Create a branch for your change.
2. Keep updates scoped and testable.
3. Run the quality checks relevant to changed services.
4. Open a pull request with change summary and verification notes.

## License

Internal Infosys project. All rights reserved.

---

Last updated: 2026-04-06

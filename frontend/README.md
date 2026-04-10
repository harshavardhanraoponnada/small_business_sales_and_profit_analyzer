# PhoneVerse Frontend

Production frontend for PhoneVerse business operations. This client powers inventory, products, sales, expenses, audit visibility, user administration, and ML analytics views.

This README is the final implementation guide for development, testing, and deployment of the frontend app.

## Table of Contents

1. [Overview](#overview)
2. [Core Capabilities](#core-capabilities)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Route and Access Matrix](#route-and-access-matrix)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
8. [Environment Configuration](#environment-configuration)
9. [Available Scripts](#available-scripts)
10. [Data and API Layer](#data-and-api-layer)
11. [UI System and Styling](#ui-system-and-styling)
12. [Forms and Validation](#forms-and-validation)
13. [Testing and Quality Gates](#testing-and-quality-gates)
14. [Performance and Build Notes](#performance-and-build-notes)
15. [Documentation Map](#documentation-map)
16. [Troubleshooting](#troubleshooting)
17. [Deployment](#deployment)
18. [Contribution Workflow](#contribution-workflow)

## Overview

The frontend is a React + Vite application with:

- Provider-based app bootstrap (`ThemeProvider`, `AuthProvider`, `QueryClientProvider`)
- Route-level lazy loading with protected role-aware routes
- Typed API layer using Axios + interceptors
- React Query for server state and caching
- Tailwind v4 + CSS Modules + shadcn-style primitives for consistent UI
- Jest + Testing Library for unit/integration tests

## Core Capabilities

- Dashboard KPIs, charts, and summary data
- Product and inventory management
- Sales workflows with table operations
- Expense management with categorization
- Audit log exploration (owner access)
- User management and report preference controls (owner access)
- ML forecast dashboard and model metrics
- Dark mode via class-based theme strategy

## Tech Stack

### Runtime

- React 19
- React DOM 19
- React Router DOM 7
- Axios
- Recharts
- React Hook Form
- Zod
- @tanstack/react-query
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Radix UI primitives and shadcn-style component wrappers

### Tooling

- Vite 7
- TypeScript 5 (`allowJs: true`, `strict: true`)
- ESLint 9
- Jest + ts-jest + Testing Library

## Architecture

### App Bootstrap

1. `src/main.jsx`
2. `QueryClientProvider` wraps app with shared query cache
3. `src/app/App.jsx` applies providers:
	 - `ThemeProvider`
	 - `AuthProvider`
	 - `Router`

### Routing

- Route definitions: `src/app/router.jsx`
- Route guard: `src/app/ProtectedRoute.jsx`
- Layout shell: `src/components/layout/AppLayout`
- Suspense fallback uses shared `LoadingState`

### State Boundaries

- App state: auth + theme context
- Server state: React Query hooks (`src/hooks/use*.ts`)
- Local state: page-level UI interactions (modals, filters, sorting, pagination)

## Route and Access Matrix

| Route | Access | Notes |
|---|---|---|
| `/login` | Public | Auth entry screen |
| `/` | Authenticated | Dashboard |
| `/sales` | Authenticated | Sales operations |
| `/products` | OWNER, ACCOUNTANT | Product management |
| `/inventory` | OWNER, ACCOUNTANT | Stock view and adjustments |
| `/expenses` | OWNER, ACCOUNTANT | Expense operations |
| `/audit` | OWNER | Read-only audit logs |
| `/users` | OWNER | User administration |
| `/ml-analytics` | OWNER | ML forecast and model metrics |

## Project Structure

```text
frontend/
	docs/
		DESIGN_SYSTEM.md
		REFACTORING_GUIDE.md
	src/
		app/
			App.jsx
			ProtectedRoute.jsx
			ThemeContext.tsx
			router.jsx
		auth/
			authContext.jsx
			ModernLogin.jsx
		components/
			layout/
			ui/
			shadcn/
			sales/
			products/
			expenses/
			dashboard/
			users/
			reports/
			audit/
			inventory/
		hooks/
			useProducts.ts
			useSales.ts
			useExpenses.ts
			useUsers.ts
			useAuditLogs.ts
			...
		lib/
			queryClient.ts
			formSchemas.ts
		pages/
			Dashboard.tsx
			Sales.tsx
			Products.tsx
			Expenses.tsx
			Inventory.tsx
			Audit.tsx
			Users.tsx
			MLAnalytics.jsx
		services/
			api.ts
		types/
			api.ts
			entities.ts
			ui.ts
			user.ts
		__tests__/
	package.json
	vite.config.js
	tsconfig.json
	jest.config.cjs
```

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm 10+
- Backend API running (default expected at `http://localhost:5000`)

### Install and Run

```bash
cd frontend
npm install
npm run dev
```

Vite default is `http://localhost:5173` (port may shift if occupied).

### Start Backend (separate terminal)

```bash
cd backend
npm install
npm run dev
```

## Environment Configuration

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

If omitted, frontend falls back to `http://localhost:5000/api` from `src/services/api.ts`.

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| Dev server | `npm run dev` | Start Vite dev server |
| Build | `npm run build` | Produce production bundle |
| Preview | `npm run preview` | Serve built output locally |
| Lint | `npm run lint` | Run ESLint across project |
| Test | `npm run test` | Run Jest once (watch disabled) |
| Test watch | `npm run test:watch` | Run Jest in watch mode |
| Coverage | `npm run test:coverage` | Generate coverage report |

Type-check command (no script wrapper):

```bash
npx tsc --noEmit
```

## Data and API Layer

Primary API client: `src/services/api.ts`

### Features

- Typed wrappers (`apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`)
- JWT request interceptor (`Authorization: Bearer <token>`)
- Auth failure handling:
	- clears session
	- redirects to `/login`
- Organized endpoint registry (`endpoints.*`)

### React Query Defaults

Configured in `src/lib/queryClient.ts`:

- `staleTime`: 5 minutes
- `gcTime`: 10 minutes
- `retry`: 1
- `refetchOnWindowFocus`: false

## UI System and Styling

### Styling Layers

1. Tailwind CSS v4 utility classes
2. CSS Modules for scoped page/component styles
3. shadcn-style primitives under `src/components/shadcn`
4. Shared global tokens/variables in `src/index.css`

### Dark Mode

- Class-based dark mode (`dark` class on `<html>`)
- Managed by `ThemeProvider` in `src/app/ThemeContext.tsx`
- User preference persisted in `localStorage`
- System preference fallback enabled

## Forms and Validation

Form stack:

- `react-hook-form`
- `zod`
- `@hookform/resolvers`

Reusable schemas live in `src/lib/formSchemas.ts`:

- `LoginSchema`
- `ProductSchema`
- `SaleSchema`
- `ExpenseSchema`
- `CategorySchema`
- `BrandSchema`
- `VariantSchema`
- `UserSchema`

## Testing and Quality Gates

### Test Framework

- Jest (`jest.config.cjs`)
- ts-jest transform for TypeScript
- jsdom test environment
- Testing Library and jest-dom matchers

### Coverage

- Global thresholds configured at 50% (branches/functions/lines/statements)
- Coverage command:

```bash
npm run test:coverage
```

### Recommended Local Gate

Run before merge:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test -- --watch=false
```

## Performance and Build Notes

Build optimization in `vite.config.js` includes manual chunking for:

- React ecosystem
- Query layer
- Charts
- Form libraries
- Radix primitives
- Axios

This reduces initial payload pressure and improves caching behavior across deployments.

## Documentation Map

- Design tokens and visual system: `docs/DESIGN_SYSTEM.md`
- Refactor conventions: `docs/REFACTORING_GUIDE.md`
- Component usage and structure: `src/components/README.md`
- Refactor execution checklist: `Frontend_Refactor_ToDo.md`

## Troubleshooting

### App redirects to login repeatedly

- Remove stale auth keys in browser storage (`token`, `user`)
- Re-authenticate and verify backend JWT settings

### API requests fail in local development

- Confirm backend server is running
- Confirm `VITE_API_BASE_URL` is correct
- Verify CORS configuration on backend

### Styles look broken after dependency install

- Ensure `src/index.css` imports remain intact:
	- `tailwindcss`
	- `tw-animate-css`
	- `shadcn/tailwind.css`

### Tests fail on browser API gaps

- Verify mocks in `jest.setup.cjs` (for `matchMedia`, storage APIs)

## Deployment

### Build

```bash
cd frontend
npm ci
npm run build
```

Build output: `frontend/dist/`

### Production Requirements

- Serve static `dist/` via Nginx or equivalent
- Set `VITE_API_BASE_URL` at build time for target environment
- Validate protected route behavior against real auth roles

## Contribution Workflow

1. Create a feature branch
2. Implement scoped changes
3. Run local quality gate commands
4. Open PR with:
	 - problem statement
	 - change summary
	 - screenshots for UI changes
	 - test evidence
5. Merge after review approval

---

For backend architecture and API server details, see the repository-level README and backend documentation.

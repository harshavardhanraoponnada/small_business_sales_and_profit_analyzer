# Refactoring Guide (Phase 3 Template)

This guide defines the repeatable pattern used to refactor legacy pages from JSX + inline styles + manual API calls into TypeScript + React Query + reusable UI components.

## File Conversion Process

1. Rename `.jsx` to `.tsx`.
2. Add explicit prop/state interfaces.
3. Keep component return signatures strongly typed through props and local model types.
4. Replace legacy relative imports with project aliases (`@/components`, `@/hooks`, `@/services`).

## Styling Refactor

1. Replace inline `style={{}}` with Tailwind utility classes first.
2. Add `.module.css` only for scoped layout rules or reusable local animations.
3. Keep dark mode class-based (`dark:` utilities) and read mode from `useTheme()`.
4. Remove theme object prop drilling; components read theme context directly where needed.

## Data Fetching Refactor

1. Replace `useEffect + useState + api.get/post` with React Query hooks.
2. Keep server state in hooks and page containers.
3. Keep UI state local (`useState`) only for modal visibility, filters, and pagination.
4. Invalidate list queries after mutations.

## Component Structure Pattern

Use a container + presentational split:

- Container page:
  - owns query hooks
  - owns modal/filter/pagination state
  - passes typed data/callbacks to children
- Presentational components:
  - render-only where possible
  - receive typed props
  - no direct API calls unless the component is intentionally self-contained

### Dashboard Template

- `Dashboard.tsx`: page container and data orchestration
- `DashboardStats.tsx`: KPI and quick-stat cards
- `DashboardCharts.tsx`: chart rendering and report actions

### Sales Template

- `Sales.tsx`: page container and mutation orchestration
- `SalesHeader.tsx`: add/search/refresh controls
- `SalesTable.tsx`: DataTable mapping + row actions
- `SalesModal.tsx`: modal wrapper for add/edit
- `SalesForm.tsx`: validated form with dependent selects

## State Management Rules

- Local UI state: modal open state, selected row, search term, pagination page.
- Server state: all list/detail/mutation flows through React Query.
- App-level state: `AuthContext` and `ThemeContext`.

## Error Handling Rules

1. Wrap chart-heavy sections with `ErrorBoundary`.
2. Use `ErrorState` for failed page/section fetches.
3. Use `LoadingState` for skeleton/spinner states.
4. Keep API error messages visible near user actions (forms/tables).

## Responsive Design Rules

1. Start mobile-first.
2. Use breakpoints: `sm`, `md`, `lg`, `xl`.
3. Validate at 375px, 768px, and >=1024px.
4. Data-heavy views should remain usable on mobile (stacked rows, collapsible details, or horizontal scrolling).

## Migration Checklist

- [ ] Converted to `.tsx` with typed props/state
- [ ] Removed inline styles
- [ ] Uses React Query for server data
- [ ] Uses shared UI components (`PageContainer`, `DataTable`, `Modal`, etc.)
- [ ] Handles loading/error/empty states
- [ ] Works in dark mode
- [ ] Responsive at mobile/tablet/desktop
- [ ] Build/type-check/test gates pass

## Example: Before/After Data Flow

Before:
- Component calls `api.get()` inside `useEffect`
- Mutations call `api.post()` then manually refetch

After:
- Container calls `useXxxQuery()`
- Mutations call `useCreateXxx` / `useUpdateXxx` and let query invalidation refresh data

## Validation Gate Commands

Run from `frontend/`:

```bash
npm run build
npx tsc --noEmit
npm test -- --watch=false
```

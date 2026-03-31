# Components Guide

This folder contains reusable UI building blocks for the frontend refactor.

## Structure

- `ui/`: foundational components shared across pages
- `layout/`: app shell components (header/sidebar/layout)
- `common/`: domain-level reusable components
- `dashboard/`, `expenses/`, `reports/`: feature-scoped components

## Import Patterns

Prefer barrel exports for consistency:

```ts
import { DataTable, LoadingState, PageContainer } from '@/components/ui';
import { useProducts, useForm, useFormErrors } from '@/hooks';
```

## Guidelines

- Keep component APIs typed and stable.
- Prefer Tailwind utilities and CSS Modules over inline styles.
- Use `useTheme()` for theme behavior.
- Keep data-fetching inside hooks and pass prepared props into components.

## Accessibility Baseline

- Inputs require labels and clear error messaging.
- Interactive elements must be keyboard reachable.
- Tables and pagination should preserve semantic markup.

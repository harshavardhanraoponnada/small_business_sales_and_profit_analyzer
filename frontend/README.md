# Frontend (React + Vite + TailwindCSS)

PhoneVerse frontend for inventory, sales, expenses, and analytics management.

## Stack

- React 19
- Vite 7
- TailwindCSS 4 (`@tailwindcss/vite` plugin)
- React Router 7
- Axios
- Recharts
- Framer Motion
- Lucide React

## Getting Started

From this folder:

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:5174`

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

## Styling System

This app now uses TailwindCSS v4.

- Tailwind is wired through `vite.config.js` via `@tailwindcss/vite`
- Global styles are in `src/index.css` and start with `@import "tailwindcss"`
- A custom dark variant is declared in `src/index.css`
- Shared design tokens are available in `src/styles/theme.js`

## Layout and Routing

- Route definitions live in `src/app/router.jsx`
- `AppLayout` wraps protected routes and renders shared Sidebar + Header
- Page components now render page content only (layout concerns moved out)

## Authentication UI

- Login route (`/login`) uses `src/auth/ModernLogin.jsx`
- Includes dark/light toggle and animated transitions
- Forgot/reset password flows continue to call backend auth endpoints

## Environment

The API client is configured in `src/services/api.js`.

- Base URL defaults to `http://localhost:5000/api`
- JWT token is automatically attached from `localStorage`

## Notes

- Keep frontend files in ESM format (`import`/`export`)
- Prefer Tailwind utility classes for new UI work
- Keep role-based route protection aligned with `ProtectedRoute`

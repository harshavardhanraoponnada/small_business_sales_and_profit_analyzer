# Copilot instructions

## Big picture
- This repo is a split frontend/backend app. The React + Vite client lives under frontend/ and talks to an Express API under backend/.
- The main API entry is backend/src/server.js; backend/server.js is a stray frontend `Sidebar` component, not a backend entrypoint.
- Routes are registered in backend/src/app.js.
- Most business data is stored in CSV files under backend/src/data/ and accessed via `readCSV()`/`writeCSV()` in backend/src/services/csv.service.js. Audit logs append to backend/src/data/audit_logs.csv via `logAction()` in backend/src/services/audit.service.js.
- Invoices are generated as PDFs on sale creation and written to backend/src/uploads/invoices by backend/src/services/invoice.service.js.
- There is a separate ML/prediction module planned under a Python microservice; currently being set up with Prophet/scikit-learn. Will integrate via HTTP bridge once ready.

## Backend patterns (Express, CommonJS)
- Route modules in backend/src/routes call controller methods and often chain `authMiddleware` + `roleMiddleware` + `auditLogger` (see backend/src/routes/auth.routes.js).
- Auth uses JWT from `Authorization: Bearer <token>` and sets `req.user` (backend/src/middleware/authMiddleware.js); role gating uses `roleMiddleware` (backend/src/middleware/roleMiddleware.js).
- Controllers read/write CSV files directly; keep header order stable when adding fields (see backend/src/controllers/sales.controller.js).
- Static uploads are currently served from backend/src/data via `app.use("/uploads", express.static(path.join(__dirname, "data")))` in backend/src/app.js.

## Frontend patterns (React, ESM)
- Axios API client is centralized in frontend/src/services/api.js with baseURL http://localhost:5000/api and a request interceptor that attaches the JWT from localStorage.
- Auth state is stored in localStorage and exposed by `AuthProvider` in frontend/src/auth/authContext.jsx; `ProtectedRoute` in frontend/src/app/ProtectedRoute.jsx enforces role-based access.
- App routes are declared in frontend/src/app/router.jsx; sidebar navigation reflects roles in frontend/src/components/layout/Sidebar.jsx.

## External integrations
- PDF generation uses `pdfkit` (backend/src/services/invoice.service.js).
- CSV parsing/writing uses a simple custom parser (backend/src/services/csv.service.js) even though `csv-parser` is installed.

## Developer workflows
- Backend: run from backend/ using `npm run dev` (nodemon) or `npm start` (node) per backend/package.json.
- Frontend: run from frontend/ using `npm run dev` (Vite) per frontend/package.json.

## Tips for changes
- Keep backend files CommonJS (`require`/`module.exports`); frontend uses ESM (`import`/`export`).
- When adding new API endpoints, wire them into backend/src/app.js and follow the auth/role/audit middleware pattern from backend/src/routes/auth.routes.js.
- When extending CSV-backed models, update the corresponding CSV under backend/src/data/ and the controller logic that reads/writes it.

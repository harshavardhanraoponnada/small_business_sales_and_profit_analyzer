# Frontend Refactor - Complete TODO Checklist

## PHASE 1: FOUNDATION SETUP

### 1.1 TypeScript Migration
- [ ] Create `tsconfig.json` with `"allowJs": true`
- [ ] Set `"strict": true` for new .tsx files
- [ ] Add `"skipLibCheck": true` to avoid type checking node_modules
- [ ] Install TypeScript: `npm install -D typescript@^5`
- [ ] Install type packages: `@types/react@^18`, `@types/react-dom@^18`, `@types/react-router-dom@^5`, `@types/node@^20`
- [ ] Update ESLint config (eslint.config.js) to recognize .ts/.tsx files
- [ ] Create `frontend/src/types/` directory

### 1.2 Create Type Definitions
- [ ] Create `frontend/src/types/user.ts`:
  - [ ] `User` interface (id, email, name, role, createdAt)
  - [ ] `Role` enum (ADMIN, MANAGER, USER, VIEWER)
  - [ ] `AuthState` interface
- [ ] Create `frontend/src/types/entities.ts`:
  - [ ] `Product` interface
  - [ ] `Sale` interface
  - [ ] `Expense` interface
  - [ ] `Category` interface
  - [ ] `Brand` interface
  - [ ] `Variant` interface
  - [ ] `AuditLog` interface
- [ ] Create `frontend/src/types/api.ts`:
  - [ ] `ApiResponse<T>` generic wrapper
  - [ ] `ApiError` interface
  - [ ] `PaginationParams` interface
  - [ ] `PaginatedResponse<T>` interface
- [ ] Create `frontend/src/types/ui.ts`:
  - [ ] Button variants type
  - [ ] Modal props type
  - [ ] Form field types

### 1.3 Tailwind + Dark Mode Setup
- [ ] Update `frontend/tailwind.config.js`:
  - [ ] Set `darkMode: 'class'`
  - [ ] Add CSS variable layer for colors:
    - [ ] Primary (primary-50 to primary-950)
    - [ ] Secondary
    - [ ] Success, Warning, Danger, Info
    - [ ] Neutral (gray scale)
  - [ ] Keep existing animations (fade-in-up, pulse-glow)
  - [ ] Add new animations if needed
- [ ] Update `frontend/src/index.css`:
  - [ ] Define CSS variables in `:root` and `.dark`
  - [ ] Keep existing `@layer` utilities
  - [ ] Remove component-specific styles (move to CSS Modules)
- [ ] Create `frontend/docs/DESIGN_SYSTEM.md`:
  - [ ] Document color palette (with hex/rgb)
  - [ ] Spacing scale (4px base unit)
  - [ ] Typography (font sizes, weights, line heights)
  - [ ] Shadow system
  - [ ] Border radius scale
  - [ ] Animation/transition timings

### 1.4 Install shadcn/ui
- [ ] Install shadcn/ui CLI: `npx shadcn-ui@latest init`
- [ ] Configure path: `frontend/src/components/shadcn`
- [ ] Install base components:
  - [ ] `npx shadcn-ui@latest add button`
  - [ ] `npx shadcn-ui@latest add input`
  - [ ] `npx shadcn-ui@latest add select`
  - [ ] `npx shadcn-ui@latest add dialog` (Modal)
  - [ ] `npx shadcn-ui@latest add alert`
  - [ ] `npx shadcn-ui@latest add card`
  - [ ] `npx shadcn-ui@latest add checkbox`
  - [ ] `npx shadcn-ui@latest add radio-group`
  - [ ] `npx shadcn-ui@latest add tabs`
  - [ ] `npx shadcn-ui@latest add toast` (notifications)
- [ ] Create `frontend/src/components/shadcn/README.md` with list of installed components
- [ ] Test shadcn components render correctly in a test page

### 1.5 React Query Setup
- [ ] Install: `npm install @tanstack/react-query@^5`
- [ ] Create `frontend/src/lib/queryClient.ts`:
  - [ ] Configure QueryClient with defaults (staleTime, gcTime, retry logic)
  - [ ] Set up error handling
- [ ] Update `frontend/src/main.jsx`:
  - [ ] Import QueryClient and QueryClientProvider
  - [ ] Wrap App with `<QueryClientProvider>`
- [ ] Create `frontend/src/hooks/useQuery.helpers.ts` for common patterns
- [ ] (Optional) Install React Query Devtools: `npm install -D @tanstack/react-query-devtools`

### 1.6 Refactor API Layer
- [ ] Rename `frontend/src/services/api.js` → `api.ts`
- [ ] Rewrite with TypeScript:
  - [ ] Create typed Axios instance
  - [ ] Export `ApiClient` class or factory
  - [ ] Implement request interceptor (JWT from localStorage)
  - [ ] Implement response interceptor (error handling, 401 redirect)
- [ ] Create typed endpoint helpers:
  - [ ] `endpoints.products.list()`
  - [ ] `endpoints.products.get(id)`
  - [ ] `endpoints.products.create()`
  - [ ] `endpoints.sales.list()`
  - [ ] `endpoints.sales.create()`
  - [ ] `endpoints.expenses.list()`
  - [ ] (Continue for all entity endpoints)
- [ ] Test API calls work with new layer

### 1.7 Install Form Libraries
- [ ] Install react-hook-form: `npm install react-hook-form@^7`
- [ ] Install zod: `npm install zod@^3`
- [ ] Install hook resolver: `npm install @hookform/resolvers@^3`
- [ ] Create `frontend/src/lib/formSchemas.ts` with reusable Zod schemas:
  - [ ] ProductSchema
  - [ ] SaleSchema
  - [ ] ExpenseSchema
  - [ ] UserSchema
  - [ ] LoginSchema

**PHASE 1 VERIFICATION**:
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Old .jsx files still load (allowJs working)
- [ ] Dark mode CSS variables applied
- [ ] React Query devtools visible in browser
- [ ] API calls return typed responses
- [ ] Form schemas validated successfully

---

## PHASE 2: CORE COMPONENT LIBRARY

### 2.1 Create CSS Modules Structure
- [ ] Create `frontend/src/css/` directory
- [ ] Create `layouts.module.css`:
  - [ ] `.pageContainer` − max-width, padding
  - [ ] `.mainContent` − flex layout with sidebar
  - [ ] `.gridLayout` − responsive grid classes
- [ ] Create `cards.module.css`:
  - [ ] `.card` − hover, shadow, transition
  - [ ] `.cardHeader`, `.cardBody`, `.cardFooter`
- [ ] Create `forms.module.css`:
  - [ ] `.formGroup` − margin, label styling
  - [ ] `.formError` − error message styling
  - [ ] `.inputWrapper` − input container
- [ ] Create `tables.module.css`:
  - [ ] `.table` − striped rows, hover states
  - [ ] `.tableHeader`, `.tableRow`, `.tableCell`
- [ ] Create `animations.module.css`:
  - [ ] `.fadeInUp` (migrate from index.css)
  - [ ] `.pulseGlow` (migrate from index.css)
  - [ ] `.slideIn` (new)
  - [ ] `.scaleIn` (new)

### 2.2 Create Reusable UI Components

#### Base Components (Wrappers around shadcn/ui)
- [ ] `frontend/src/components/ui/Button.tsx`:
  - [ ] Props: variant, size, loading, disabled
  - [ ] Variants: primary, secondary, outline, ghost, danger
  - [ ] Export types for reuse
- [ ] `frontend/src/components/ui/Input.tsx`:
  - [ ] Props: label, error, hint, required
  - [ ] Integrate with react-hook-form
- [ ] `frontend/src/components/ui/Select.tsx`:
  - [ ] Props: label, options, error, placeholder
  - [ ] Integrate with react-hook-form
- [ ] `frontend/src/components/ui/Modal.tsx`:
  - [ ] Props: title, isOpen, onClose, children
  - [ ] Header, Body, Footer layout
  - [ ] Wrapper around shadcn Dialog
- [ ] `frontend/src/components/ui/Card.tsx`:
  - [ ] Props: header, footer, children, variant (default, bordered, elevated)
  - [ ] Wrapper around shadcn Card with custom styling
- [ ] `frontend/src/components/ui/Alert.tsx`:
  - [ ] Props: type (success, error, warning, info), message, onClose
  - [ ] Wrapper around shadcn Alert

#### Custom State Components
- [ ] `frontend/src/components/ui/LoadingState.tsx`:
  - [ ] Props: type (skeleton, spinner, dots)
  - [ ] Skeleton variants: card, table, chart
  - [ ] Customize based on context
- [ ] `frontend/src/components/ui/EmptyState.tsx`:
  - [ ] Props: title, description, icon, action
  - [ ] Consistent empty state UI
- [ ] `frontend/src/components/ui/ErrorState.tsx`:
  - [ ] Props: title, message, onRetry
  - [ ] Error icon, retry button
- [ ] `frontend/src/components/ui/ErrorBoundary.tsx`:
  - [ ] Catch React errors
  - [ ] Display ErrorState UI
  - [ ] Log errors to console
  - [ ] Reset boundary button

#### Data Components
- [ ] `frontend/src/components/ui/DataTable.tsx`:
  - [ ] Props: columns, data, loading, error, onSort, pagination
  - [ ] Features:
    - [ ] Sortable headers
    - [ ] Pagination controls
    - [ ] Row selection (checkbox)
    - [ ] Empty state when no data
    - [ ] Loading skeleton rows
    - [ ] Responsive: stack on mobile, table on desktop
  - [ ] Responsive behavior (collapsible columns on mobile)
- [ ] `frontend/src/components/ui/Pagination.tsx`:
  - [ ] Props: currentPage, totalPages, onPageChange
  - [ ] Previous/Next buttons, page numbers
- [ ] `frontend/src/components/ui/SearchInput.tsx`:
  - [ ] Props: value, onChange, placeholder, debounceMs
  - [ ] Debounced onChange handler
  - [ ] Clear button when has value

#### Layout Components
- [ ] `frontend/src/components/ui/PageContainer.tsx`:
  - [ ] Props: children, title, description, actions
  - [ ] Consistent page padding/max-width
  - [ ] Optional header section
- [ ] `frontend/src/components/ui/PageHeader.tsx`:
  - [ ] Props: title, description, action
  - [ ] Breadcrumb support (optional)
- [ ] `frontend/src/components/ui/Tabs.tsx`:
  - [ ] Wrapper around shadcn Tabs with styling
  - [ ] Props: tabs array with label/content
- [ ] `frontend/src/components/ui/Badge.tsx`:
  - [ ] Props: label, variant (primary, secondary, success, danger, warning)
  - [ ] Size variants (sm, md)

### 2.3 Convert Layout Components to TypeScript

- [ ] `frontend/src/components/layout/AppLayout.tsx` (from AppLayout.jsx):
  - [ ] Convert to .tsx with types
  - [ ] Remove inline theme styles → use Tailwind classes
  - [ ] Use ThemeContext for dark mode toggle
  - [ ] Props: children, user
  - [ ] Render: Sidebar + Header + main outlet
  - [ ] Handle role-based menu items
  
- [ ] `frontend/src/components/layout/Sidebar.tsx` (from Sidebar.jsx):
  - [ ] Convert to .tsx with types
  - [ ] Refactor theme prop drilling → use useTheme() hook
  - [ ] Props: isOpen, onClose, user
  - [ ] Responsive: fixed desktop, drawer mobile
  - [ ] Menu items (filtered by role)
  - [ ] User section at bottom
  - [ ] Remove inline styles, use Tailwind + CSS Module
  
- [ ] `frontend/src/components/layout/Header.tsx` (from Header.jsx):
  - [ ] Convert to .tsx with types
  - [ ] Props: onMenuToggle
  - [ ] Title display
  - [ ] User menu (profile, settings, logout)
  - [ ] Dark mode toggle button
  - [ ] Responsive: hamburger on mobile
  - [ ] Remove inline styles

### 2.4 Create Theme Context (Refactor Existing)

- [ ] `frontend/src/app/ThemeContext.tsx` (from ThemeContext.jsx):
  - [ ] Add TypeScript types
  - [ ] Use Tailwind's class-based dark mode
  - [ ] Provider props: children
  - [ ] Context value:
    - [ ] `isDarkMode: boolean`
    - [ ] `toggleDarkMode: () => void`
    - [ ] `theme: Theme` (colors object)
  - [ ] Persist to localStorage
  - [ ] Apply `dark` class to `<html>` element
  - [ ] Support system preference detection via `prefers-color-scheme`

- [ ] `frontend/src/hooks/useTheme.ts` (NEW):
  - [ ] Export `useTheme()` hook
  - [ ] Return { isDarkMode, toggleDarkMode, theme }
  - [ ] Add error handling if used outside provider

### 2.5 Create React Query Hooks

- [ ] `frontend/src/hooks/useProducts.ts`:
  - [ ] `useProducts()` − fetch list with React Query
  - [ ] `useProduct(id)` − fetch single
  - [ ] `useCreateProduct()` − mutation
  - [ ] `useUpdateProduct()` − mutation
  - [ ] `useDeleteProduct()` − mutation
  - [ ] Handle loading, error states

- [ ] `frontend/src/hooks/useSales.ts`:
  - [ ] `useSales()` − fetch list
  - [ ] `useSale(id)` − fetch single
  - [ ] `useCreateSale()` − mutation
  - [ ] `useUpdateSale()` − mutation
  - [ ] `useDeleteSale()` − mutation

- [ ] `frontend/src/hooks/useExpenses.ts`:
  - [ ] `useExpenses()` − fetch list
  - [ ] `useExpense(id)` − fetch single
  - [ ] `useCreateExpense()` − mutation
  - [ ] `useUpdateExpense()` − mutation
  - [ ] `useDeleteExpense()` − mutation

- [ ] `frontend/src/hooks/useCategories.ts`:
  - [ ] `useCategories()` − fetch list
  - [ ] `useCreateCategory()` − mutation

- [ ] `frontend/src/hooks/useBrands.ts`:
  - [ ] `useBrands()` − fetch list
  - [ ] `useCreateBrand()` − mutation

- [ ] `frontend/src/hooks/useVariants.ts`:
  - [ ] `useVariants()` − fetch list
  - [ ] `useCreateVariant()` − mutation

- [ ] `frontend/src/hooks/useUsers.ts`:
  - [ ] `useUsers()` − fetch list
  - [ ] `useUser(id)` − fetch single
  - [ ] `useCreateUser()` − mutation
  - [ ] `useUpdateUser()` − mutation

- [ ] `frontend/src/hooks/useAuditLogs.ts`:
  - [ ] `useAuditLogs()` − fetch list with filters
  - [ ] Pagination support

### 2.6 Create Form Helpers

- [ ] `frontend/src/hooks/useForm.ts`:
  - [ ] Wrapper around react-hook-form
  - [ ] Props: schema, onSubmit, initialValues
  - [ ] Return: methods, handleSubmit, formState

- [ ] `frontend/src/hooks/useFormErrors.ts`:
  - [ ] Extract error messages from react-hook-form
  - [ ] Return formatted error display

### 2.7 Refactor Common Components

- [ ] `frontend/src/components/common/StatCard.tsx` (from StatCard.jsx):
  - [ ] Convert to .tsx with types
  - [ ] Remove inline styles → use Tailwind + CSS Module
  - [ ] Props: title, value, icon, trend, onClick
  - [ ] Add hover animation via CSS Module
  - [ ] Dark mode support via Tailwind classes

- [ ] `frontend/src/components/common/ReceiptRupee.tsx` (from ReceiptRupee.jsx):
  - [ ] Convert to .tsx with types
  - [ ] Simply an icon component

- [ ] `frontend/src/components/common/Loader.tsx` (from Loader.jsx):
  - [ ] Deprecate in favor of LoadingState component
  - [ ] Or refactor as simple spinner variant

### 2.8 Component Documentation

- [ ] Create `frontend/src/components/README.md`:
  - [ ] Overview of component structure
  - [ ] Import examples for each category (ui, layout, common)
  - [ ] Link to individual component docs
  - [ ] Accessibility notes

- [ ] Create individual component docs (JSDoc comments in .tsx):
  - [ ] Props interface with descriptions
  - [ ] Usage examples in comments
  - [ ] Accessibility guidelines

**PHASE 2 VERIFICATION**:
- [ ] All new components render without errors in dev server
- [ ] TypeScript compilation succeeds
- [ ] React Query hooks fetch and cache data correctly
- [ ] Dark mode toggle affects Tailwind `dark:` classes
- [ ] CSS Modules apply scoped styles
- [ ] No console errors/warnings
- [ ] Responsive layout works (test on mobile, tablet, desktop)

---

## PHASE 3: REFACTOR CORE PAGES

### 3.1 Refactor Dashboard

#### Dashboard.tsx Structure
- [ ] Convert `frontend/src/pages/Dashboard.jsx` → `Dashboard.tsx`
- [ ] Add TypeScript types:
  - [ ] DashboardProps interface
  - [ ] DashboardState type
- [ ] Replace inline theme styles with:
  - [ ] Tailwind utility classes (bg-white dark:bg-slate-950)
  - [ ] CSS Module imports (animations, transitions)
- [ ] Replace hardcoded data with React Query:
  - [ ] `useExpenses()` for expense data
  - [ ] `useSales()` for sales data
  - [ ] `useProducts()` for product stats
- [ ] Component structure:
  - [ ] Render `<PageContainer>` wrapper
  - [ ] Render `<DashboardHeader />` subcomponent
  - [ ] Render `<DashboardStats />` subcomponent
  - [ ] Render `<DashboardCharts />` subcomponent
- [ ] Error handling:
  - [ ] Wrap charts in `<ErrorBoundary>`
  - [ ] Show `<ErrorState>` on data fetch errors
  - [ ] Provide retry button

#### DashboardStats.tsx (NEW)
- [ ] Props: stats array (title, value, icon, trend)
- [ ] Render grid of `<StatCard>` components
- [ ] Responsive: 1-col mobile, 2-col tablet, 4-col desktop
- [ ] Loading state: render skeleton cards via `<LoadingState>`
- [ ] Empty state: show if no data

#### DashboardCharts.tsx (NEW)
- [ ] Props: salesData, expenseData
- [ ] Render chart components (Recharts)
- [ ] Each chart in its own `<Card>` wrapper
- [ ] Loading state: spinner via `<LoadingState>`
- [ ] Error state: `<ErrorState>` with retry
- [ ] Responsive: stack vertically on mobile

#### Dashboard.module.css (NEW)
- [ ] `.dashboard` − page container
- [ ] `.statsGrid` − grid animation on load
- [ ] `.chartContainer` − chart card styling
- [ ] Animations: fade-in, slide-in for chart containers

#### Dashboard Functional Requirements
- [ ] Fetch and display KPIs (total sales, expenses, products, categories)
- [ ] Show recent sales table (searchable, sortable)
- [ ] Show expense breakdown chart
- [ ] Show sales trend chart
- [ ] Show top products
- [ ] All data live from React Query
- [ ] Refresh on page load
- [ ] Manual refresh button

### 3.2 Refactor Sales Page

#### Sales.tsx Structure
- [ ] Convert `frontend/src/pages/Sales.jsx` → `Sales.tsx`
- [ ] Add TypeScript types
- [ ] Component structure:
  - [ ] Render `<PageContainer>` wrapper
  - [ ] Render `<SalesHeader />` (title, add button, filters)
  - [ ] Render `<SalesTable />` subcomponent
  - [ ] Render `<SalesModal />` for add/edit

#### SalesHeader.tsx (NEW)
- [ ] Props: onAddClick, onFilterChange
- [ ] Title: "Sales"
- [ ] "Add Sale" button
- [ ] Search/filter controls
- [ ] Export button

#### SalesTable.tsx (NEW)
- [ ] Props: sales array, loading, error, onEdit, onDelete, onRefresh
- [ ] Use `<DataTable>` component with:
  - [ ] Columns: Date, Customer, Product, Quantity, Price, Total, Actions
  - [ ] Sortable columns
  - [ ] Pagination (20 items per page)
  - [ ] Row actions: Edit, Delete, View Details
- [ ] Loading state: skeleton table via `<LoadingState type="table">`
- [ ] Empty state: `<EmptyState>` "No sales yet"
- [ ] Error state: `<ErrorState>` with retry
- [ ] Responsive: horizontal scroll on mobile

#### SalesForm.tsx (NEW) - Embedded in Modal
- [ ] Props: initialData?, onSubmit, onCancel
- [ ] Fields:
  - [ ] Customer name (required, text)
  - [ ] Product (required, select from useProducts)
  - [ ] Quantity (required, number)
  - [ ] Price per unit (auto-filled from product)
  - [ ] Total (read-only, calculated)
  - [ ] Notes (optional, textarea)
- [ ] Validation via Zod schema
- [ ] Error messages from react-hook-form
- [ ] Submit/Cancel buttons

#### SalesModal.tsx (NEW)
- [ ] Props: isOpen, mode (add/edit), initialData?, onClose, onSave
- [ ] Title: "Add Sale" or "Edit Sale"
- [ ] Render `<SalesForm>` inside `<Modal>`
- [ ] Handle form submission
- [ ] Call `useCreateSale()` or `useUpdateSale()` mutation
- [ ] Show loading state during submission
- [ ] Close on success, show error on failure

#### Sales.tsx Functional Requirements
- [ ] Fetch sales list via `useSales()` with React Query
- [ ] Render `<SalesTable>` with data
- [ ] Add new sale: click button → open modal → submit → invalidate query
- [ ] Edit sale: click row → open modal with data → submit → invalidate query
- [ ] Delete sale: click delete → confirm → call mutation → invalidate query
- [ ] Search/filter sales
- [ ] Sort by any column
- [ ] Pagination (20 per page)
- [ ] Export to CSV (reuse ExportButtons component)
- [ ] All live data from API

#### Sales.module.css (NEW)
- [ ] `.salesContainer` − page layout
- [ ] `.table` − table styling (if not in tables.module.css)
- [ ] Animations for modal, form validation

### 3.3 Create Refactoring Guide

- [ ] Create `frontend/docs/REFACTORING_GUIDE.md`:
  - [ ] **File Conversion Process**:
    - [ ] Step 1: Rename .jsx → .tsx
    - [ ] Step 2: Add TS types (Props, State)
    - [ ] Step 3: Add return type to component: `React.FC<Props>`
  - [ ] **Styling Refactor**:
    - [ ] Replace inline `style={{}}` with Tailwind classes
    - [ ] Create `.module.css` for complex/scoped styles
    - [ ] Reference theme via `useTheme()` hook, not props
    - [ ] Remove theme object prop drilling
  - [ ] **Data Fetching Refactor**:
    - [ ] Replace `useEffect` + `useState` + `axios` with React Query hooks
    - [ ] Example: Convert Dashboard data fetching
    - [ ] Example: Convert Sales form submission
  - [ ] **Component Structure**:
    - [ ] Split large pages into subcomponents
    - [ ] Dashboard: DashboardHeader, DashboardStats, DashboardCharts
    - [ ] Sales: SalesHeader, SalesTable, SalesForm
  - [ ] **State Management**:
    - [ ] Local state: `useState` for UI (modals, filters, form)
    - [ ] Server state: React Query hooks (data, loading, errors)
    - [ ] App state: AuthContext, ThemeContext
  - [ ] **Error Handling**:
    - [ ] Wrap data-heavy sections in `<ErrorBoundary>`
    - [ ] Use `<ErrorState>` component for visual feedback
    - [ ] Log errors to console for debugging
  - [ ] **Responsive Design**:
    - [ ] Mobile-first: start with mobile layout (xs)
    - [ ] Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
    - [ ] Test on mobile (375px), tablet (768px), desktop (1024px)
  - [ ] **Comment Examples**:
    - [ ] Code snippets for Before/After
    - [ ] Import statements for new hooks/components
  - [ ] **Checklist**:
    - [ ] ✓ Converted to .tsx with types
    - [ ] ✓ Removed inline styles
    - [ ] ✓ Using React Query for data
    - [ ] ✓ No console errors/warnings
    - [ ] ✓ Mobile responsive
    - [ ] ✓ Dark mode works
    - [ ] ✓ Error handling in place

**PHASE 3 VERIFICATION**:
- [ ] Dashboard page renders correctly with live data
- [ ] Dashboard loading skeleton shows, then data populates
- [ ] Dashboard charts responsive (stack on mobile)
- [ ] Sales page renders with sales table
- [ ] Add sale workflow: button → modal → form → submit → list updates
- [ ] Edit sale workflow: click row → modal prefilled → edit → submit → list updates
- [ ] Delete sale: click delete → confirm → removed from list
- [ ] Search/filter/sort/pagination work on Sales
- [ ] Both pages work in dark mode
- [ ] No console errors/warnings
- [ ] All API calls succeed
- [ ] REFACTORING_GUIDE.md is clear and complete

---

## PHASE 4: EXPAND REFACTORING (Use Phase 3 Template)

### 4.1 Expenses Page

- [ ] Convert `frontend/src/pages/Expenses.jsx` → `Expenses.tsx`
- [ ] Create subcomponents:
  - [ ] `ExpensesHeader.tsx` (title, add button)
  - [ ] `ExpensesTable.tsx` (data table with actions)
  - [ ] `ExpenseForm.tsx` (form for add/edit)
  - [ ] `ExpensesModal.tsx` (modal wrapper)
  - [ ] `ExpenseUpload.tsx` (file upload component)
- [ ] Use React Query hooks: `useExpenses()`, `useCreateExpense()`, `useUpdateExpense()`, `useDeleteExpense()`
- [ ] Replace hardcoded categories with `useCategories()`
- [ ] Create `Expenses.module.css` for styling
- [ ] Features:
  - [ ] List expenses with date, category, amount, description
  - [ ] Add new expense (manual or upload CSV)
  - [ ] Edit expense
  - [ ] Delete expense
  - [ ] Filter by category, date range
  - [ ] Sort by columns
- [ ] Follow REFACTORING_GUIDE.md pattern

### 4.2 Products Page

- [ ] Convert `frontend/src/pages/Products.jsx` → `Products.tsx`
- [ ] Create subcomponents:
  - [ ] `ProductsHeader.tsx` (title, add button, search)
  - [ ] `ProductsTable.tsx` (data table)
  - [ ] `ProductForm.tsx` (add/edit form)
  - [ ] `ProductsModal.tsx`
  - [ ] `ProductCard.tsx` (alternative grid view)
- [ ] Use React Query hooks: `useProducts()`, `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()`
- [ ] Replace hardcoded brands with `useBrands()`
- [ ] Replace hardcoded categories with `useCategories()`
- [ ] Features:
  - [ ] List products (table or grid view toggle)
  - [ ] Add product with name, SKU, category, brand, price, stock
  - [ ] Edit product
  - [ ] Delete product
  - [ ] Search by name/SKU
  - [ ] Filter by category, brand
  - [ ] Bulk actions (delete, export)
- [ ] Create `Products.module.css`
- [ ] Follow REFACTORING_GUIDE.md pattern

### 4.3 Inventory Page

- [ ] Convert `frontend/src/pages/Inventory.jsx` → `Inventory.tsx`
- [ ] Create subcomponents:
  - [ ] `InventoryHeader.tsx` (title, add stock button)
  - [ ] `InventoryTable.tsx` (low stock highlights)
  - [ ] `StockForm.tsx` (add/adjust stock)
  - [ ] `StockModal.tsx`
- [ ] Use React Query hooks: `useProducts()`, `useUpdateProduct()` (stock field)
- [ ] Features:
  - [ ] Display product stock levels
  - [ ] Highlight low stock items (< 10)
  - [ ] Adjust stock (add/reduce)
  - [ ] View stock history/changes
  - [ ] Reorder alerts
  - [ ] Stock level summary stats
- [ ] Create `Inventory.module.css`
- [ ] Follow REFACTORING_GUIDE.md pattern

### 4.4 Audit Page

- [ ] Convert `frontend/src/pages/Audit.jsx` → `Audit.tsx`
- [ ] Create subcomponents:
  - [ ] `AuditHeader.tsx` (title, filters)
  - [ ] `AuditTable.tsx` (read-only data table)
  - [ ] `AuditDetail.tsx` (modal for viewing full entry)
- [ ] Use React Query hook: `useAuditLogs()`
- [ ] Features:
  - [ ] Display all audit log entries
  - [ ] Columns: Timestamp, User, Action, Entity, Change, IP
  - [ ] Filter by: user, action type, date range
  - [ ] Sort by columns
  - [ ] View full change details in modal
  - [ ] Export logs to CSV
  - [ ] Read-only (no edit/delete)
- [ ] Create `Audit.module.css`
- [ ] Follow REFACTORING_GUIDE.md pattern

### 4.5 Users Page (Admin Only)

- [ ] Convert `frontend/src/pages/Users.jsx` → `Users.tsx`
- [ ] Create subcomponents:
  - [ ] `UsersHeader.tsx` (title, add user button)
  - [ ] `UsersTable.tsx` (data table)
  - [ ] `UserForm.tsx` (add/edit, with email, name, role, status)
  - [ ] `UsersModal.tsx`
- [ ] Use React Query hooks: `useUsers()`, `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`
- [ ] Role select: dropdown from Role enum
- [ ] Features:
  - [ ] List all users
  - [ ] Add user (email, name, role, status)
  - [ ] Edit user (role, status)
  - [ ] Delete/deactivate user
  - [ ] Search by name/email
  - [ ] Filter by role, status
  - [ ] Last login display
- [ ] Create `Users.module.css`
- [ ] Follow REFACTORING_GUIDE.md pattern

### 4.6 MLAnalytics Page

- [ ] Convert `frontend/src/pages/MLAnalytics.jsx` → `MLAnalytics.tsx`
- [ ] Create subcomponents:
  - [ ] `MLHeader.tsx` (title, model selector)
  - [ ] `PredictionCharts.tsx` (forecast visualization)
  - [ ] `ModelPerformance.tsx` (accuracy, RMSE metrics)
  - [ ] `PredictionTable.tsx` (forecast data table)
  - [ ] `ScheduleReportModal.tsx` (refactor existing)
- [ ] Use API for ML predictions (if available)
- [ ] Features:
  - [ ] Display sales/expense forecasts
  - [ ] Show model accuracy metrics
  - [ ] Chart: actual vs predicted
  - [ ] Confidence intervals
  - [ ] Schedule automated reports
  - [ ] Export predictions
- [ ] Refactor `MLAnalytics.css` → `MLAnalytics.module.css`
- [ ] Follow REFACTORING_GUIDE.md pattern

### 4.7 Migrate Expense Components

- [ ] `frontend/src/components/expenses/ExpenseCard.tsx`:
  - [ ] Convert to .tsx
  - [ ] Remove inline styles
  - [ ] Update styling

- [ ] `frontend/src/components/expenses/ExpenseCalendar.tsx`:
  - [ ] Convert to .tsx

- [ ] `frontend/src/components/expenses/CategoryBreakdown.tsx`:
  - [ ] Convert to .tsx
  - [ ] Use React Query data

- [ ] `frontend/src/components/expenses/MonthlyExpenseChart.tsx`:
  - [ ] Convert to .tsx
  - [ ] Use React Query data

- [ ] `frontend/src/components/expenses/CategoryCalendarToggle.tsx`:
  - [ ] Convert to .tsx

### 4.8 Migrate Report Components

- [ ] `frontend/src/components/reports/ScheduleReportModal.tsx`:
  - [ ] Convert to .tsx (if not already done in Phase 3)
  - [ ] Use shadcn/ui Modal
  - [ ] Integrate with react-hook-form

- [ ] `frontend/src/components/reports/ExportButtons.tsx`:
  - [ ] Convert to .tsx
  - [ ] Add CSV/PDF export functionality
  - [ ] Use Button components

### 4.9 Migrate Dashboard Components

- [ ] `frontend/src/components/dashboard/ExpenseAnalytics.tsx`:
  - [ ] Convert to .tsx (if not already done in Phase 3)
  - [ ] Remove inline styles
  - [ ] Use React Query for live data

**PHASE 4 VERIFICATION**:
- [ ] All pages converted to .tsx
- [ ] All pages follow Phase 3 pattern (subcomponents, hooks, styling)
- [ ] All data from React Query (no hardcoded values)
- [ ] All pages responsive (mobile → tablet → desktop)
- [ ] Dark mode works on all pages
- [ ] CRUD operations work (add, edit, delete where applicable)
- [ ] Search/filter/sort features work
- [ ] No console errors/warnings on any page
- [ ] All API integrations working

---

## PHASE 5: POLISH & OPTIMIZATION

### 5.1 Error Boundaries

- [ ] `frontend/src/components/ui/ErrorBoundary.tsx` (already created in Phase 2)
- [ ] Create wrapper component `ErrorBoundaryWrapper.tsx` with specialized messages
- [ ] Wrap all major sections in appropriate error boundaries:
  - [ ] Dashboard charts section
  - [ ] Data tables
  - [ ] Pages in router

- [ ] Update `frontend/src/app/router.tsx`:
  - [ ] Wrap each Route with `<ErrorBoundary>`
  - [ ] Or use a global error boundary at App level

### 5.2 Accessibility (WCAG 2.1 Level AA)

- [ ] Audit all components:
  - [ ] Input labels: all inputs have associated `<label>` elements
  - [ ] Form validation: error messages linked to inputs via `aria-describedby`
  - [ ] Buttons: have text (not just icons) or `aria-label`
  - [ ] Images: have `alt` text (if applicable)
  - [ ] Links: descriptive text (not "click here")
  - [ ] Modal: `role="dialog"`, focus management
  - [ ] DataTable: semantic `<table>` with `<thead>`, `<tbody>`

- [ ] Keyboard navigation:
  - [ ] Tab through all interactive elements
  - [ ] Escape to close modals
  - [ ] Enter to submit forms
  - [ ] Space to toggle checkboxes/buttons

- [ ] Color contrast:
  - [ ] Test with WCAG contrast checker
  - [ ] Ensure text meets 4.5:1 ratio (normal text)
  - [ ] Ensure UI components meet 3:1 ratio

- [ ] Screen reader testing:
  - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
  - [ ] Announcements clear and descriptive

### 5.3 Performance Optimization

- [ ] Code splitting:
  - [ ] Use React.lazy() for page components
  - [ ] Wrap with `<Suspense>` in router
  - [ ] Lazy load heavy components (charts, modals)

- [ ] Bundle analysis:
  - [ ] Run `npm run build` and check output size
  - [ ] Identify large dependencies
  - [ ] Consider alternatives if bundle > 500KB

- [ ] React Query caching:
  - [ ] Verify `staleTime` and `gcTime` settings
  - [ ] Ensure queries are invalidated correctly after mutations
  - [ ] Use `keepPreviousData: true` for smooth pagination

- [ ] Image optimization:
  - [ ] Use WebP format if available
  - [ ] Lazy load images (if any)
  - [ ] Use responsive image sizes

- [ ] Remove unused dependencies:
  - [ ] Check package.json for unused libs
  - [ ] Remove or replace as needed

### 5.4 Testing (Optional but High-Value)

- [ ] Install testing libraries:
  - [ ] `npm install -D vitest @vitest/ui`
  - [ ] `npm install -D @testing-library/react @testing-library/jest-dom`
  - [ ] `npm install -D @testing-library/user-event`

- [ ] Create test setup:
  - [ ] `frontend/src/__tests__/setup.ts` (global test config)
  - [ ] `vitest.config.ts` (vitest configuration)

- [ ] Write tests for core UI components:
  - [ ] Button.tsx test (variants, disabled, loading)
  - [ ] Input.tsx test (validation, error messages)
  - [ ] LoadingState.tsx test
  - [ ] ErrorState.tsx test
  - [ ] DataTable.tsx test (sorting, pagination)

- [ ] Write tests for core pages:
  - [ ] Dashboard.tsx test (data fetch, loading state, error state)
  - [ ] Sales.tsx test (CRUD operations, form validation)
  - [ ] Expenses.tsx test

- [ ] Write integration tests:
  - [ ] Login flow
  - [ ] Navigate between pages
  - [ ] Complete CRUD workflow on Sales page

- [ ] Set up coverage reporting:
  - [ ] Target: 80%+ coverage for core components
  - [ ] Generate coverage report: `npm run test:coverage`

- [ ] Update `package.json` scripts:
  - [ ] `"test": "vitest"` − run tests
  - [ ] `"test:ui": "vitest --ui"` − UI test runner
  - [ ] `"test:coverage": "vitest --coverage"` − coverage report

### 5.5 Documentation & Cleanup

- [ ] Update `frontend/README.md`:
  - [ ] Installation steps
  - [ ] Running dev server
  - [ ] Building for production
  - [ ] Component structure overview
  - [ ] Development guidelines (TypeScript, styling, state management)
  - [ ] Link to DESIGN_SYSTEM.md and REFACTORING_GUIDE.md

- [ ] Remove old/unused files:
  - [ ] Delete old .jsx files (keep .tsx versions)
  - [ ] Remove old CSS files (if replaced by CSS Modules)
  - [ ] Clean up `node_modules` cache

- [ ] Update `frontend/.gitignore`:
  - [ ] Add coverage/ directory
  - [ ] Add .next (if using Next.js in future)

- [ ] Create `frontend/CHANGELOG.md`:
  - [ ] Document major refactor
  - [ ] List breaking changes (if any)
  - [ ] Link to migration guide

### 5.6 Final QA

- [ ] Manual testing on real browsers:
  - [ ] Chrome/Edge (Windows)
  - [ ] Firefox (Windows)
  - [ ] Safari (Mac, if access available)
  - [ ] Mobile browsers (iOS Safari, Chrome Mobile on Android)

- [ ] Cross-browser testing:
  - [ ] Form inputs work correctly
  - [ ] Modals display properly
  - [ ] Animations run smoothly
  - [ ] No layout shifts (CLS - Cumulative Layout Shift)

- [ ] Performance profiling:
  - [ ] Run Lighthouse audit
  - [ ] Target Performance: 90+, Accessibility: 95+, Best Practices: 95+, SEO: 90+
  - [ ] Check Core Web Vitals (LCP, FID, CLS)

- [ ] Regression testing:
  - [ ] Test all CRUD operations
  - [ ] Test search/filter/sort on all tables
  - [ ] Test authentication (login/logout)
  - [ ] Test role-based access (if applicable)
  - [ ] Test all API integrations

- [ ] Final checklist:
  - [ ] No console errors/warnings
  - [ ] No TypeScript errors (`npm run build` succeeds)
  - [ ] ESLint passes (`npm run lint`, if configured)
  - [ ] All tests pass (`npm test`, if applicable)
  - [ ] Performance acceptable (LCP < 2.5s, FID < 100ms)
  - [ ] Dark mode toggle works
  - [ ] Responsive on all screen sizes

**PHASE 5 VERIFICATION**:
- [ ] Error boundaries catch and display errors gracefully
- [ ] Lighthouse score ≥90 across all categories
- [ ] WCAG audit passes (manual or automated)
- [ ] All browser/device tests pass
- [ ] All tests pass (if implemented)
- [ ] No console errors/warnings
- [ ] Production build succeeds and is deployable

---

## MISCELLANEOUS TASKS

### App-Level Updates

- [ ] Update `frontend/src/app/App.tsx`:
  - [ ] Add QueryClientProvider wrapper
  - [ ] Add ErrorBoundary wrapper
  - [ ] Ensure ThemeContext provider is in place
  - [ ] Render router

- [ ] Update `frontend/src/main.jsx`:
  - [ ] Import QueryClient and QueryClientProvider
  - [ ] Import React Query Devtools (optional)
  - [ ] Set up providers

- [ ] Update `frontend/src/app/router.tsx`:
  - [ ] Lazy load page components
  - [ ] Wrap with `<Suspense>`
  - [ ] Wrap routes with error boundaries (optional)

- [ ] Update `frontend/src/auth/authContext.tsx`:
  - [ ] Add TypeScript types
  - [ ] Ensure JWT persistence to localStorage
  - [ ] Add type-safe hooks: `useAuth()`

- [ ] Migrate `frontend/src/app/ProtectedRoute.jsx` → `ProtectedRoute.tsx`:
  - [ ] Add TypeScript types
  - [ ] Ensure role-based access control still works
  - [ ] Redirect unauthorized users to login

### Dependency Management

- [ ] Add new packages to `frontend/package.json`:
  - [ ] TypeScript packages: ✓
  - [ ] React Query: ✓
  - [ ] Form validation: ✓
  - [ ] shadcn/ui: ✓ (via init)

- [ ] Remove obsolete packages:
  - [ ] Old UI libraries (if any)
  - [ ] Unused dependencies
  - [ ] Run `npm audit` and address security issues

- [ ] Update existing packages to latest safe versions:
  - [ ] React, React-DOM
  - [ ] React Router
  - [ ] Tailwind CSS
  - [ ] Axios
  - [ ] Lucide React

### Build & Deploy Configuration

- [ ] Update `frontend/vite.config.js`:
  - [ ] Ensure TypeScript resolution is correct
  - [ ] Add any performance optimizations
  - [ ] Configure production build output

- [ ] Update `frontend/package.json` scripts:
  - [ ] `"dev": "vite"` − dev server
  - [ ] `"build": "vite build"` − production build
  - [ ] `"preview": "vite preview"` − preview production build
  - [ ] `"lint": "eslint ..."` − linting (if configured)
  - [ ] `"type-check": "tsc --noEmit"` − TypeScript check
  - [ ] `"test": "vitest"` − run tests (if applicable)

### Documentation Deliverables

- [ ] `frontend/docs/DESIGN_SYSTEM.md` ✓
- [ ] `frontend/docs/REFACTORING_GUIDE.md` ✓
- [ ] `frontend/src/components/README.md` ✓
- [ ] `frontend/README.md` (updated)
- [ ] `frontend/CHANGELOG.md` (new)
- [ ] JSDoc comments in all .tsx files

### Git & Version Control

- [ ] Create feature branch: `git checkout -b refactor/ui-modernization`
- [ ] Commit changes incrementally by phase:
  - [ ] Phase 1 setup commit
  - [ ] Phase 2 components commit
  - [ ] Phase 3 core pages commit
  - [ ] Phase 4 remaining pages commit
  - [ ] Phase 5 polish commit
- [ ] Create pull request with summary
- [ ] Code review before merge
- [ ] Merge to main branch

---

## SUMMARY CHECKLIST

### Total Tasks
- [ ] **Phase 1**: 42 tasks (Foundation)
- [ ] **Phase 2**: 58 tasks (Component Library)
- [ ] **Phase 3**: 45 tasks (Core Pages)
- [ ] **Phase 4**: 52 tasks (Expansion)
- [ ] **Phase 5**: 48 tasks (Polish)
- [ ] **Misc**: 24 tasks (App/Deps/Docs)
- [ ] **TOTAL**: ~270 tasks

### Implementation Order
1. ✅ Phase 1 (TypeScript, Tailwind, shadcn/ui, React Query, API)
2. ✅ Phase 2 (Component Library, Hooks, Context)
3. ✅ Phase 3 (Dashboard, Sales - Templates)
4. ✅ Phase 4 (Expenses, Products, Inventory, Audit, Users, MLAnalytics)
5. ✅ Phase 5 (Polish, Testing, Performance, Accessibility)
6. ✅ Miscellaneous (App updates, Docs, Git)

### Success Criteria
- ✅ All pages converted to TypeScript (.tsx)
- ✅ All styling uses Tailwind + CSS Modules (no inline styles)
- ✅ All data from React Query (no useEffect/axios)
- ✅ Dark mode works on all pages
- ✅ Responsive design (mobile-first)
- ✅ Error boundaries in place
- ✅ No console errors/warnings
- ✅ TypeScript compilation succeeds
- ✅ Lighthouse score ≥90
- ✅ WCAG 2.1 Level AA compliant

---

**REFACTOR STARTED**: [Timestamp]  
**ESTIMATED DURATION**: 18–22 hours (solo execution)  
**STATUS**: Ready for Phase 1 Implementation

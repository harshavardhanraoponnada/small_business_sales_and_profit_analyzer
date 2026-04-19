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

## PHASE 2: CORE COMPONENT LIBRARY ✅ COMPLETED

### 2.1 Create CSS Modules Structure ✅
- [x] Create `frontend/src/css/` directory
- [x] Create `layouts.module.css`:
  - [x] `.pageContainer` − max-width, padding
  - [x] `.mainContent` − flex layout with sidebar
  - [x] `.gridLayout` − responsive grid classes
- [x] Create `cards.module.css`:
  - [x] `.card` − hover, shadow, transition
  - [x] `.cardHeader`, `.cardBody`, `.cardFooter`
- [x] Create `forms.module.css`:
  - [x] `.formGroup` − margin, label styling
  - [x] `.formError` − error message styling
  - [x] `.inputWrapper` − input container
- [x] Create `tables.module.css`:
  - [x] `.table` − striped rows, hover states
  - [x] `.tableHeader`, `.tableRow`, `.tableCell`
- [x] Create `animations.module.css`:
  - [x] `.fadeInUp` (migrate from index.css)
  - [x] `.pulseGlow` (migrate from index.css)
  - [x] `.slideIn` (new)
  - [x] `.scaleIn` (new)

### 2.2 Create Reusable UI Components

#### Base Components (Wrappers around shadcn/ui)
- [x] `frontend/src/components/ui/Button.tsx`:
  - [x] Props: variant, size, loading, disabled
  - [x] Variants: primary, secondary, outline, ghost, danger
  - [x] Export types for reuse
- [x] `frontend/src/components/ui/Input.tsx`:
  - [x] Props: label, error, hint, required
  - [x] Integrate with react-hook-form
- [x] `frontend/src/components/ui/Select.tsx`:
  - [x] Props: label, options, error, placeholder
  - [x] Integrate with react-hook-form
- [x] `frontend/src/components/ui/Modal.tsx`:
  - [x] Props: title, isOpen, onClose, children
  - [x] Header, Body, Footer layout
  - [x] Wrapper around shadcn Dialog
- [x] `frontend/src/components/ui/Card.tsx`:
  - [x] Props: header, footer, children, variant (default, bordered, elevated)
  - [x] Wrapper around shadcn Card with custom styling
- [x] `frontend/src/components/ui/Alert.tsx`:
  - [x] Props: type (success, error, warning, info), message, onClose
  - [x] Wrapper around shadcn Alert

#### Custom State Components
- [x] `frontend/src/components/ui/LoadingState.tsx`:
  - [x] Props: type (skeleton, spinner, dots)
  - [x] Skeleton variants: card, table, chart
  - [x] Customize based on context
- [x] `frontend/src/components/ui/EmptyState.tsx`:
  - [x] Props: title, description, icon, action
  - [x] Consistent empty state UI
- [x] `frontend/src/components/ui/ErrorState.tsx`:
  - [x] Props: title, message, onRetry
  - [x] Error icon, retry button
- [x] `frontend/src/components/ui/ErrorBoundary.tsx`:
  - [x] Catch React errors
  - [x] Display ErrorState UI
  - [x] Log errors to console
  - [x] Reset boundary button

#### Data Components
- [x] `frontend/src/components/ui/DataTable.tsx`:
  - [x] Props: columns, data, loading, error, onSort, pagination
  - [x] Features:
    - [x] Sortable headers
    - [x] Pagination controls
    - [x] Row selection (checkbox)
    - [x] Empty state when no data
    - [x] Loading skeleton rows
    - [x] Responsive: stack on mobile, table on desktop
  - [x] Responsive behavior (collapsible columns on mobile)
- [x] `frontend/src/components/ui/Pagination.tsx`:
  - [x] Props: currentPage, totalPages, onPageChange
  - [x] Previous/Next buttons, page numbers
- [x] `frontend/src/components/ui/SearchInput.tsx`:
  - [x] Props: value, onChange, placeholder, debounceMs
  - [x] Debounced onChange handler
  - [x] Clear button when has value

#### Layout Components
- [x] `frontend/src/components/ui/PageContainer.tsx`:
  - [x] Props: children, title, description, actions
  - [x] Consistent page padding/max-width
  - [x] Optional header section
- [x] `frontend/src/components/ui/PageHeader.tsx`:
  - [x] Props: title, description, action
  - [x] Breadcrumb support (optional)
- [x] `frontend/src/components/ui/Tabs.tsx`:
  - [x] Wrapper around shadcn Tabs with styling
  - [x] Props: tabs array with label/content
- [x] `frontend/src/components/ui/Badge.tsx`:
  - [x] Props: label, variant (primary, secondary, success, danger, warning)
  - [x] Size variants (sm, md)

### 2.3 Convert Layout Components to TypeScript ✅

- [x] `frontend/src/components/layout/AppLayout.tsx` (from AppLayout.jsx):
  - [x] Convert to .tsx with types
  - [x] Remove inline theme styles → use Tailwind classes
  - [x] Use ThemeContext for dark mode toggle
  - [x] Props: children, user
  - [x] Render: Sidebar + Header + main outlet
  - [x] Handle role-based menu items
  
- [x] `frontend/src/components/layout/Sidebar.tsx` (from Sidebar.jsx):
  - [x] Convert to .tsx with types
  - [x] Refactor theme prop drilling → use useTheme() hook
  - [x] Props: isOpen, onClose, user
  - [x] Responsive: fixed desktop, drawer mobile
  - [x] Menu items (filtered by role)
  - [x] User section at bottom
  - [x] Remove inline styles, use Tailwind + CSS Module
  
- [x] `frontend/src/components/layout/Header.tsx` (from Header.jsx):
  - [x] Convert to .tsx with types
  - [x] Props: onMenuToggle
  - [x] Title display
  - [x] User menu (profile, settings, logout)
  - [x] Dark mode toggle button
  - [x] Responsive: hamburger on mobile
  - [x] Remove inline styles

### 2.4 Create Theme Context (Refactor Existing) ✅

- [x] `frontend/src/app/ThemeContext.tsx` (from ThemeContext.jsx):
  - [x] Add TypeScript types
  - [x] Use Tailwind's class-based dark mode
  - [x] Provider props: children
  - [x] Context value:
    - [x] `isDarkMode: boolean`
    - [x] `toggleDarkMode: () => void`
    - [x] `theme: Theme` (colors object)
  - [x] Persist to localStorage
  - [x] Apply `dark` class to `<html>` element
  - [x] Support system preference detection via `prefers-color-scheme`

- [x] `frontend/src/hooks/useTheme.ts` (NEW):
  - [x] Export `useTheme()` hook
  - [x] Return { isDarkMode, toggleDarkMode, theme }
  - [x] Add error handling if used outside provider

### 2.5 Create React Query Hooks ✅

- [x] `frontend/src/hooks/useProducts.ts`:
  - [x] `useProducts()` − fetch list with React Query
  - [x] `useProduct(id)` − fetch single
  - [x] `useCreateProduct()` − mutation
  - [x] `useUpdateProduct()` − mutation
  - [x] `useDeleteProduct()` − mutation
  - [x] Handle loading, error states

- [x] `frontend/src/hooks/useSales.ts`:
  - [x] `useSales()` − fetch list
  - [x] `useSale(id)` − fetch single
  - [x] `useCreateSale()` − mutation
  - [x] `useUpdateSale()` − mutation
  - [x] `useDeleteSale()` − mutation

- [x] `frontend/src/hooks/useExpenses.ts`:
  - [x] `useExpenses()` − fetch list
  - [x] `useExpense(id)` − fetch single
  - [x] `useCreateExpense()` − mutation
  - [x] `useUpdateExpense()` − mutation
  - [x] `useDeleteExpense()` − mutation

- [x] `frontend/src/hooks/useCategories.ts`:
  - [x] `useCategories()` − fetch list
  - [x] `useCreateCategory()` − mutation

- [x] `frontend/src/hooks/useBrands.ts`:
  - [x] `useBrands()` − fetch list
  - [x] `useCreateBrand()` − mutation

- [x] `frontend/src/hooks/useVariants.ts`:
  - [x] `useVariants()` − fetch list
  - [x] `useCreateVariant()` − mutation

- [x] `frontend/src/hooks/useUsers.ts`:
  - [x] `useUsers()` − fetch list
  - [x] `useUser(id)` − fetch single
  - [x] `useCreateUser()` − mutation
  - [x] `useUpdateUser()` − mutation

- [x] `frontend/src/hooks/useAuditLogs.ts`:
  - [x] `useAuditLogs()` − fetch list with filters
  - [x] Pagination support

### 2.6 Create Form Helpers ✅

- [x] `frontend/src/hooks/useForm.ts`:
  - [x] Wrapper around react-hook-form
  - [x] Props: schema, onSubmit, initialValues
  - [x] Return: methods, handleSubmit, formState

- [x] `frontend/src/hooks/useFormErrors.ts`:
  - [x] Extract error messages from react-hook-form
  - [x] Return formatted error display

### 2.7 Refactor Common Components ✅

- [x] `frontend/src/components/common/StatCard.tsx` (from StatCard.jsx):
  - [x] Convert to .tsx with types
  - [x] Remove inline styles → use Tailwind + CSS Module
  - [x] Props: title, value, icon, trend, onClick
  - [x] Add hover animation via CSS Module
  - [x] Dark mode support via Tailwind classes

- [x] `frontend/src/components/common/ReceiptRupee.tsx` (from ReceiptRupee.jsx):
  - [x] Convert to .tsx with types
  - [x] Simply an icon component

- [x] `frontend/src/components/common/Loader.tsx` (from Loader.jsx):
  - [x] Deprecate in favor of LoadingState component
  - [x] Or refactor as simple spinner variant

### 2.8 Component Documentation ✅

- [x] Create `frontend/src/components/README.md`:
  - [x] Overview of component structure
  - [x] Import examples for each category (ui, layout, common)
  - [x] Link to individual component docs
  - [x] Accessibility notes

- [x] Create individual component docs (JSDoc comments in .tsx):
  - [x] Props interface with descriptions
  - [x] Usage examples in comments
  - [x] Accessibility guidelines

**PHASE 2 VERIFICATION** ✅:
- [x] All new components render without errors in dev server
- [x] TypeScript compilation succeeds ✓ (build 29.78s)
- [x] React Query hooks fetch and cache data correctly ✓ (tests pass)
- [x] Dark mode toggle affects Tailwind `dark:` classes ✓ 
- [x] CSS Modules apply scoped styles ✓
- [x] No console errors/warnings ✓
- [x] Responsive layout works (test on mobile, tablet, desktop) ✓

---

## PHASE 3: REFACTOR CORE PAGES

### 3.1 Refactor Dashboard

#### Dashboard.tsx Structure
- [x] Convert `frontend/src/pages/Dashboard.jsx` → `Dashboard.tsx`
- [x] Add TypeScript types:
  - [x] DashboardProps interface
  - [x] DashboardState type
- [x] Replace inline theme styles with:
  - [x] Tailwind utility classes (bg-white dark:bg-slate-950)
  - [x] CSS Module imports (animations, transitions)
- [x] Replace hardcoded data with React Query:
  - [x] `useExpenses()` for expense data
  - [x] `useSales()` for sales data
  - [x] `useProducts()` for product stats
- [x] Component structure:
  - [x] Render `<PageContainer>` wrapper
  - [x] Render `<DashboardHeader />` subcomponent
  - [x] Render `<DashboardStats />` subcomponent
  - [x] Render `<DashboardCharts />` subcomponent
- [x] Error handling:
  - [x] Wrap charts in `<ErrorBoundary>`
  - [x] Show `<ErrorState>` on data fetch errors
  - [x] Provide retry button

#### DashboardStats.tsx (NEW)
- [x] Props: stats array (title, value, icon, trend)
- [x] Render grid of `<StatCard>` components
- [x] Responsive: 1-col mobile, 2-col tablet, 4-col desktop
- [x] Loading state: render skeleton cards via `<LoadingState>`
- [x] Empty state: show if no data

#### DashboardCharts.tsx (NEW)
- [x] Props: salesData, expenseData
- [x] Render chart components (Recharts)
- [x] Each chart in its own `<Card>` wrapper
- [x] Loading state: spinner via `<LoadingState>`
- [x] Error state: `<ErrorState>` with retry
- [x] Responsive: stack vertically on mobile

#### Dashboard.module.css (NEW)
- [x] Create `frontend/src/pages/Dashboard.module.css`
- [x] `.dashboard` − page container
- [x] `.statsGrid` − grid animation on load
- [x] `.chartContainer` − chart card styling
- [x] Animations: fade-in, slide-in for chart containers

#### Dashboard Functional Requirements
- [x] Fetch and display KPIs (total sales, expenses, products, categories)
- [x] Show recent sales table (searchable, sortable)
- [x] Show expense breakdown chart
- [x] Show sales trend chart
- [x] Show top products
- [x] All data live from React Query
- [x] Refresh on page load
- [x] Manual refresh button

### 3.2 Refactor Sales Page

#### Sales.tsx Structure
- [x] Convert `frontend/src/pages/Sales.jsx` → `Sales.tsx`
- [x] Add TypeScript types
- [x] Component structure:
  - [x] Render `<PageContainer>` wrapper
  - [x] Render `<SalesHeader />` (title, add button, filters)
  - [x] Render `<SalesTable />` subcomponent
  - [x] Render `<SalesModal />` for add/edit

#### SalesHeader.tsx (NEW)
- [x] Props: onAddClick, onFilterChange
- [x] Title: "Sales"
- [x] "Add Sale" button
- [x] Search/filter controls
- [x] Export button

#### SalesTable.tsx (NEW)
- [x] Props: sales array, loading, error, onEdit, onDelete, onRefresh
- [x] Use `<DataTable>` component with:
  - [x] Columns: Date, Customer, Product, Quantity, Price, Total, Actions
  - [x] Sortable columns
  - [x] Pagination (20 items per page)
  - [x] Row actions: Edit, Delete, View Details
- [x] Loading state: skeleton table via `<LoadingState type="table">`
- [x] Empty state: `<EmptyState>` "No sales yet"
- [x] Error state: `<ErrorState>` with retry
- [x] Responsive: horizontal scroll on mobile

#### SalesForm.tsx (NEW) - Embedded in Modal
- [x] Props: initialData?, onSubmit, onCancel
- [x] Fields:
  - [x] Customer name (required, text)
  - [x] Product (required, select from useProducts)
  - [x] Quantity (required, number)
  - [x] Price per unit (auto-filled from product)
  - [x] Total (read-only, calculated)
  - [x] Notes (optional, textarea)
- [x] Validation via Zod schema
- [x] Error messages from react-hook-form
- [x] Submit/Cancel buttons

#### SalesModal.tsx (NEW)
- [x] Props: isOpen, mode (add/edit), initialData?, onClose, onSave
- [x] Title: "Add Sale" or "Edit Sale"
- [x] Render `<SalesForm>` inside `<Modal>`
- [x] Handle form submission
- [x] Call `useCreateSale()` or `useUpdateSale()` mutation
- [x] Show loading state during submission
- [x] Close on success, show error on failure

#### Sales.tsx Functional Requirements
- [x] Fetch sales list via `useSales()` with React Query
- [x] Render `<SalesTable>` with data
- [x] Add new sale: click button → open modal → submit → invalidate query
- [x] Edit sale: click row → open modal with data → submit → invalidate query
- [x] Delete sale: click delete → confirm → call mutation → invalidate query
- [x] Search/filter sales
- [x] Sort by any column
- [x] Pagination (20 per page)
- [x] Export to CSV (reuse ExportButtons component)
- [x] All live data from API

#### Sales.module.css (NEW)
- [x] `.salesContainer` − page layout
- [x] `.table` − table styling (if not in tables.module.css)
- [x] Animations for modal, form validation

### 3.3 Create Refactoring Guide

- [x] Create `frontend/docs/REFACTORING_GUIDE.md`:
  - [x] **File Conversion Process**:
    - [x] Step 1: Rename .jsx → .tsx
    - [x] Step 2: Add TS types (Props, State)
    - [x] Step 3: Add return type to component: `React.FC<Props>`
  - [x] **Styling Refactor**:
    - [x] Replace inline `style={{}}` with Tailwind classes
    - [x] Create `.module.css` for complex/scoped styles
    - [x] Reference theme via `useTheme()` hook, not props
    - [x] Remove theme object prop drilling
  - [x] **Data Fetching Refactor**:
    - [x] Replace `useEffect` + `useState` + `axios` with React Query hooks
    - [x] Example: Convert Dashboard data fetching
    - [x] Example: Convert Sales form submission
  - [x] **Component Structure**:
    - [x] Split large pages into subcomponents
    - [x] Dashboard: DashboardHeader, DashboardStats, DashboardCharts
    - [x] Sales: SalesHeader, SalesTable, SalesForm
  - [x] **State Management**:
    - [x] Local state: `useState` for UI (modals, filters, form)
    - [x] Server state: React Query hooks (data, loading, errors)
    - [x] App state: AuthContext, ThemeContext
  - [x] **Error Handling**:
    - [x] Wrap data-heavy sections in `<ErrorBoundary>`
    - [x] Use `<ErrorState>` component for visual feedback
    - [x] Log errors to console for debugging
  - [x] **Responsive Design**:
    - [x] Mobile-first: start with mobile layout (xs)
    - [x] Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`
    - [x] Test on mobile (375px), tablet (768px), desktop (1024px)
  - [x] **Comment Examples**:
    - [x] Code snippets for Before/After
    - [x] Import statements for new hooks/components
  - [x] **Checklist**:
    - [x] ✓ Converted to .tsx with types
    - [x] ✓ Removed inline styles
    - [x] ✓ Using React Query for data
    - [x] ✓ No console errors/warnings
    - [x] ✓ Mobile responsive
    - [x] ✓ Dark mode works
    - [x] ✓ Error handling in place

**PHASE 3 VERIFICATION**:
- [x] Dashboard page renders correctly with live data
- [x] Dashboard loading skeleton shows, then data populates
- [x] Dashboard charts responsive (stack on mobile)
- [x] Sales page renders with sales table
- [x] Add sale workflow: button → modal → form → submit → list updates
- [x] Edit sale workflow: click row → modal prefilled → edit → submit → list updates
- [x] Delete sale: click delete → confirm → removed from list
- [x] Search/filter/sort/pagination work on Sales
- [x] Both pages work in dark mode
- [x] No console errors/warnings
- [x] All API calls succeed
- [x] REFACTORING_GUIDE.md is clear and complete

---

## PHASE 4: EXPAND REFACTORING (Use Phase 3 Template)

### 4.1 Expenses Page

- [x] Convert `frontend/src/pages/Expenses.jsx` → `Expenses.tsx`
- [x] Create subcomponents:
  - [x] `ExpensesHeader.tsx` (title, add button)
  - [x] `ExpensesTable.tsx` (data table with actions)
  - [x] `ExpenseForm.tsx` (form for add/edit)
  - [x] `ExpensesModal.tsx` (modal wrapper)
  - [x] `ExpenseUpload.tsx` (file upload component)
- [x] Use React Query hooks: `useExpenses()`, `useCreateExpense()`, `useUpdateExpense()`, `useDeleteExpense()`
- [x] Replace hardcoded categories with `useCategories()`
- [x] Create `Expenses.module.css` for styling
- [x] Features:
  - [x] List expenses with date, category, amount, description
  - [x] Add new expense (manual or receipt upload)
  - [x] Edit expense
  - [x] Delete expense
  - [x] Filter by category, date range
  - [x] Sort by columns
- [x] Follow REFACTORING_GUIDE.md pattern

### 4.2 Products Page

- [x] Convert `frontend/src/pages/Products.jsx` → `Products.tsx`
- [x] Create subcomponents:
  - [x] `ProductsHeader.tsx` (title, add button, search)
  - [x] `ProductsTable.tsx` (data table)
  - [x] `ProductForm.tsx` (add/edit form)
  - [x] `ProductsModal.tsx`
  - [x] `ProductCard.tsx` (alternative grid view)
- [x] Use React Query hooks: `useProducts()`, `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()`
- [x] Replace hardcoded brands with `useBrands()`
- [x] Replace hardcoded categories with `useCategories()`
- [ ] Features:
  - [x] List products (table or grid view toggle)
  - [x] Add product with name, SKU, category, brand, price, stock
  - [x] Edit product
  - [x] Delete product
  - [x] Search by name/SKU
  - [x] Filter by category, brand
  - [x] Bulk actions (delete, export)
- [x] Create `Products.module.css`
- [x] Follow REFACTORING_GUIDE.md pattern

### 4.3 Inventory Page

- [x] Convert `frontend/src/pages/Inventory.jsx` → `Inventory.tsx`
- [x] Create subcomponents:
  - [x] `InventoryHeader.tsx` (title, add stock button)
  - [x] `InventoryTable.tsx` (low stock highlights)
  - [x] `StockForm.tsx` (add/adjust stock)
  - [x] `StockModal.tsx`
- [x] Use React Query hooks: `useProducts()`, `useUpdateProduct()` (stock field)
- [x] Features:
  - [x] Display product stock levels
  - [x] Highlight low stock items (< 10)
  - [x] Adjust stock (add/reduce)
  - [x] View stock history/changes
  - [x] Reorder alerts
  - [x] Stock level summary stats
- [x] Create `Inventory.module.css`
- [x] Follow REFACTORING_GUIDE.md pattern

### 4.4 Audit Page

- [x] Convert `frontend/src/pages/Audit.jsx` → `Audit.tsx`
- [x] Create subcomponents:
  - [x] `AuditHeader.tsx` (title, filters)
  - [x] `AuditTable.tsx` (read-only data table)
  - [x] `AuditDetail.tsx` (modal for viewing full entry)
- [x] Use React Query hook: `useAuditLogs()`
- [x] Features:
  - [x] Display all audit log entries
  - [x] Columns: Timestamp, User, Action, Entity, Change, IP
  - [x] Filter by: user, action type, date range
  - [x] Sort by columns
  - [x] View full change details in modal
  - [x] Export logs to CSV
  - [x] Read-only (no edit/delete)
- [x] Create `Audit.module.css`
- [x] Follow REFACTORING_GUIDE.md pattern

### 4.5 Users Page (Admin Only)

- [x] Convert `frontend/src/pages/Users.jsx` → `Users.tsx`
- [x] Create subcomponents:
  - [x] `UsersHeader.tsx` (title, add user button)
  - [x] `UsersTable.tsx` (data table)
  - [x] `UserForm.tsx` (add/edit, with email, name, role, status)
  - [x] `UsersModal.tsx`
- [x] Use React Query hooks: `useUsers()`, `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`
- [x] Role select: dropdown from Role enum
- [x] Features:
  - [x] List all users
  - [x] Add user (email, name, role, status)
  - [x] Edit user (role, status)
  - [x] Delete/deactivate user
  - [x] Search by name/email
  - [x] Filter by role, status
  - [x] Last login display
  - [x] Per-user automated report email preferences (enable toggle, frequency, format)
  - [x] Configurable send time (HH:MM) for automated report emails
  - [x] Configurable weekday for weekly automated reports
  - [x] Owner-only updates for automated report preferences
- [x] Create `Users.module.css`
- [x] Follow REFACTORING_GUIDE.md pattern

### 4.6 MLAnalytics Page

- [x] Convert `frontend/src/pages/MLAnalytics.jsx` → `MLAnalytics.tsx`
- [x] Create subcomponents:
  - [x] `MLHeader.tsx` (title, model selector)
  - [x] `PredictionCharts.tsx` (forecast visualization)
  - [x] `ModelPerformance.tsx` (accuracy, RMSE metrics)
  - [x] `PredictionTable.tsx` (forecast data table)
  - [x] `ScheduleReportModal.tsx` (refactor existing)
- [x] Use API for ML predictions (if available)
- [x] Features:
  - [x] Display sales/expense forecasts
  - [x] Show model accuracy metrics
  - [x] Chart: actual vs predicted
  - [x] Confidence intervals
  - [x] Schedule automated reports
  - [x] Export predictions
- [x] Refactor `MLAnalytics.css` → `MLAnalytics.module.css`
- [x] Follow REFACTORING_GUIDE.md pattern

### 4.7 Migrate Expense Components

- [x] `frontend/src/components/expenses/ExpenseCard.tsx`:
  - [x] Convert to .tsx
  - [x] Remove inline styles
  - [x] Update styling

- [x] `frontend/src/components/expenses/ExpenseCalendar.tsx`:
  - [x] Convert to .tsx

- [x] `frontend/src/components/expenses/CategoryBreakdown.tsx`:
  - [x] Convert to .tsx
  - [x] Use React Query data

- [x] `frontend/src/components/expenses/MonthlyExpenseChart.tsx`:
  - [x] Convert to .tsx
  - [x] Use React Query data

- [x] `frontend/src/components/expenses/CategoryCalendarToggle.tsx`:
  - [x] Convert to .tsx

### 4.8 Migrate Report Components

- [x] `frontend/src/components/reports/ScheduleReportModal.tsx`:
  - [x] Convert to .tsx (if not already done in Phase 3)
  - [x] Use shadcn/ui Modal
  - [x] Integrate with react-hook-form

- [x] `frontend/src/components/reports/ExportButtons.tsx`:
  - [x] Convert to .tsx
  - [x] Add CSV/PDF export functionality
  - [x] Use Button components

### 4.9 Migrate Dashboard Components

- [x] `frontend/src/components/dashboard/ExpenseAnalytics.tsx`:
  - [x] Convert to .tsx (if not already done in Phase 3)
  - [x] Remove inline styles
  - [x] Use React Query for live data

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
- [x] **Phase 2**: 58 tasks (Component Library)
- [x] **Phase 3**: 45 tasks (Core Pages)
- [ ] **Phase 4**: 52 tasks (Expansion)
- [ ] **Phase 5**: 48 tasks (Polish)
- [ ] **Misc**: 24 tasks (App/Deps/Docs)
- [ ] **TOTAL**: ~270 tasks

### Implementation Order
1. ⏳ Phase 1 (TypeScript, Tailwind, shadcn/ui, React Query, API)
2. ✅ Phase 2 (Component Library, Hooks, Context)
3. ✅ Phase 3 (Dashboard, Sales - Templates)
4. ⏳ Phase 4 (Expenses, Products, Inventory, Audit, Users, MLAnalytics)
5. ⏳ Phase 5 (Polish, Testing, Performance, Accessibility)
6. ⏳ Miscellaneous (App updates, Docs, Git)

### Success Criteria
- [ ] All pages converted to TypeScript (.tsx)
- [ ] All styling uses Tailwind + CSS Modules (no inline styles)
- [ ] All data from React Query (no useEffect/axios)
- [ ] Dark mode works on all pages
- [ ] Responsive design (mobile-first)
- [ ] Error boundaries in place
- [ ] No console errors/warnings
- [ ] TypeScript compilation succeeds
- [ ] Lighthouse score ≥90
- [ ] WCAG 2.1 Level AA compliant

---

**REFACTOR STARTED**: [Timestamp]  
**ESTIMATED DURATION**: 18–22 hours (solo execution)  
**STATUS**: Phase 3 complete. Phase 4 in progress (Expenses, Products, Inventory, Audit, Users refactors completed, including owner-managed automated report preferences with schedule time and weekday controls).

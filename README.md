# Infosys Inventory & Sales Management System

Enterprise-grade inventory, sales, and expense management platform with real-time analytics, predictive forecasting, and comprehensive audit trails.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│             Frontend (React + Vite + TailwindCSS)           │
│                      Port: 5174 / 3000                      │
│   Dark Mode • Modern Login • Shared App Layout • Analytics  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│              Backend API (Express + Prisma)                 │
│                      Port: 5000                             │
│         JWT Auth • Rate Limiting • Audit Logging            │
│              PostgreSQL + Redis (Docker)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Bridge
┌──────────────────────▼──────────────────────────────────────┐
│           ML Service (Flask + Prophet)                      │
│                      Port: 5001                             │
│        Demand Forecasting • Predictive Analytics            │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React 19, Vite 7, TailwindCSS 4, Recharts, Framer Motion | Latest |
| **Backend** | Express.js 5.2, Node.js | 18+ |
| **Database** | PostgreSQL 15-alpine | 15 |
| **ORM** | Prisma 5 | 5.22.0 |
| **Cache/Rate Limiter** | Redis 7-alpine | 7 |
| **Authentication** | JWT (jsonwebtoken) | 9.0.3 |
| **Validation** | Joi | Latest |
| **Logging** | Pino | Latest |
| **ML Service** | Flask, Prophet, scikit-learn | Python 3.8+ |
| **Containerization** | Docker & Docker Compose | 29.2.1+ |

## 📋 Features Implemented

### Phase 1-4: Security & Infrastructure ✅
- ✅ **CORS & Security Headers** - Request origin validation, X-Frame-Options, Content-Security-Policy
- ✅ **JWT Authentication** - 8-hour expiring tokens, bcrypt password hashing
- ✅ **Rate Limiting** - Nginx-based zones (100 req/min general, 10 req/min auth) with 429 responses
- ✅ **Role-Based Access Control** - Admin, Manager, User roles with middleware enforcement
- ✅ **Input Validation** - Joi schemas for all entity creation (6 schemas: Sale, Variant, Product, Category, Brand, Model)
- ✅ **Audit Logging** - Comprehensive action trails in PostgreSQL with user tracking
- ✅ **Structured JSON Logging** - Pino logger for ELK/Datadog integration
- ✅ **PDF Invoice Generation** - Automatic invoice creation on sale with pdfkit

### Phase 5: Database Migration ✅
- ✅ **PostgreSQL + Prisma ORM** - Type-safe database operations with migration history
- ✅ **Docker Containerization** - PostgreSQL 15 + Redis 7 with docker-compose
- ✅ **Data Migration** - 10,000+ records transferred from CSV with relationship integrity
- ✅ **9 Prisma Models** - User, Category, Brand, Model, Variant, Product, Sale, Expense, AuditLog
- ✅ **Soft Deletes** - is_deleted boolean for data preservation
- ✅ **7 Controllers Migrated** - All CRUD operations use Prisma with error handling

### Frontend Modernization (Ongoing) ✅
- ✅ **TailwindCSS v4 Integration** - Tailwind is enabled via Vite plugin and global `@import "tailwindcss"`
- ✅ **Shared Layout Routing** - `AppLayout` centralizes Sidebar + Header for all protected pages
- ✅ **Modern Login Experience** - Legacy login replaced by animated `ModernLogin` with dark/light mode support
- ✅ **UI Refresh Foundation** - New utility classes, transitions, and component styling patterns

### Phase 6: Distributed Deployment 🟡 Partially Active

**Phase 6.2 - Nginx Reverse Proxy** ✅ IMPLEMENTED
- ✅ Single entry point (port 80/443)
- ✅ Health checks & passive failover
- ✅ Rate limiting zones (general & auth)
- ✅ Security headers (X-Frame-Options, CSP, HSTS)
- ✅ Gzip compression
- ✅ SSL/TLS termination ready
- See: `nginx.conf`, `docker-compose.yml`

**Phase 6.3 - Multi-Instance Orchestration** ✅ CONFIGURED
- ✅ 3 backend replicas defined (backend_1, backend_2, backend_3)
- ✅ Least-connections load balancing (Nginx)
- ✅ Instance health monitoring & passive failover configured
- ✅ Redis connection & database pooling per instance
- ⏳ Needs verification: Deploy with `docker compose up` and test load distribution
- Ready for deployment (see PHASE_6_DEPLOYMENT.md)

**Phase 6.4 - Session & Cache Management** 📋 PLANNED
- ⏳ Redis-backed session store
- ⏳ Cache invalidation strategy
- ⏳ Multi-instance session consistency

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** 
- **Docker & Docker Compose 29.2.1+**
- **PostgreSQL 15** (via Docker)
- **Redis 7** (via Docker)
- **Python 3.8+** (for ML service)

### 1. Clone & Install

```bash
git clone <repository-url>
cd app
npm install  # Root workspace dependencies

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# ML Service
cd ../ml-service
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

**Required `.env` variables:**
```env
# backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/infosys_app?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_random_secret_key_here
PORT=5000
```

### 3. Start Services

```bash
# Terminal 1: Database & Cache
docker compose up -d postgres redis

# Terminal 2: Backend (from /backend)
npm run dev

# Terminal 3: Frontend (from /frontend)
npm run dev

# Terminal 4: ML Service (from /ml-service)
python app.py
```

**Service URLs:**
- Backend API: http://localhost:5000/api
- Frontend: http://localhost:5174
- ML Service: http://localhost:5001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 4. Database Initialization

```bash
# Run Prisma migrations
npx prisma migrate deploy
```

## 📁 Project Structure

```
app/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app setup
│   │   ├── server.js              # Server entry point
│   │   ├── controllers/           # Request handlers (7 Prisma-ready)
│   │   ├── routes/                # Route definitions
│   │   ├── middleware/            # Auth, validation, audit logging
│   │   ├── services/              # Business logic & CSV/PDF generation
│   │   ├── data/                  # CSV backups (for disaster recovery)
│   │   └── uploads/               # Generated invoices & user files
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema & migrations
│   │   └── migrations/            # Migration history
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Routing & protected routes
│   │   ├── components/            # UI components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API client (Axios)
│   │   ├── auth/                  # JWT & Auth context
│   │   └── styles/                # Design tokens and shared theme exports
│   ├── index.html
│   └── package.json
│
├── ml-service/
│   ├── app.py                     # Flask entry point
│   ├── routes/                    # Prediction & report endpoints
│   ├── services/                  # Forecast & analytics logic
│   ├── trained_models/            # Prophet model registry
│   └── requirements.txt
│
├── docker-compose.yml             # PostgreSQL + Redis containers
├── .gitignore                     # Git configuration (CSV/backup safe)
└── README.md                      # This file
```

## 🔐 Security Features

| Feature | Implementation | Status |
|---------|----------------|--------|
| **HTTPS/TLS** | Nginx reverse proxy (Phase 6) | ⏳ In Progress |
| **JWT Auth** | 8-hour expiring tokens | ✅ Active |
| **Password Hashing** | bcryptjs (10 salt rounds) | ✅ Active |
| **Rate Limiting** | Nginx zone-based (100r/m general, 10r/m auth) | ✅ Active |
| **CORS** | Origin whitelist (http://localhost:5174) | ✅ Active |
| **Input Validation** | Joi schemas on all endpoints | ✅ Active |
| **SQL Injection** | Prisma parameterized queries | ✅ Active |
| **Audit Trail** | Immutable action logs in PostgreSQL | ✅ Active |
| **Soft Deletes** | Data preservation & recovery | ✅ Active |

## 📊 Database Schema

**9 Core Models:**
- **User** - App users with roles (admin, manager, user) & hashed passwords
- **Category** - Product categories with soft delete
- **Brand** - Product brands linked to categories
- **Model** - Product models linked to brands
- **Variant** - Product variants with stock & pricing
- **Product** - Product catalog with related variants
- **Sale** - Sales transactions with invoices & user tracking
- **Expense** - Expense records with categories & receipts
- **AuditLog** - Immutable action history for compliance

**Key Features:**
- Timestamps (created_at, updated_at) on all models
- Soft deletes (is_deleted boolean) for data recovery
- User ownership tracking (createdBy field)
- Relationship validation via foreign keys
- Indexes on frequently-queried fields (user_id, category_id, etc.)

## 🔄 API Endpoints

### Authentication
```
POST   /api/auth/register              - User registration
POST   /api/auth/login                 - User login (returns JWT)
POST   /api/auth/refresh              - Refresh JWT token
```

### Inventory Management
```
GET    /api/categories                 - List categories
POST   /api/categories                 - Create category
GET    /api/brands                     - List brands
POST   /api/brands                     - Create brand
GET    /api/models                     - List models
POST   /api/models                     - Create model
GET    /api/variants                   - List variants with stock
POST   /api/variants                   - Create variant
GET    /api/products                   - List products
POST   /api/products                   - Create product
```

### Sales & Transactions
```
GET    /api/sales                      - List sales with invoices
POST   /api/sales                      - Create sale (generates invoice)
PUT    /api/sales/:id                  - Update sale status
GET    /api/expenses                   - List expenses
POST   /api/expenses                   - Create expense (upload receipt)
```

### Analytics
```
GET    /api/reports/sales-summary      - Sales dashboard metrics
GET    /api/reports/inventory-status   - Stock levels & alerts
POST   /api/predict/demand             - ML demand forecast (Phase 6)
```

### Audit & Compliance
```
GET    /api/audit/logs                 - Audit trail (admin only)
GET    /api/users                      - User list (role-based)
```

## 🧪 Testing & Validation

### Test Coverage (Phase 7 - Complete)
**Current Metrics:**
- ✅ **Statements:** 82.32% (Target: 75-80%, EXCEEDED)
- ✅ **Lines:** 82.77% (Target: 75-80%, EXCEEDED)
- ✅ **Functions:** 69.81%
- ✅ **Branches:** 69.45%
- ✅ **Test Suites:** 50
- ✅ **Total Tests:** 501+ passing

**Test Breakdown:**
- **Controllers** (12 files): audit, auth, brand, category, expense, invoice, model, product, report, sales, variant
- **Middleware** (7 files): auditLogger, authMiddleware, cache-invalidation, expenseUpload, roleMiddleware, validation
- **Routes** (6 files): brand, category, model, route-registration, user, variant
- **Services** (4 files): logger, pdf, session + health checks
- **Utils** (2 files): numberFormat, otp.store
- **Integration** (5 files): auth, expense, product, sales + helpers

### Running Tests
```bash
# Run all tests
cd backend
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Run specific test file
npm test -- auth.controller.test.js

# View coverage HTML report
open coverage/lcov-report/index.html
```

### Input Validation Coverage
- ✅ Email format validation
- ✅ Numeric field range checking (prices, quantities)
- ✅ String length constraints
- ✅ Required field enforcement
- ✅ Unknown field stripping
- ✅ Type coercion testing
- ✅ Valid inputs: 201 Created
- ✅ Invalid inputs: 400 Bad Request with field-level errors
- ✅ Missing fields: 400 with required field feedback
- ✅ Type mismatches: 400 with type error messages

**Smoke Tests Passed:**
- ✅ Backend health check: 200 OK
- ✅ Frontend loads: 200 OK
- ✅ ML service responsive: 200 OK
- ✅ Database connections: Active
- ✅ Rate limiting: 429 after threshold
- ✅ JWT token validation: Enforced

## 📦 Deployment

### Development
```bash
npm run dev        # Backend (nodemon)
npm run dev        # Frontend (Vite)
python app.py      # ML service
```

### Production (Phase 6)
```bash
docker compose -f docker-compose.prod.yml up -d
```

**Planned Production Features:**
- Nginx reverse proxy with load balancing
- Multi-instance backend scaling (3+ containers)
- Redis-backed session management
- SSL/TLS certificate management
- CloudWatch/ELK centralized logging
- Automated health checks & failover

## 🚦 Phase Progress

| Phase | Focus | Status | Details |
|-------|-------|--------|---------|
| **Phase 1** | Request Security | ✅ Complete | CORS, headers, HTTPS ready |
| **Phase 2** | Rate Limiting & Auth | ✅ Complete | JWT + bcrypt + rate limiter |
| **Phase 3** | Audit Logging | ✅ Complete | CSV→PostgreSQL action trails |
| **Phase 4** | Structured Logging & Validation | ✅ Complete | Pino + Joi schemas |
| **Phase 5** | Database Migration | ✅ Complete | PostgreSQL + Prisma ORM |
| **Phase 6.2** | Nginx Reverse Proxy | ✅ Complete | Load balancing, health checks, SSL ready |
| **Phase 6.3** | Multi-Instance Orchestration | ✅ Configured | 3 replicas + Nginx load balancing ready in docker-compose |
| **Phase 6.4** | Session & Cache Management | 📋 Planned | Redis sessions, cache invalidation |
| **Phase 7** | Testing & Coverage | ✅ Complete | 82%+ coverage, 501 tests, 50 suites |
| **Phase 8** | Frontend Enhancements | 📋 Planned | UI/UX modernization (React 19, modern design) |
| **Phase 9** | ML Model Versioning | 📋 Planned | Model registry, A/B testing |
| **Phase 10** | Operations Runbooks | 📋 Planned | Deployment guides, SRE |

## 🛠️ Development Workflows

### Adding a New Endpoint
1. Update `prisma/schema.prisma` if data structure needed
2. Run `npx prisma migrate dev --name feature_name`
3. Implement controller logic with Prisma queries
4. Wire route in `src/routes/*.js`
5. Add Joi validation schema if input required
6. Test with curl/Postman

### Database Changes
```bash
# After editing schema.prisma
npx prisma migrate dev --name descriptive_name
npx prisma generate              # Regenerate Prisma client
```

### Debugging
```bash
# View current migrations
npx prisma migrate resolve --preview

# Reset database (dev only)
npx prisma migrate reset

# View database GUI
npx prisma studio
```

## 📝 Important Files

| File | Purpose |
|------|---------|
| `backend/src/app.js` | Express app initialization & middleware |
| `backend/src/server.js` | Server entry point |
| `backend/prisma/schema.prisma` | Database schema definition |
| `backend/src/services/prisma.service.js` | Prisma client singleton |
| `backend/src/services/csv.service.js` | CSV read/write utilities (legacy) |
| `backend/src/middleware/authMiddleware.js` | JWT validation |
| `backend/src/middleware/validation.middleware.js` | Joi input validation |
| `backend/src/middleware/auditLogger.js` | Action logging |
| `docker-compose.yml` | PostgreSQL & Redis container definitions |
| `frontend/src/services/api.js` | Axios API client |
| `frontend/src/auth/authContext.jsx` | JWT & auth state management |

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Clear node_modules & reinstall
rm -r node_modules
npm install
npm run dev
```

### Database connection errors
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
cat .env | grep DATABASE_URL

# Reset migrations
npx prisma migrate resolve --rolled-back
npx prisma migrate deploy
```

### Frontend API errors
```bash
# Verify backend is running on 5000
curl http://localhost:5000/api/health

# Check CORS_ORIGINS in backend .env
# Should include http://localhost:5174
```

### Rate limiting issues
```bash
# View Redis keys
docker exec -it redis redis-cli KEYS "*"

# Clear all Redis data
docker exec -it redis redis-cli FLUSHALL
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following existing patterns
3. Commit with clear messages: `git commit -m "Add: feature description"`
4. Push to GitHub: `git push origin feature/your-feature`
5. Create Pull Request with testing evidence

## 📄 License

Internal Infosys project - All rights reserved.

## 💬 Support

For questions or issues:
- Check existing documentation in Phase notes
- Review code comments in service files
- Consult database schema in `prisma/schema.prisma`
- Review API routes in `backend/src/routes/`

---

**Last Updated:** March 30, 2026  
**Status:** Phase 7 Testing Complete, Phase 8 Frontend Modernization Next  
**Version:** 1.0.0  
**Test Coverage:** 82.32% statements, 82.77% lines (501 tests across 50 suites)

# PostgreSQL Setup - Phase 5

## Option 1: Install PostgreSQL Locally (Recommended)

### On Windows:
1. Download PostgreSQL 15 from https://www.postgresql.org/download/windows/
2. Run installer with default settings
3. Remember the password you set for postgres user
4. Note the installation directory

### Configuration:
After installation, PostgreSQL runs on localhost:5432 by default.

Update your `.env` file or create `.env.local`:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/infosys_app?schema=public"
```

## Option 2: Use PostgreSQL Docker Desktop (if Docker is installed)

```bash
# Start PostgreSQL container
docker run --name infosys_postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=infosys_app \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15-alpine
```

## Step-by-Step Migration Process

### Step 1: Verify PostgreSQL is Running
```bash
# Windows Command Prompt or PowerShell
psql -h localhost -U postgres -c "SELECT version();"
```

### Step 2: Create the Database
```bash
# Using Prisma
cd backend
npx prisma db push
# OR manually:
# psql -h localhost -U postgres -c "CREATE DATABASE infosys_app;"
```

### Step 3: Run Prisma Migrations
```bash
npx prisma migrate dev --name initial_schema
```
This creates all tables based on schema.prisma

### Step 4: Verify Migration
```bash
# Launch Prisma Studio to view data
npx prisma studio
# Opens browser at http://localhost:5555
```

## Alternative Quick Setup (WSL2):
If you have WSL2, run PostgreSQL inside WSL:
```bash
# In WSL terminal
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

## Troubleshooting

### Connection refused error:
- Ensure PostgreSQL is running: `psql -h localhost -U postgres`
- Check DATABASE_URL in .env for typos
- Verify port 5432 is not blocked by firewall

### Database already exists:
- Drop and recreate: `psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS infosys_app; CREATE DATABASE infosys_app;"`

### Prisma seed issues:
- Run migrations first: `npx prisma migrate deploy`
- If initial data needed, use Prisma seed file (see prisma/seed.js if available)

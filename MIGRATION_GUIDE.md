# 🚀 PostgreSQL Migration Guide

Dit project is volledig gemigreerd van SQLite naar PostgreSQL met **future-proof** best practices.

## ✅ Wat is Future-Proof?

### 1. **Connection Pooling** ✅
- Max 20 connections
- Min 2 connections  
- Automatic idle timeout (30s)
- Connection timeout (10s)
- Error monitoring met events

### 2. **Graceful Shutdown** ✅
- SIGTERM/SIGINT handlers
- Pool connections worden netjes gesloten
- Geen orphaned connections

### 3. **Database Migrations** ✅
- Versioned schema changes
- Automatisch bij startup
- Rollback support
- Transaction-safe migrations

### 4. **Environment Validatie** ✅
- Validates DATABASE_URL format
- Required environment variables check
- Type-safe config object

### 5. **Health Checks** ✅
- `/health` endpoint
- Database connectivity check
- Ready voor monitoring tools (Kubernetes, etc.)

### 6. **Error Handling** ✅
- Pool error events
- Connection error monitoring
- Startup validation

## 📦 Setup

### 1. Install PostgreSQL

**Windows (via Chocolatey):**
```bash
choco install postgresql
```

**macOS (via Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Login als postgres user
psql -U postgres

# Create database
CREATE DATABASE budget_app;

# Create user (optioneel)
CREATE USER budget_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE budget_app TO budget_user;
```

### 3. Configure Environment

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/budget_app
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=your_key_here
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Initialize Database

```bash
npm run db:init
```

### 6. Seed Data (Optional)

```bash
npm run db:seed
```

### 7. Start Server

```bash
npm run dev
```

## 🔄 Database Migrations

### Adding a New Migration

1. Open `backend/src/lib/migrations.ts`
2. Add migration to array:

```typescript
{
  version: 2,
  name: "add_user_preferences",
  up: `
    CREATE TABLE user_preferences (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'nl'
    );
  `,
  down: `DROP TABLE user_preferences;`
}
```

3. Restart server (migrations run automatically)

### Manual Migration Run

```typescript
import { runMigrations } from './lib/migrations';
await runMigrations();
```

### Rollback (Development Only)

```typescript
import { rollbackLastMigration } from './lib/migrations';
await rollbackLastMigration();
```

## 🏗️ Architecture

```
backend/
├── src/
│   ├── lib/
│   │   ├── db.ts              # ✅ Pool config + health checks
│   │   ├── env.ts             # ✅ Environment validation
│   │   └── migrations.ts      # ✅ Schema versioning
│   ├── services/              # Business logic
│   ├── routes/                # API endpoints
│   ├── repositories/          # Database queries
│   └── index.ts               # ✅ Server startup with validation
```

## 🔒 Production Checklist

- [ ] Environment variables via secrets (niet in code!)
- [ ] DATABASE_URL uses SSL: `?sslmode=require`
- [ ] Connection pool configured voor productie load
- [ ] Health check endpoint `/health` monitoren
- [ ] Database backups instellen
- [ ] Logging naar externe service (Sentry, LogRocket)
- [ ] Rate limiting toevoegen
- [ ] CORS origins beperken tot productie domains

## 🆚 SQLite vs PostgreSQL

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Type** | File-based | Client-server |
| **Concurrent writes** | ❌ Limited | ✅ Excellent |
| **Data types** | ⚠️ Limited | ✅ Rich types |
| **Scaling** | ❌ Single machine | ✅ Horizontal scaling |
| **Backups** | Copy file | ✅ pg_dump, replicas |
| **Transactions** | ✅ Yes | ✅ ACID compliant |
| **Production ready** | ⚠️ Small apps | ✅ Enterprise |

## 🐛 Troubleshooting

### Connection Failed

```bash
# Check PostgreSQL is running
pg_isready

# Check credentials
psql -U postgres -d budget_app
```

### Migration Failed

```bash
# Check migration table
psql -U postgres -d budget_app -c "SELECT * FROM schema_migrations;"

# Manual rollback if needed
```

### Pool Exhausted

Increase `max` connections in `backend/src/lib/db.ts`:
```typescript
max: 50, // Verhoog naar 50
```

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Pool Stats (Development)

Pool events loggen automatisch:
- `connect` - New client connected
- `remove` - Client removed
- `error` - Unexpected error

## 🚀 Next Steps

1. **Monitoring**: Integreer Sentry of DataDog
2. **Caching**: Voeg Redis toe voor performance
3. **Read Replicas**: Voor read-heavy workloads
4. **Backup Strategy**: Automatische backups instellen
5. **CI/CD**: Migrations in deployment pipeline

## 📚 Resources

- [node-pg Documentation](https://node-postgres.com/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)
- [Connection Pooling Guide](https://node-postgres.com/features/pooling)

---

✅ **Status**: Production Ready
🔧 **Maintenance**: Migrations-based schema updates
📊 **Monitoring**: Health checks enabled

# 🚀 Quick Setup Instructions

## Stap 1: Verwijder SQLite Dependencies ⚠️

```bash
cd backend
npm uninstall better-sqlite3 @types/better-sqlite3
```

## Stap 2: Installeer PostgreSQL

### Windows
```bash
choco install postgresql
# Of download van: https://www.postgresql.org/download/windows/
```

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Stap 3: Maak Database Aan

```bash
# Login als postgres user
psql -U postgres

# In psql:
CREATE DATABASE budget_app;
\q
```

## Stap 4: Configureer Environment

Maak `backend/.env` bestand:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/budget_app
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=your_openai_key_here
```

**⚠️ BELANGRIJK:** Pas het wachtwoord aan naar jouw PostgreSQL wachtwoord!

## Stap 5: Installeer Dependencies

```bash
npm install
```

## Stap 6: Initialiseer Database

```bash
npm run db:init
```

Dit maakt alle tabellen aan (categories, transactions, receipts, etc.)

## Stap 7: (Optioneel) Importeer Data

Als je CSV bestanden hebt in `backend/src/data/`:

```bash
npm run db:seed
```

## Stap 8: Start de Server

```bash
npm run dev
```

Je zou moeten zien:
```
✅ Database connection successful
✅ Database schema is up to date
✅ Server running on http://localhost:3001
✅ Database: PostgreSQL (pooled connections)
✅ Environment: development
```

## Verificatie

Test de health endpoint:
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

## Troubleshooting

### "Connection refused"
- Check of PostgreSQL draait: `pg_isready`
- Check of de PORT correct is: `5432`

### "Password authentication failed"
- Check je wachtwoord in DATABASE_URL
- Reset wachtwoord: 
  ```bash
  psql -U postgres
  ALTER USER postgres PASSWORD 'new_password';
  ```

### "Database does not exist"
- Maak de database: `CREATE DATABASE budget_app;`

### "Port 3001 already in use"
- Verander PORT in `.env` naar bijv. `3002`

## Next Steps

Lees de volledige documentatie:
- 📖 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migratie details
- ✅ [FUTURE_PROOF_CHECKLIST.md](./FUTURE_PROOF_CHECKLIST.md) - Waarom dit future-proof is

## Hulp Nodig?

Check de logs:
```bash
npm run dev
```

Alle errors worden gelogd met duidelijke messages!

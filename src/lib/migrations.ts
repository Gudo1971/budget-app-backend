import { pool } from "./db";

/**
 * ✅ FUTURE-PROOF: Database migrations systeem
 *
 * Gebruik dit voor schema wijzigingen in productie:
 * - Voeg nieuwe migrations toe aan de array
 * - Run automatisch bij opstart
 * - Houdt bij welke migrations al zijn uitgevoerd
 */

export interface Migration {
  version: number;
  name: string;
  up: string; // SQL voor upgrade
  down?: string; // SQL voor rollback (optioneel)
}

// ✅ Future migrations komen hier
export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: `
      -- Deze is al gedraaid via init-db-function.ts
      -- Future migrations komen hieronder
    `,
  },
  // Voorbeeld van hoe je nieuwe migrations toevoegt:
  // {
  //   version: 2,
  //   name: "add_user_preferences",
  //   up: `
  //     CREATE TABLE user_preferences (
  //       user_id TEXT PRIMARY KEY,
  //       theme TEXT DEFAULT 'light',
  //       language TEXT DEFAULT 'nl'
  //     );
  //   `,
  //   down: `DROP TABLE user_preferences;`
  // },
];

/**
 * ✅ Maak migrations tabel aan als die nog niet bestaat
 */
async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * ✅ Run alle pending migrations
 */
export async function runMigrations() {
  await ensureMigrationsTable();

  // Haal huidige versie op
  const result = await pool.query(
    "SELECT MAX(version) as current_version FROM schema_migrations",
  );
  const currentVersion = result.rows[0]?.current_version || 0;

  console.log(`📊 Current schema version: ${currentVersion}`);

  // Filter pending migrations
  const pendingMigrations = migrations.filter(
    (m) => m.version > currentVersion,
  );

  if (pendingMigrations.length === 0) {
    console.log("✅ Database schema is up to date");
    return;
  }

  console.log(`🔄 Running ${pendingMigrations.length} migrations...`);

  // Run elke migration in een transactie
  for (const migration of pendingMigrations) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      console.log(
        `  ⬆️  Running migration ${migration.version}: ${migration.name}`,
      );

      // Skip empty migrations (zoals initial_schema die al via init-db is uitgevoerd)
      if (
        migration.up.trim() &&
        !migration.up.includes("Deze is al gedraaid")
      ) {
        await client.query(migration.up);
      }

      // Registreer migration met ON CONFLICT om duplicates te voorkomen
      await client.query(
        `INSERT INTO schema_migrations (version, name) 
         VALUES ($1, $2) 
         ON CONFLICT (version) DO NOTHING`,
        [migration.version, migration.name],
      );

      await client.query("COMMIT");
      console.log(`  ✅ Migration ${migration.version} completed`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`  ❌ Migration ${migration.version} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("✅ All migrations completed successfully");
}

/**
 * ✅ Rollback laatste migration (voor development)
 */
export async function rollbackLastMigration() {
  const result = await pool.query(
    "SELECT version, name FROM schema_migrations ORDER BY version DESC LIMIT 1",
  );

  if (result.rows.length === 0) {
    console.log("No migrations to rollback");
    return;
  }

  const lastMigration = result.rows[0];
  const migration = migrations.find((m) => m.version === lastMigration.version);

  if (!migration?.down) {
    console.error(`Migration ${lastMigration.version} has no rollback script`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log(
      `⬇️  Rolling back migration ${migration.version}: ${migration.name}`,
    );
    await client.query(migration.down);

    await client.query("DELETE FROM schema_migrations WHERE version = $1", [
      migration.version,
    ]);

    await client.query("COMMIT");
    console.log(`✅ Migration ${migration.version} rolled back`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`❌ Rollback failed:`, error);
    throw error;
  } finally {
    client.release();
  }
}

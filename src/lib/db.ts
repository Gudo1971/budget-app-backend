import { Pool, PoolConfig } from "pg";

// ✅ Future-proof: Configureerbare connection pool
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,

  // Connection pool settings voor production
  max: 20, // Maximum aantal connections
  min: 2, // Minimum aantal connections
  idleTimeoutMillis: 30000, // Close idle connections na 30s
  connectionTimeoutMillis: 10000, // Timeout voor nieuwe connections

  // Error handling
  allowExitOnIdle: false, // Voorkomt dat de pool sluit bij idle
};

export const pool = new Pool(poolConfig);

// ✅ Future-proof: Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Closing database pool...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Closing database pool...");
  await pool.end();
  process.exit(0);
});

// ✅ Future-proof: Error monitoring
pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
  // In productie: stuur naar logging service (Sentry, LogRocket, etc.)
});

pool.on("connect", () => {
  console.log("✅ Database client connected");
});

pool.on("remove", () => {
  console.log("Database client removed from pool");
});

// ✅ Future-proof: Health check functie
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW()");
    return !!result.rows[0];
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// ✅ Future-proof: Transaction helper
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

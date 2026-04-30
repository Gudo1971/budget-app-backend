/**
 * ✅ FUTURE-PROOF: Environment validatie
 * 
 * Zorgt ervoor dat alle vereiste environment variabelen aanwezig zijn
 * voordat de applicatie start.
 */

interface EnvConfig {
  DATABASE_URL: string;
  NODE_ENV: "development" | "production" | "test";
  PORT?: string;
  OPENAI_API_KEY?: string;
}

function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Verplichte variabelen
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  // Valideer DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgres")) {
    errors.push("DATABASE_URL must be a valid PostgreSQL connection string");
  }

  // NODE_ENV met default
  const nodeEnv = process.env.NODE_ENV || "development";
  if (!["development", "production", "test"].includes(nodeEnv)) {
    errors.push("NODE_ENV must be development, production, or test");
  }

  if (errors.length > 0) {
    console.error("❌ Environment validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NODE_ENV: nodeEnv as "development" | "production" | "test",
    PORT: process.env.PORT || "3001",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
}

export const env = validateEnv();

// Log configuratie (zonder gevoelige data)
if (env.NODE_ENV === "development") {
  console.log("🔧 Environment configuration:");
  console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  - PORT: ${env.PORT}`);
  console.log(`  - DATABASE_URL: ${env.DATABASE_URL.split("@")[1] || "configured"}`);
  console.log(`  - OPENAI_API_KEY: ${env.OPENAI_API_KEY ? "configured" : "not set"}`);
}

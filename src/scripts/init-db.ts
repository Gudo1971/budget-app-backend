// ❗ BELANGRIJK: dotenv MOET als eerste geladen worden
import "dotenv/config";

import { initDatabase } from "./init-db-function";

initDatabase()
  .then(() => {
    console.log("✅ Database initialization complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  });

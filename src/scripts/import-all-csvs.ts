import "dotenv/config";

import fs from "fs";
import path from "path";

import { pool } from "../lib/db";
import { initDatabase } from "./init-db-function";
import { importCategoriesCsv } from "./import-categories";
import { importBudgetsCsv } from "./import-budgets";
import { importBudgetCategoriesCsv } from "./import-budget-categories";
import { importFixedCostsCsv } from "./import-fixed-costs";
import { importSavingsGoalsCsv } from "./import-savings-goals";
import { importTransactionsCsv } from "./import-transactions";
import { importMerchantMemoryCsv } from "./import-merchant-memory";
import { importSubcategoriesCsv } from "./import-subcategories";

async function importAllCsvs() {
  const dataDir = path.join(__dirname, "..", "data");

  console.log("💣 Dropping all tables...");
  try {
    // PostgreSQL CASCADE zorgt ervoor dat dependencies ook worden verwijderd
    await pool.query(`
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS receipts CASCADE;
      DROP TABLE IF EXISTS budget_categories CASCADE;
      DROP TABLE IF EXISTS budgets CASCADE;
      DROP TABLE IF EXISTS fixed_costs CASCADE;
      DROP TABLE IF EXISTS savings_goals CASCADE;
      DROP TABLE IF EXISTS subcategories CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS merchant_memory CASCADE;
      DROP TABLE IF EXISTS sub_budgets CASCADE;
      DROP TABLE IF EXISTS savings CASCADE;
      DROP TABLE IF EXISTS rollovers CASCADE;
    `);
    console.log("✅ All tables dropped");
  } catch (error) {
    console.log("⚠️ Drop failed:", error instanceof Error ? error.message : "");
  }

  console.log("🔨 Building schema...");
  try {
    await initDatabase();
    console.log("✅ Schema initialized");
  } catch (error) {
    console.log(
      "❌ Schema init failed:",
      error instanceof Error ? error.message : "",
    );
    throw error;
  }

  console.log("Starting CSV import...");

  const importOrder = [
    "categories.csv",
    "subcategories.csv",
    "budgets.csv",
    "budget_categories.csv",
    "fixed_costs.csv",
    "savings_goals.csv",
    "merchant_memory.csv",
    "transactions.csv",
  ];

  for (const file of importOrder) {
    const filePath = path.join(dataDir, file);

    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }

    console.log("Importing:", file);

    if (file === "categories.csv") {
      await importCategoriesCsv(filePath);
    } else if (file === "subcategories.csv") {
      await importSubcategoriesCsv(filePath);
    } else if (file === "budgets.csv") {
      await importBudgetsCsv(filePath);
    } else if (file === "budget_categories.csv") {
      await importBudgetCategoriesCsv(filePath);
    } else if (file === "fixed_costs.csv") {
      await importFixedCostsCsv(filePath);
    } else if (file === "savings_goals.csv") {
      await importSavingsGoalsCsv(filePath, "demo-user");
    } else if (file === "merchant_memory.csv") {
      await importMerchantMemoryCsv(1);
    } else if (file === "transactions.csv") {
      await importTransactionsCsv(filePath, "demo-user");
    }
  }

  console.log("All CSVs imported successfully.");
}

importAllCsvs();

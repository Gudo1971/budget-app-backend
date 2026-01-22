import "dotenv/config";

import fs from "fs";
import path from "path";

import { db } from "../lib/db";
import { initDatabase } from "./init-db-function";
import { importCategoriesCsv } from "./import-categories";
import { importBudgetsCsv } from "./import-budgets";
import { importBudgetCategoriesCsv } from "./import-budget-categories";
import { importFixedCostsCsv } from "./import-fixed-costs";
import { importSavingsGoalsCsv } from "./import-savings-goals";
import { importTransactionsCsv } from "./import-transactions";
import { importSubcategoriesCsv } from "./import-subcategories";

async function importAllCsvs() {
  const dataDir = path.join(__dirname, "..", "data");

  // ⭐ DROP ALL TABLES FIRST (nuclear option for clean reset)
  console.log("💣 Dropping all tables...");
  try {
    db.exec(`
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS receipts;
      DROP TABLE IF EXISTS budget_categories;
      DROP TABLE IF EXISTS budgets;
      DROP TABLE IF EXISTS fixed_costs;
      DROP TABLE IF EXISTS savings_goals;
      DROP TABLE IF EXISTS subcategories;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS merchant_memory;
      DELETE FROM sqlite_sequence;
    `);
    console.log("✅ All tables dropped");
  } catch (error) {
    console.log("⚠️ Drop failed:", error instanceof Error ? error.message : "");
  }

  // ⭐ INITIALIZE DATABASE SCHEMA
  console.log("🔨 Building schema...");
  try {
    initDatabase();
    console.log("✅ Schema initialized");
  } catch (error) {
    console.log(
      "❌ Schema init failed:",
      error instanceof Error ? error.message : "",
    );
    throw error;
  }

  // ⭐ DATABASE CLEANUP (niet nodig - we gingen net DROP TABLE doen)
  console.log("✅ Database reset complete");

  // Define import order to handle dependencies
  const importOrder = [
    "categories.csv",
    "subcategories.csv",
    "budgets.csv",
    "budget_categories.csv",
    "fixed_costs.csv",
    "savings_goals.csv",
    "transactions.csv",
  ];

  console.log("Starting CSV import...");

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
    } else if (file === "transactions.csv") {
      await importTransactionsCsv(filePath, "demo-user");
    }
  }

  console.log("All CSVs imported successfully.");
}

importAllCsvs();

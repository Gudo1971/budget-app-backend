// src/scripts/import-csv.ts
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { db } from "../lib/db";

// ---------------------------------------------
// Helper: CSV loader
// ---------------------------------------------
function loadCSV(file: string) {
  const filePath = path.join(process.cwd(), "src", "data", file);
  const content = fs.readFileSync(filePath, "utf-8");

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

// ---------------------------------------------
// Import: Categories
// ---------------------------------------------
function importCategories() {
  const rows = loadCSV("categories.csv");

  const stmt = db.prepare(`
    INSERT INTO categories (name, type)
    VALUES (@name, @type)
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) stmt.run(row);
  });

  insertMany(rows);
  console.log("✔ Categories imported");
}

// ---------------------------------------------
// Import: Budgets
// ---------------------------------------------
function importBudgets() {
  const rows = loadCSV("budgets.csv");

  const stmt = db.prepare(`
    INSERT INTO budgets (month, total_budget)
    VALUES (@month, @total_budget)
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) stmt.run(row);
  });

  insertMany(rows);
  console.log("✔ Budgets imported");
}

// ---------------------------------------------
// Import: Budget per category
// ---------------------------------------------
function importBudgetCategories() {
  const rows = loadCSV("budget_categories.csv");

  const getCategoryId = db.prepare(`
    SELECT id FROM categories WHERE name = ?
  `);

  const stmt = db.prepare(`
    INSERT INTO budget_categories (month, category_id, budget_amount)
    VALUES (@month, @category_id, @budget_amount)
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) {
      const cat = getCategoryId.get(row.category_name) as
        | { id: number }
        | undefined;
      if (!cat) continue;

      stmt.run({
        month: row.month,
        category_id: cat.id,
        budget_amount: row.budget_amount,
      });
    }
  });

  insertMany(rows);
  console.log("✔ Budget categories imported");
}

// ---------------------------------------------
// Import: Fixed costs
// ---------------------------------------------
function importFixedCosts() {
  const rows = loadCSV("fixed_costs.csv");

  const stmt = db.prepare(`
    INSERT INTO fixed_costs (name, amount, interval)
    VALUES (@name, @amount, @interval)
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) stmt.run(row);
  });

  insertMany(rows);
  console.log("✔ Fixed costs imported");
}

// ---------------------------------------------
// Import: Savings goals
// ---------------------------------------------
function importSavingsGoals() {
  const rows = loadCSV("savings_goals.csv");

  const stmt = db.prepare(`
    INSERT INTO savings_goals (name, target_amount, current_amount, deadline)
    VALUES (@name, @target_amount, @current_amount, @deadline)
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) stmt.run(row);
  });

  insertMany(rows);
  console.log("✔ Savings goals imported");
}

// ---------------------------------------------
// Import: Transactions
// ---------------------------------------------
function importTransactions() {
  const rows = loadCSV("transactions.csv");

  const getCategoryId = db.prepare(`
    SELECT id FROM categories WHERE name = ?
  `);

  const stmt = db.prepare(`
    INSERT INTO transactions (date, description, amount, category_id)
    VALUES (@date, @description, @amount, @category_id)
  `);

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) {
      const cat = getCategoryId.get(row.category_name) as
        | { id: number }
        | undefined;

      stmt.run({
        date: row.date,
        description: row.description,
        amount: row.amount,
        category_id: cat?.id ?? null,
      });
    }
  });

  insertMany(rows);
  console.log("✔ Transactions imported");
}

// ---------------------------------------------
// Run all imports
// ---------------------------------------------
importCategories();
importBudgets();
importBudgetCategories();
importFixedCosts();
importSavingsGoals();
importTransactions();

console.log("🎉 CSV import completed successfully!");

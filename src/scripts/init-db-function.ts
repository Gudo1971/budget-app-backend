import { db } from "../lib/db";

export function initDatabase() {
  db.exec(`
    -- ============================
    -- CATEGORIES
    -- ============================
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('variable', 'fixed'))
    , user_id TEXT DEFAULT 'demo-user'
    );
    -- ============================
    -- RECEIPTS
    -- ============================
    CREATE TABLE receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      ocrText TEXT,
      aiResult TEXT,
      imageHash TEXT,                   
      status TEXT NOT NULL DEFAULT 'pending',
      transaction_id INTEGER, category TEXT, subCategory TEXT, merchant TEXT, merchant_category TEXT, purchase_date TEXT, total REAL,             -- koppeling naar transaction
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );
    -- ============================
    -- TRANSACTIONS
    -- ============================
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER,                 -- koppeling naar receipt
      amount REAL NOT NULL,
      date TEXT NOT NULL,                 -- bankdatum
      transaction_date TEXT NOT NULL,     -- aankoopdatum
      merchant TEXT NOT NULL,             -- genormaliseerde merchant
      description TEXT,                   -- originele bankomschrijving
      category_id INTEGER,                -- koppeling naar categories
      category TEXT,
      subcategory TEXT,
      user_id TEXT NOT NULL,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- ============================
    -- BUDGETS
    -- ============================
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      total_budget REAL NOT NULL
    );

    -- ============================
    -- BUDGET CATEGORIES
    -- ============================
    CREATE TABLE IF NOT EXISTS budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      budget_amount REAL NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- ============================
    -- FIXED COSTS
    -- ============================
    CREATE TABLE IF NOT EXISTS fixed_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      interval TEXT NOT NULL CHECK(interval IN ('monthly', 'yearly'))
    );

    -- ============================
    -- MERCHANT MEMORY
    -- ============================
    CREATE TABLE IF NOT EXISTS merchant_memory (
      user_id TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, merchant)
    );

    -- ============================
    -- SAVINGS GOALS
    -- ============================
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      deadline TEXT
    );
  `);

  console.log("Database initialized successfully.");
}

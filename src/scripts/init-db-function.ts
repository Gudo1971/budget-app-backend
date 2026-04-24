import { db } from "../lib/db";

export function initDatabase() {
  db.exec(`


    DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS budget_categories;
DROP TABLE IF EXISTS fixed_costs;
DROP TABLE IF EXISTS merchant_memory;
DROP TABLE IF EXISTS savings_goals;
DROP TABLE IF EXISTS sub_budgets;

    -- ============================
    -- CATEGORIES
    -- ============================
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('variable', 'fixed')),
      user_id TEXT DEFAULT 'demo-user',
     color TEXT
    );

    -- ============================
    -- SUBCATEGORIES
    -- ============================
    CREATE TABLE subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
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
      status TEXT NOT NULL DEFAULT 'pending',
      imageHash TEXT,
      ocrText TEXT,
      aiResult TEXT,
      transaction_id INTEGER,
      merchant TEXT,
      purchase_date TEXT,
      total REAL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );

    -- ============================
    -- TRANSACTIONS
    -- ============================
    CREATE TABLE transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER,
      amount REAL NOT NULL,
      transaction_date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      user_id TEXT NOT NULL,
      recurring INTEGER DEFAULT 0,
      subcategory_id INTEGER,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
    );
    -- ============================
    -- BUDGETS
    -- ============================
   CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL UNIQUE,
  total_budget REAL NOT NULL
);
    -- ============================
    -- SUB_BUDGETS
    -- ============================
CREATE TABLE sub_budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,               -- "2025-04"
  category_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_subbudgets_unique
ON sub_budgets (month, category_id);

    -- ============================
    -- BUDGET CATEGORIES
    -- ============================
  CREATE TABLE IF NOT EXISTS budget_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  budget_amount REAL NOT NULL,
  UNIQUE(month, category_id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

    -- ============================
    -- FIXED COSTS
    -- ============================
    CREATE TABLE IF NOT EXISTS fixed_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      interval TEXT NOT NULL CHECK(interval IN ('monthly', 'yearly')),
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- ============================
    -- MERCHANT MEMORY
    -- ============================
    CREATE TABLE merchant_memory (
      user_id TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      confidence REAL NOT NULL DEFAULT 1.0,
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
      deadline TEXT,
      user_id TEXT NOT NULL
    );

    -- ============================
    -- INDEXES for query performance
    -- ============================
    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX idx_transactions_category_id ON transactions(category_id);
    CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
    CREATE INDEX idx_receipts_user_id ON receipts(user_id);
    CREATE INDEX idx_receipts_transaction_id ON receipts(transaction_id);
    CREATE INDEX idx_merchant_memory_user_id ON merchant_memory(user_id);
  `);

  console.log("Database initialized successfully.");
}

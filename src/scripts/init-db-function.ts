import { pool } from "../lib/db";

export async function initDatabase() {
  await pool.query(`
    -- DROP ALL TABLES
    DROP TABLE IF EXISTS transactions CASCADE;
    DROP TABLE IF EXISTS receipts CASCADE;
    DROP TABLE IF EXISTS budget_categories CASCADE;
    DROP TABLE IF EXISTS sub_budgets CASCADE;
    DROP TABLE IF EXISTS merchant_memory CASCADE;
    DROP TABLE IF EXISTS savings_goals CASCADE;
    DROP TABLE IF EXISTS fixed_costs CASCADE;
    DROP TABLE IF EXISTS subcategories CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS budgets CASCADE;
    DROP TABLE IF EXISTS savings CASCADE;
    DROP TABLE IF EXISTS rollovers CASCADE;

    -- ============================
    -- CATEGORIES
    -- ============================
    CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('variable', 'fixed')),
      user_id TEXT NOT NULL,
      color TEXT
    );

        -- ============================
    -- SUBCATEGORIES
    -- ============================
    CREATE TABLE subcategories (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

        -- ============================
    -- RECEIPTS
    -- ============================
    CREATE TABLE receipts (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      imageHash TEXT,
      ocrText TEXT,
      aiResult TEXT,
      transaction_id INTEGER,
      merchant TEXT,
      purchase_date TEXT,
      total NUMERIC,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    );

        -- ============================
    -- TRANSACTIONS
    -- ============================
    CREATE TABLE transactions (
      id SERIAL PRIMARY KEY,
      receipt_id INTEGER,
      amount NUMERIC NOT NULL,
      transaction_date DATE NOT NULL,
      merchant TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      user_id TEXT NOT NULL,
      recurring BOOLEAN DEFAULT FALSE,
      subcategory_id INTEGER,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
    );

        -- ============================
    -- BUDGETS (GLOBAL, NOT PER USER)
    -- ============================
    CREATE TABLE budgets (
      id SERIAL PRIMARY KEY,
      month TEXT NOT NULL UNIQUE,
      total_budget NUMERIC NOT NULL,
      remaining NUMERIC DEFAULT 0
    );

        -- ============================
    -- SUB_BUDGETS (PER USER, PER MAAND)
    -- ============================
    CREATE TABLE sub_budgets (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      month TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE (user_id, month, category_id)
    );

    CREATE INDEX idx_subbudgets_unique
      ON sub_budgets (user_id, month, category_id);

        -- ============================
    -- BUDGET CATEGORIES
    -- ============================
    CREATE TABLE budget_categories (
      id SERIAL PRIMARY KEY,
      month TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      budget_amount NUMERIC NOT NULL,
      UNIQUE(month, category_id),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

        -- ============================
    -- FIXED COSTS
    -- ============================
    CREATE TABLE fixed_costs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      interval TEXT NOT NULL CHECK(interval IN ('monthly', 'yearly')),
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

        -- ============================
    -- MERCHANT MEMORY
    -- ============================
    CREATE TABLE merchant_memory (
      user_id TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      confidence NUMERIC NOT NULL DEFAULT 1.0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, merchant)
    );

        -- ============================
    -- SAVINGS GOALS
    -- ============================
    CREATE TABLE savings_goals (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount NUMERIC NOT NULL,
      current_amount NUMERIC NOT NULL,
      deadline TEXT,
      user_id TEXT NOT NULL
    );
    
    -- ============================
    -- SAVINGS 
    -- ============================
    CREATE TABLE savings (
      id SERIAL PRIMARY KEY,
      month TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      source_month TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- ============================
    -- ROLLOVERS
    -- ============================
    CREATE TABLE rollovers (
      id SERIAL PRIMARY KEY,
      month TEXT NOT NULL UNIQUE,
      amount NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

        -- ============================
    -- INDEXES
    -- ============================
    CREATE INDEX idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX idx_transactions_category_id ON transactions(category_id);
    CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
    CREATE INDEX idx_receipts_user_id ON receipts(user_id);
    CREATE INDEX idx_receipts_transaction_id ON receipts(transaction_id);
    CREATE INDEX idx_merchant_memory_user_id ON merchant_memory(user_id);
  `);

  console.log("✅ PostgreSQL database initialized successfully.");
}

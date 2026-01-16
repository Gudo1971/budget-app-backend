import { db } from "../lib/db";

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('variable', 'fixed'))
    );

CREATE TABLE receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      ocrText TEXT,
      aiResult TEXT,
      category TEXT,
      subCategory TEXT,
      processed INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending', transaction_id INTEGER
      );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      merchant TEXT NOT NULL,
      description TEXT,
      category TEXT,
      subcategory TEXT,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      total_budget REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      budget_amount REAL NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS fixed_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      interval TEXT NOT NULL CHECK(interval IN ('monthly', 'yearly'))
    );

    CREATE TABLE IF NOT EXISTS merchant_memory (
      user_id TEXT NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, merchant)
    );

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

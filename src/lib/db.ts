// lib/db.ts
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "budget.db");

export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

export function getReceiptById(id: number) {
  const row = db
    .prepare("SELECT id, original_name, file_path FROM receipts WHERE id = ?")
    .get(id);

  return row || null;
}

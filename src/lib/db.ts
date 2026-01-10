import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../budget.db");

export const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

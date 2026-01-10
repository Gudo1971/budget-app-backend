import { db } from "./db";

export function migrateReceiptsTable() {
  // Helper: check if a column exists
  const columnExists = (table: string, column: string) => {
    const row = db
      .prepare(`PRAGMA table_info(${table})`)
      .all()
      .find((col: any) => col.name === column);
    return !!row;
  };

  // Add ocrText
  if (!columnExists("receipts", "ocrText")) {
    db.prepare(`ALTER TABLE receipts ADD COLUMN ocrText TEXT`).run();
    console.log("Migrated: added receipts.ocrText");
  }

  // Add aiResult
  if (!columnExists("receipts", "aiResult")) {
    db.prepare(`ALTER TABLE receipts ADD COLUMN aiResult TEXT`).run();
    console.log("Migrated: added receipts.aiResult");
  }

  // Remove legacy ai_result if present
  if (columnExists("receipts", "ai_result")) {
    console.log(
      "Legacy column receipts.ai_result detected (not removing automatically)."
    );
  }

  // Add category
  if (!columnExists("receipts", "category")) {
    db.prepare(`ALTER TABLE receipts ADD COLUMN category TEXT`).run();
    console.log("Migrated: added receipts.category");
  }

  // Add subCategory
  if (!columnExists("receipts", "subCategory")) {
    db.prepare(`ALTER TABLE receipts ADD COLUMN subCategory TEXT`).run();
    console.log("Migrated: added receipts.subCategory");
  }
}

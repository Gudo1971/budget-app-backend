"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateReceiptsTable = migrateReceiptsTable;
const db_1 = require("./db");
function migrateReceiptsTable() {
    // Helper: check if a column exists
    const columnExists = (table, column) => {
        const row = db_1.db
            .prepare(`PRAGMA table_info(${table})`)
            .all()
            .find((col) => col.name === column);
        return !!row;
    };
    // Add ocrText
    if (!columnExists("receipts", "ocrText")) {
        db_1.db.prepare(`ALTER TABLE receipts ADD COLUMN ocrText TEXT`).run();
        console.log("Migrated: added receipts.ocrText");
    }
    // Add aiResult
    if (!columnExists("receipts", "aiResult")) {
        db_1.db.prepare(`ALTER TABLE receipts ADD COLUMN aiResult TEXT`).run();
        console.log("Migrated: added receipts.aiResult");
    }
    // Remove legacy ai_result if present
    if (columnExists("receipts", "ai_result")) {
        console.log("Legacy column receipts.ai_result detected (not removing automatically).");
    }
    // Add category
    if (!columnExists("receipts", "category")) {
        db_1.db.prepare(`ALTER TABLE receipts ADD COLUMN category TEXT`).run();
        console.log("Migrated: added receipts.category");
    }
    // Add subCategory
    if (!columnExists("receipts", "subCategory")) {
        db_1.db.prepare(`ALTER TABLE receipts ADD COLUMN subCategory TEXT`).run();
        console.log("Migrated: added receipts.subCategory");
    }
}

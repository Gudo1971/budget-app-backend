"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateCategory = findOrCreateCategory;
const db_1 = require("../../lib/db");
function findOrCreateCategory(name) {
    const existing = db_1.db
        .prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)")
        .get(name);
    if (existing?.id)
        return existing.id;
    const insert = db_1.db
        .prepare("INSERT INTO categories (name, type) VALUES (?, ?)")
        .run(name, "variable");
    return insert.lastInsertRowid;
}

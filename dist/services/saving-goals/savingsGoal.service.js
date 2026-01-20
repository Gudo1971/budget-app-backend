"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savingGoalService = savingGoalService;
const db_1 = require("../../lib/db");
function savingGoalService(data) {
    const insert = db_1.db
        .prepare("INSERT INTO savings_goals (name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?)")
        .run(data.name, data.target_amount, data.current_amount, data.deadline);
    return insert.lastInsertRowid;
}

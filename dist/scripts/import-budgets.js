"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importBudgetsCsv = importBudgetsCsv;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = require("../scripts/csv.parser");
const budget_service_1 = require("../services/budgets/budget.service");
async function importBudgetsCsv(path) {
    const buffer = fs_1.default.readFileSync(path);
    const rows = await (0, csv_parser_1.parseCsv)(buffer);
    for (const row of rows) {
        await (0, budget_service_1.createBudget)({
            category: row.category,
            amount: Number(row.amount),
            period: row.period,
        });
    }
    console.log("Budgets imported:", rows.length);
}

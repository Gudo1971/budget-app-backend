"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSavingsGoalsCsv = importSavingsGoalsCsv;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = require("../scripts/csv.parser");
const savingsGoal_service_1 = require("../services/saving-goals/savingsGoal.service");
async function importSavingsGoalsCsv(path) {
    const buffer = fs_1.default.readFileSync(path);
    const rows = await (0, csv_parser_1.parseCsv)(buffer);
    for (const row of rows) {
        await (0, savingsGoal_service_1.savingGoalService)({
            name: row.name,
            target_amount: Number(row.target_amount),
            current_amount: Number(row.current_amount),
            deadline: row.deadline,
        });
    }
    console.log("Savings goals imported:", rows.length);
}

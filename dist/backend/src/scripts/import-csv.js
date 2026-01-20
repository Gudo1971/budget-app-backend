"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCsv = importCsv;
const fs_1 = __importDefault(require("fs"));
const transactions_service_1 = require("../services/transactions/transactions.service");
const csv_parser_1 = require("../scripts/csv.parser"); // buffer-based parser
async function importCsv(filePath) {
    // 1. Lees CSV-bestand in als Buffer
    const buffer = fs_1.default.readFileSync(filePath);
    // 2. Parse CSV vanuit Buffer
    const rows = await (0, csv_parser_1.parseCsv)(buffer);
    const results = [];
    for (const row of rows) {
        const extracted = {
            total: row.amount,
            date: row.date,
            merchant: row.merchant,
            merchant_category: row.category ?? null,
        };
        const form = {
            amount: row.amount,
            date: row.date,
            merchant: row.merchant,
            description: row.description ?? row.merchant,
            category_id: null,
        };
        // 3. Uniform create flow
        const created = transactions_service_1.transactionService.create({
            receiptId: null,
            extracted,
            form,
            source: "csv",
        });
        results.push(created);
    }
    console.log("CSV import results:", results);
}

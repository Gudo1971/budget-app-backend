"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importTransactionsCsv = importTransactionsCsv;
const csv_parser_1 = require("./csv.parser");
const transactions_service_1 = require("../services/transactions/transactions.service");
const fs_1 = __importDefault(require("fs"));
const categorizeTransaction_1 = require("../categorization/categorizeTransaction");
async function importTransactionsCsv(filePath, userId) {
    const buffer = fs_1.default.readFileSync(filePath);
    const rows = await (0, csv_parser_1.parseCsv)(buffer);
    for (const row of rows) {
        const merchantName = row.description;
        const description = row.description;
        const categorized = await (0, categorizeTransaction_1.categorizeTransaction)({
            userId,
            merchantName,
            description,
            amount: row.amount,
            date: row.date,
        });
        await transactions_service_1.transactionService.create({
            receiptId: null,
            extracted: {
                total: row.amount,
                date: row.date,
                merchant: merchantName,
                merchant_category: categorized.category,
                merchant_subcategory: categorized.subcategory,
            },
            form: {
                amount: row.amount,
                date: row.date,
                merchant: merchantName,
                description: row.description,
                category: categorized.category,
                subcategory: categorized.subcategory,
            },
            source: "csv",
        });
    }
    console.log("CSV import complete with new categorization engine");
}

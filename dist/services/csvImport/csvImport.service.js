"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvImportService = void 0;
const csv_parser_1 = require("../../scripts/csv.parser");
const transactions_service_1 = require("../transactions/transactions.service");
exports.csvImportService = {
    async import(buffer) {
        // 1. Parse CSV from buffer
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
            // ⭐ FIX: wacht op database opslag
            const created = await transactions_service_1.transactionService.create({
                receiptId: null,
                extracted,
                form,
                source: "csv",
            });
            results.push(created);
        }
        return {
            success: true,
            data: results,
            error: null,
        };
    },
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualImportService = void 0;
const transactions_service_1 = require("../transactions/transactions.service");
exports.manualImportService = {
    create(form) {
        const extracted = {}; // manual input heeft geen extracted data
        return transactions_service_1.transactionService.create({
            receiptId: null,
            extracted,
            form,
            source: "manual",
        });
    },
};

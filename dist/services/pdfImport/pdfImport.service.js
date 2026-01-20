"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfImportService = void 0;
const pdf_parser_1 = require("./pdf.parser");
const transactions_service_1 = require("../transactions/transactions.service");
exports.pdfImportService = {
    async import(buffer) {
        // 1. Extract data from PDF
        const { extracted, form } = await (0, pdf_parser_1.parsePdf)(buffer);
        // 2. Create transaction via central flow
        const created = transactions_service_1.transactionService.create({
            receiptId: null,
            extracted,
            form,
            source: "pdf",
        });
        return created;
    },
};

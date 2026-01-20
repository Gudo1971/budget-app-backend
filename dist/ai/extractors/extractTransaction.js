"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTransaction = extractTransaction;
const engine_1 = require("../engine/engine");
const transactionExtractionPrompt_1 = require("../prompts/transactionExtractionPrompt");
const TransactionSchema_1 = require("../schemas/TransactionSchema");
async function extractTransaction(text) {
    return await (0, engine_1.runExtraction)((0, transactionExtractionPrompt_1.transactionExtractionPrompt)(text), TransactionSchema_1.TransactionSchema);
}

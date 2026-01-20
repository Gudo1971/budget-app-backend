"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractReceipt = extractReceipt;
const engine_1 = require("../engine/engine");
const receiptExtractionPrompt_1 = require("../prompts/receiptExtractionPrompt");
const ReceiptSchema_1 = require("../schemas/ReceiptSchema");
async function extractReceipt(ocrText) {
    return await (0, engine_1.runExtraction)((0, receiptExtractionPrompt_1.receiptExtractionPrompt)(ocrText), ReceiptSchema_1.ReceiptSchema);
}

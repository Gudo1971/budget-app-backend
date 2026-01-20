"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiPdfExtractRouter = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const extractTransactionsFromPdfText_1 = require("../../ai/extractors/extractTransactionsFromPdfText");
const simplePdfToText_1 = require("../../services/pdf/simplePdfToText");
const upload = (0, multer_1.default)({
    // optioneel: beperk de bestandsgrootte (pas aan naar wens)
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
exports.aiPdfExtractRouter = express_1.default.Router();
exports.aiPdfExtractRouter.post("/pdf-extract", upload.single("pdf"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "PDF ontbreekt" });
        }
        // 1) PDF -> tekst
        const text = await (0, simplePdfToText_1.simplePdfToText)(file.buffer);
        console.log("PDF TEXT (first 500 chars):\n", text.slice(0, 500));
        // 2) Tekst -> transacties
        let transactions;
        try {
            transactions = await (0, extractTransactionsFromPdfText_1.extractTransactionsFromPdfText)(text);
        }
        catch (innerErr) {
            // Veilig extracten van foutdetails (TypeScript-compatibel)
            const innerMsg = innerErr?.message ?? String(innerErr);
            const innerStack = innerErr?.stack ?? undefined;
            // Fallback/logging: laat de fout duidelijk zien en probeer graceful fallback
            console.error("extractTransactionsFromPdfText failed:", innerMsg, innerStack);
            // Geef de originele fout terug (400 of 500 afhankelijk van hoe je het wilt)
            return res.status(500).json({
                error: "Fout bij het extraheren van transacties",
                details: innerMsg,
            });
        }
        // 3) Normaliseer de return-waarde: verwacht array van transacties
        if (!transactions) {
            transactions = [];
        }
        else if (!Array.isArray(transactions)) {
            // Mogelijke vormen:
            // - { rows: [...] }
            // - { transactions: [...] }
            // - een enkel object => wrap in array
            if (Array.isArray(transactions.rows)) {
                transactions = transactions.rows;
            }
            else if (Array.isArray(transactions.transactions)) {
                transactions = transactions.transactions;
            }
            else {
                transactions = [transactions];
            }
        }
        console.log("Extracted transactions count:", transactions.length);
        console.log("First transaction (if any):", transactions[0] ?? null);
        return res.json({ rows: transactions });
    }
    catch (err) {
        const errMsg = err?.message ?? String(err);
        const errStack = err?.stack ?? undefined;
        console.error("PDF extract error:", errMsg, errStack);
        return res
            .status(500)
            .json({ error: "Kon PDF niet verwerken", details: errMsg });
    }
});

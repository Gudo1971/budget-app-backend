"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const pdfImport_service_1 = require("../services/pdfImport/pdfImport.service");
const csvImport_service_1 = require("../services/csvImport/csvImport.service");
const manualImport_service_1 = require("../services/manualImport/manualImport.service");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
/**
 * PDF IMPORT
 */
router.post("/pdf-transactions", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No PDF uploaded" });
        }
        const result = await pdfImport_service_1.pdfImportService.import(req.file.buffer);
        res.json(result);
    }
    catch (err) {
        console.error("PDF import error:", err);
        res.status(500).json({ error: "Failed to import PDF" });
    }
});
/**
 * CSV IMPORT
 */
router.post("/csv-transactions", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No CSV uploaded" });
        }
        const result = await csvImport_service_1.csvImportService.import(req.file.buffer);
        res.json(result);
    }
    catch (err) {
        console.error("CSV import error:", err);
        res.status(500).json({ error: "Failed to import CSV" });
    }
});
/**
 * MANUAL IMPORT
 */
router.post("/manual-transaction", async (req, res) => {
    try {
        const form = req.body;
        const result = manualImport_service_1.manualImportService.create(form);
        res.json(result);
    }
    catch (err) {
        console.error("Manual import error:", err);
        res.status(500).json({ error: "Failed to import manual transaction" });
    }
});
exports.default = router;

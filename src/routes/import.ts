import express from "express";
import multer from "multer";

import { pdfImportService } from "../services/pdfImport/pdfImport.service";
import { csvImportService } from "../services/csvImport/csvImport.service";
import { manualImportService } from "../services/manualImport/manualImport.service";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * PDF IMPORT
 */
router.post("/pdf-transactions", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    const result = await pdfImportService.import(req.file.buffer);
    res.json(result);
  } catch (err) {
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

    const result = await csvImportService.import(req.file.buffer);
    res.json(result);
  } catch (err) {
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
    const result = manualImportService.create(form);
    res.json(result);
  } catch (err) {
    console.error("Manual import error:", err);
    res.status(500).json({ error: "Failed to import manual transaction" });
  }
});

export default router;

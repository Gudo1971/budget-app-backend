"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../../lib/db");
const findMatchingTransaction_1 = require("../../ai/matching/findMatchingTransaction");
const upload_1 = __importDefault(require("./upload"));
const confirmLink_1 = __importDefault(require("./confirmLink"));
const router = (0, express_1.Router)();
const USER_ID = "demo-user";
const userUploadDir = path_1.default.join(process.cwd(), "uploads", USER_ID);
fs_1.default.mkdirSync(userUploadDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, userUploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, unique + ext);
    },
});
const upload = (0, multer_1.default)({ storage });
// ------------------------------------------------------------
// GET /receipts → alle bonnen
// ------------------------------------------------------------
router.get("/", (req, res) => {
    try {
        const receipts = db_1.db
            .prepare(`
        SELECT 
          id, 
          filename, 
          original_name, 
          uploaded_at, 
          status,
          transaction_id,
          ocrText, 
          aiResult 
        FROM receipts 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
        `)
            .all(USER_ID);
        res.json(receipts);
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch receipts" });
    }
});
// ------------------------------------------------------------
// GET /receipts/:id → één bon
// ------------------------------------------------------------
router.get("/:id", (req, res) => {
    const { id } = req.params;
    const receipt = db_1.db
        .prepare(`
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `)
        .get(id, USER_ID);
    if (!receipt)
        return res.status(404).json({ error: "Receipt not found" });
    res.json(receipt);
});
// ------------------------------------------------------------
// GET /receipts/:id/file → download
// ------------------------------------------------------------
router.get("/:id/file", (req, res) => {
    const { id } = req.params;
    const receipt = db_1.db
        .prepare(`
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `)
        .get(id, USER_ID);
    if (!receipt)
        return res.status(404).json({ error: "Receipt not found" });
    const filePath = path_1.default.join(userUploadDir, receipt.filename);
    if (!fs_1.default.existsSync(filePath))
        return res.status(404).json({ error: "File not found" });
    res.setHeader("Content-Disposition", `attachment; filename="${receipt.original_name}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.sendFile(filePath);
});
// ------------------------------------------------------------
// POST /receipts/upload → BULK UPLOAD
// ------------------------------------------------------------
router.post("/upload-bulk", upload.array("files", 20), (req, res) => {
    const files = req.files;
    if (!files || files.length === 0)
        return res.status(400).json({ error: "No files uploaded" });
    const stmt = db_1.db.prepare(`
      INSERT INTO receipts 
      (filename, original_name, user_id, status) 
      VALUES (?, ?, ?, 'pending')
      `);
    for (const file of files) {
        stmt.run(file.filename, file.originalname, USER_ID);
    }
    const receipts = db_1.db
        .prepare(`
        SELECT 
          id, 
          filename, 
          original_name, 
          uploaded_at, 
          status,
          transaction_id,
          ocrText, 
          aiResult 
        FROM receipts 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
        `)
        .all(USER_ID);
    res.json({ message: "Receipts uploaded", receipts });
});
// ------------------------------------------------------------
// POST /receipts/upload/smart → SLIMME UPLOAD
// ------------------------------------------------------------
router.post("/upload/smart", upload.single("file"), upload_1.default);
// ------------------------------------------------------------
// DELETE /receipts/:id
// ------------------------------------------------------------
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const receipt = db_1.db
        .prepare(`
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `)
        .get(id, USER_ID);
    if (!receipt)
        return res.status(404).json({ error: "Receipt not found" });
    const filePath = path_1.default.join(userUploadDir, receipt.filename);
    if (fs_1.default.existsSync(filePath))
        fs_1.default.unlinkSync(filePath);
    db_1.db.prepare("DELETE FROM receipts WHERE id = ? AND user_id = ?").run(id, USER_ID);
    res.json({ message: "Receipt deleted" });
});
// ------------------------------------------------------------
// PUT /receipts/:id/confirm-link → koppel aan transactie
// ------------------------------------------------------------
router.use("/", confirmLink_1.default);
// ------------------------------------------------------------
// GET /receipts/:id/match → AI matchen met transacties
// ------------------------------------------------------------
router.get("/:id/match", async (req, res) => {
    const { id } = req.params;
    const receipt = db_1.db
        .prepare(`
      SELECT 
        id, 
        filename, 
        original_name, 
        uploaded_at, 
        status,
        transaction_id,
        ocrText, 
        aiResult 
      FROM receipts 
      WHERE id = ? AND user_id = ?
      `)
        .get(id, USER_ID);
    if (!receipt) {
        return res.status(404).json({ error: "Receipt not found" });
    }
    let extracted;
    try {
        extracted = JSON.parse(receipt.aiResult ?? "{}");
    }
    catch {
        extracted = {};
    }
    const matchResult = await (0, findMatchingTransaction_1.findMatchingTransaction)({
        receiptId: receipt.id,
        amount: extracted.total ?? 0,
        date: extracted.date ?? "",
        merchant: extracted.merchant ?? "",
    });
    res.json(matchResult);
});
exports.default = router;

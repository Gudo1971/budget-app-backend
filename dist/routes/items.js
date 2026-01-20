"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const extractItems_1 = require("../ai/extractors/extractItems");
const router = express_1.default.Router();
router.post("/extract", async (req, res) => {
    try {
        const { ocrText } = req.body;
        if (!ocrText) {
            return res.status(400).json({ error: "Missing ocrText field" });
        }
        const items = await (0, extractItems_1.extractItems)(ocrText);
        res.json({
            success: true,
            items,
        });
    }
    catch (err) {
        console.error("Item extraction error:", err);
        res.status(500).json({ error: "AI item extraction failed" });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = __importDefault(require("openai"));
const router = (0, express_1.Router)();
const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
router.post("/", async (req, res) => {
    const { input } = req.body;
    try {
        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input
        });
        res.json({ output: response.output_text });
    }
    catch (err) {
        console.error("🧮 USAGE DEBUG ERROR:", err);
        res.status(500).json({ error: "Usage debug failed" });
    }
});
exports.default = router;

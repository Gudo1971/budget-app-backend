"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractReceiptFromImage = extractReceiptFromImage;
const runVisionExtraction_1 = require("../engine/runVisionExtraction");
async function extractReceiptFromImage(image) {
    const base64 = image.toString("base64");
    const prompt = `
You are a receipt extraction and categorization engine.
Extract ALL structured data from this receipt image.
Return ONLY valid JSON with the following fields:

{
  "merchant": string | null,
  "merchant_category": string | null,
  "category": string | null,
  "subcategory": string | null,
  "date": string | null,
  "total": number | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "price": number,
      "total": number
    }
  ]
}

Rules:
- ALWAYS include all fields, even if null.
- Determine merchant_category based on merchant name and items.
- Determine category and subcategory using common budgeting categories (e.g. restaurant, groceries, transport, clothing, electronics, health, subscriptions).
- If the date is unclear, estimate it from the receipt layout or timestamps.
- Do NOT include any text outside the JSON.
`;
    const parsedJson = (await (0, runVisionExtraction_1.runVisionExtraction)(base64, prompt));
    return {
        ocrText: "",
        parsedJson,
    };
}

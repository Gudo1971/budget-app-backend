"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractItems = extractItems;
const engine_1 = require("../engine/engine");
const itemExtractionPrompt_1 = require("../prompts/itemExtractionPrompt");
const ItemListSchema_1 = require("../schemas/ItemListSchema");
async function extractItems(ocrText) {
    const items = await (0, engine_1.runExtraction)((0, itemExtractionPrompt_1.itemExtractionPrompt)(ocrText), ItemListSchema_1.ItemListSchema);
    // Geen budget-mapping, alleen AI-items teruggeven
    return items;
}

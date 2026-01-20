"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guessSubcategory = guessSubcategory;
function guessSubcategory(category, merchantName, description) {
    const lower = (merchantName + " " + description).toLowerCase();
    if (lower.includes("netflix"))
        return "Streaming";
    if (lower.includes("spotify"))
        return "Muziek";
    if (lower.includes("youtube"))
        return "Video";
    if (lower.includes("restaurant") || lower.includes("eten"))
        return "Uit eten";
    if (lower.includes("ns") || lower.includes("ov"))
        return "Openbaar vervoer";
    return null;
}

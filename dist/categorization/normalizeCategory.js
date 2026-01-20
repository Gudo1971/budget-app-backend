"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_MAP = void 0;
exports.normalizeCategory = normalizeCategory;
exports.CATEGORY_MAP = {
    Dining: "Eten & Drinken",
    "Food & Drink": "Eten & Drinken",
    "Food & Drinks": "Eten & Drinken",
    Food: "Eten & Drinken",
    Drink: "Eten & Drinken",
    Restaurant: "Restaurant",
    Café: "Café",
    Groceries: "Boodschappen",
    Supermarket: "Boodschappen",
    Transportation: "Vervoer",
    Electronics: "Elektronica",
};
function normalizeCategory(cat) {
    if (!cat)
        return "";
    return exports.CATEGORY_MAP[cat] ?? cat;
}

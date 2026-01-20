"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCategoriesCsv = importCategoriesCsv;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = require("../scripts/csv.parser");
const category_service_1 = require("../services/categories/category.service");
async function importCategoriesCsv(path) {
    const buffer = fs_1.default.readFileSync(path);
    const rows = await (0, csv_parser_1.parseCsv)(buffer);
    for (const row of rows) {
        await (0, category_service_1.findOrCreateCategory)(row.name);
    }
    console.log("Categories imported:", rows.length);
}

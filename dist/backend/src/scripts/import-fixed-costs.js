"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFixedCostsCsv = importFixedCostsCsv;
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = require("../scripts/csv.parser");
const fixedCost_service_1 = require("../services/fixed-costs/fixedCost.service");
async function importFixedCostsCsv(path) {
    const buffer = fs_1.default.readFileSync(path);
    const rows = await (0, csv_parser_1.parseCsv)(buffer);
    for (const row of rows) {
        await (0, fixedCost_service_1.createFixedCost)({
            name: row.name,
            amount: Number(row.amount),
            interval: row.interval,
        });
    }
    console.log("Fixed costs imported:", rows.length);
}

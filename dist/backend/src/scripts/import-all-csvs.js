"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const import_transactions_1 = require("./import-transactions");
async function importAllCsvs() {
    const dataDir = path_1.default.join(__dirname, "..", "data");
    const files = fs_1.default.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));
    console.log(`Found ${files.length} CSV files`);
    for (const file of files) {
        const filePath = path_1.default.join(dataDir, file);
        console.log("Importing:", file);
        if (file.includes("transactions")) {
            await (0, import_transactions_1.importTransactionsCsv)(filePath, "demo-user");
        }
        else {
            console.log("Skipping non-transaction CSV:", file);
        }
    }
    console.log("All CSVs imported successfully.");
}
importAllCsvs();

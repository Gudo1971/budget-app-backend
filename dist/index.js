"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
// ROUTES
const transactions_1 = __importDefault(require("./routes/transactions"));
const categories_1 = __importDefault(require("./routes/categories"));
const budgets_1 = __importDefault(require("./routes/budgets"));
const fixed_costs_1 = __importDefault(require("./routes/fixed-costs"));
const savings_goals_1 = __importDefault(require("./routes/savings-goals"));
const budget_categories_1 = __importDefault(require("./routes/budget-categories"));
const split_transactions_1 = require("./routes/split-transactions");
const receipts_1 = __importDefault(require("./routes/receipts"));
const items_1 = __importDefault(require("./routes/items"));
const merchant_categories_1 = __importDefault(require("./routes/merchant-categories"));
const aiPdfextract_1 = require("./routes/ai/aiPdfextract");
const upload_1 = __importDefault(require("./routes/receipts/upload"));
const categorize_1 = __importDefault(require("./routes/categorize"));
const migrations_1 = require("./lib/migrations");
const archive_1 = __importDefault(require("./routes/receipts/archive"));
// ⭐ Migraties uitvoeren
(0, migrations_1.migrateReceiptsTable)();
console.log("🔥 INDEX STARTED");
const app = (0, express_1.default)(); // <-- DIT MOET BOVEN ALLE app.use() STAAN
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(requestLogger_1.requestLogger);
app.use("/api/ai", aiPdfextract_1.aiPdfExtractRouter);
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
// ⭐ API ROUTES (nu op de juiste plek)
app.use("/api/transactions", transactions_1.default);
app.use("/api/categories", categories_1.default);
app.use("/api/budgets", budgets_1.default);
app.use("/api/fixed-costs", fixed_costs_1.default);
app.use("/api/savings-goals", savings_goals_1.default);
app.use("/api/budget-categories", budget_categories_1.default);
app.use("/api/split-transactions", split_transactions_1.splitTransactionsRouter);
app.use("/api/receipts", receipts_1.default);
app.use("/api/items", items_1.default);
app.use("/api/merchant-categories", merchant_categories_1.default);
app.use("/api/receipts", archive_1.default);
app.post("/api/receipts/upload", upload_1.default);
app.use("/api/categorize", categorize_1.default);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Using DB file:", path_1.default.resolve("budget.db"));
});

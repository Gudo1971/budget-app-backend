import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

// ROUTES
import transactionsRouter from "./routes/transactions";
import categoriesRouter from "./routes/categories";
import budgetRouter from "./routes/budgets";
import fixedCostsRouter from "./routes/fixed-costs";
import savingsGoalsRouter from "./routes/savings-goals";
import budgetCategoriesRouter from "./routes/budget-categories";
import splitTransactionsRouter from "./routes/split-transactions";
import receiptsRouter from "./routes/receipts";
import transactionRoutes from "./routes/transactions";
import itemRoutes from "./routes/items";

// ERROR HANDLER
console.log("🔥 INDEX STARTED");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(requestLogger);

// API ROUTES
app.use("/api/transactions", transactionsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/fixed-costs", fixedCostsRouter);
app.use("/api/savings-goals", savingsGoalsRouter);
app.use("/api/budget-categories", budgetCategoriesRouter);
app.use("/api/split-transactions", splitTransactionsRouter);
app.use("/api/receipts", receiptsRouter);
app.use("/api/transaction", transactionRoutes);
app.use("/api/items", itemRoutes);

// ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// ⭐ DIT IS DE BELANGRIJKSTE REGEL
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Using DB file:", path.resolve("budget.db"));
});

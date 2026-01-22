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
import { splitTransactionsRouter } from "./routes/split-transactions";
import receiptsRouter from "./routes/receipts";
import itemRoutes from "./routes/items";
import merchantCategoryRoute from "./routes/merchant-categories";
import { aiPdfExtractRouter } from "./routes/ai/aiPdfextract";
import smartUploadReceipt from "./routes/receipts/upload";

import archiveRoutes from "./routes/receipts/archive";
import { debugRouter } from "./routes/debug.routes";
import fetch from "node-fetch";

// ⭐ Helper: run daily at specific time
function runAt(hour: number, minute: number, callback: () => void) {
  const now = new Date();
  const next = new Date();

  next.setHours(hour, minute, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  const delay = next.getTime() - now.getTime();

  setTimeout(() => {
    callback();
    setInterval(callback, 24 * 60 * 60 * 1000);
  }, delay);
}

// ⭐ Cronjob wrapper
async function retrainLowConfidence(PORT: number) {
  try {
    console.log("[cron] Running low-confidence retraining...");

    const response = await fetch(
      `http://localhost:${PORT}/debug/retrain-low-confidence`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    );

    const result = await response.json();
    console.log("[cron] Retrain result:", result);
  } catch (err) {
    console.error("[cron] Error during retraining:", err);
  }
}

console.log("🔥 INDEX STARTED");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(requestLogger);

app.use("/api/ai", aiPdfExtractRouter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ⭐ API ROUTES
app.use("/api/transactions", transactionsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/budgets", budgetRouter);
app.use("/api/fixed-costs", fixedCostsRouter);
app.use("/api/savings-goals", savingsGoalsRouter);
app.use("/api/budget-categories", budgetCategoriesRouter);
app.use("/api/split-transactions", splitTransactionsRouter);
app.use("/api/receipts", receiptsRouter);
app.use("/api/items", itemRoutes);
app.use("/api/merchant-categories", merchantCategoryRoute);
app.use("/api/receipts", archiveRoutes);
app.use("/debug", debugRouter);
app.post("/api/receipts/upload", smartUploadReceipt);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Using DB file:", path.resolve("budget.db"));

  // ⭐ Start cronjob at 03:00 every night
  runAt(3, 0, () => retrainLowConfidence(Number(PORT)));
});

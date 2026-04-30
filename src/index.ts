import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

// ✅ Future-proof: Environment en database validatie
import { env } from "./lib/env";
import { checkDatabaseHealth, pool } from "./lib/db";
import { runMigrations } from "./lib/migrations";

import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

// ROUTES
import transactionsRouter from "./routes/transactions";
import categoriesRouter from "./routes/categories";
import budgetRouter from "./routes/budget";
import fixedCostsRouter from "./routes/fixed-costs";
import savingsGoalsRouter from "./routes/savings-goals";
import budgetCategoriesRouter from "./routes/budget-categories";
import { splitTransactionsRouter } from "./routes/split-transactions";
import receiptsRouter from "./routes/receipts";
import itemRoutes from "./routes/items";
import merchantCategoryRoute from "./routes/merchant-categories";
import { aiPdfExtractRouter } from "./routes/ai/aiPdfextract";
import smartUploadReceipt from "./routes/receipts/upload";
import monthRouter from "./routes/month";

import archiveRoutes from "./routes/receipts/archive";
import { debugRouter } from "./routes/debug.routes";
import fetch from "node-fetch";
import summaryRouter from "./routes/summary";

import { subBudgetRouter } from "./routes/subBudgetRouter";

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

console.log("🔥 Starting Budget App Backend...");

// ✅ Future-proof: Valideer database connectie voor startup
async function startServer() {
  // 1. Check database health
  console.log("🔍 Checking database connection...");
  const isHealthy = await checkDatabaseHealth();
  if (!isHealthy) {
    console.error("❌ Database connection failed. Exiting...");
    process.exit(1);
  }
  console.log("✅ Database connection successful");

  // 2. Run migrations
  console.log("🔄 Running database migrations...");
  try {
    await runMigrations();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  // 3. Start Express server
  const app = express();

  // ✅ CORS configuratie - Allow Vercel + localhost
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://budget-app-frontend-orpin.vercel.app",
    "https://budget-app-frontend-orpin.vercel.app/",
    // Vercel preview deployments
    /https:\/\/budget-app-frontend-.*\.vercel\.app$/,
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list or matches regex
        const isAllowed = allowedOrigins.some((allowed) => {
          if (typeof allowed === "string") {
            return origin === allowed || origin === allowed.replace(/\/$/, "");
          }
          return allowed.test(origin);
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn("⚠️ CORS blocked origin:", origin);
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    }),
  );
  app.use(requestLogger);

  app.use("/api/ai", aiPdfExtractRouter);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // ⭐ API ROUTES

  // ⭐ Serve uploaded receipt images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Health check endpoint
  app.get("/health", async (req, res) => {
    const dbHealthy = await checkDatabaseHealth();
    res.status(dbHealthy ? 200 : 503).json({
      status: dbHealthy ? "healthy" : "unhealthy",
      database: dbHealthy ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/transactions", transactionsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/budget", budgetRouter);
  app.use("/api/fixed-costs", fixedCostsRouter);
  app.use("/api/savings-goals", savingsGoalsRouter);
  app.use("/api/budget-categories", budgetCategoriesRouter);
  app.use("/api/sub-budgets", subBudgetRouter);
  app.use("/api/split-transactions", splitTransactionsRouter);
  app.use("/api/receipts", receiptsRouter);
  app.use("/api/items", itemRoutes);
  app.use("/api/merchant-categories", merchantCategoryRoute);
  app.use("/api/receipts", archiveRoutes);
  app.use("/debug", debugRouter);
  app.post("/api/receipts/upload", smartUploadReceipt);
  app.use("/api/summary", summaryRouter);
  app.use("/api/month", monthRouter);
  app.use(errorHandler);

  const PORT = env.PORT;

  app.listen(PORT, () => {
    console.log("✅ Server running on http://localhost:" + PORT);
    console.log("✅ Database: PostgreSQL (pooled connections)");
    console.log("✅ Environment:", env.NODE_ENV);

    // ⭐ Start cronjob at 03:00 every night
    runAt(3, 0, () => retrainLowConfidence(Number(PORT)));
  });

  // ✅ Future-proof: Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("🛑 SIGTERM received, closing server gracefully...");
    await pool.end();
    process.exit(0);
  });
}

// Start de server
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});

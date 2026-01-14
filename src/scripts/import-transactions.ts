import { parseCsv } from "./csv.parser";
import { transactionService } from "../services/transactions/transactions.service";
import { db } from "../lib/db";
import fs from "fs";
import { categorizeTransaction } from "../categorization/categorizeTransaction";

export async function importTransactionsCsv(filePath: string, userId: string) {
  const buffer = fs.readFileSync(filePath);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    const merchantName = row.description;
    const description = row.description;

    const categorized = await categorizeTransaction({
      userId,
      merchantName,
      description,
      amount: row.amount,
      date: row.date,
    });

    await transactionService.create({
      receiptId: null,
      extracted: {
        total: row.amount,
        date: row.date,
        merchant: merchantName,
        merchant_category: categorized.category,
        merchant_subcategory: categorized.subcategory,
      },
      form: {
        amount: row.amount,
        date: row.date,
        merchant: merchantName,
        description: row.description,
        category: categorized.category,
        subcategory: categorized.subcategory,
      },
      source: "csv",
    });
  }

  console.log("CSV import complete with new categorization engine");
}

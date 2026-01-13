import fs from "fs";
import { transactionService } from "../services/transactions/transaction.service";
import { parseCsv } from "../scripts/csv.parser"; // buffer-based parser

async function importCsv(filePath: string) {
  // 1. Lees CSV-bestand in als Buffer
  const buffer = fs.readFileSync(filePath);

  // 2. Parse CSV vanuit Buffer
  const rows = await parseCsv(buffer);

  const results = [];

  for (const row of rows) {
    const extracted = {
      total: row.amount,
      date: row.date,
      merchant: row.merchant,
      merchant_category: row.category ?? null,
    };

    const form = {
      amount: row.amount,
      date: row.date,
      merchant: row.merchant,
      description: row.description ?? row.merchant,
      category_id: null,
    };

    // 3. Uniform create flow
    const created = transactionService.create({
      receiptId: null,
      extracted,
      form,
      source: "csv",
    });

    results.push(created);
  }

  console.log("CSV import results:", results);
}

export { importCsv };

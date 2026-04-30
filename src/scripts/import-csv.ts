import fs from "fs";
import path from "path";
import csv from "csv-parser";

import { resolveMerchantMemory } from "../services/merchantMemory/service/resolveMerchantMemory";
import { resolveCategory } from "../services/categories/resolveCategory";
import { pool } from "../lib/db";

const userId = "demo-user"; // <-- jouw user

export async function importCsv(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(path.resolve(filePath))
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          for (const row of rows) {
            const merchant = row.merchant || row.Merchant || row.MERCHANT || "";
            const description =
              row.description || row.Description || row.DESCRIPTION || "";
            const amount = parseFloat(
              row.amount || row.Amount || row.AMOUNT || "0",
            );

            // 1. Merchant memory
            const merchantResolved = await resolveMerchantMemory(
              userId,
              merchant,
            );

            // 2. Category resolution
            const categoryResolved = await resolveCategory(
              userId,
              merchant,
              description,
              amount,
            );

            // 3. Insert transaction (PostgreSQL)
            await pool.query(
              `
              INSERT INTO transactions (user_id, merchant, description, amount, category_id)
              VALUES ($1, $2, $3, $4, $5)
              `,
              [
                userId,
                merchant,
                description,
                amount,
                categoryResolved.category_id,
              ],
            );
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      });
  });
}

// CLI usage
if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: ts-node import-csv.ts <file.csv>");
    process.exit(1);
  }

  importCsv(file)
    .then(() => console.log("CSV import completed"))
    .catch((err) => console.error("Import failed:", err));
}

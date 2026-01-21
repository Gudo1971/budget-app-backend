import { cleanMerchant } from "../utils/cleanMerchant";
import fs from "fs";
import { parseCsv } from "./csv.parser";
import { categorizeTransaction } from "../categorization/categorizeTransaction";
import { transactionService } from "../services/transactions/transactions.service";

export async function importTransactionsCsv(filePath: string, userId: string) {
  const buffer = fs.readFileSync(filePath);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    const merchant_raw = row.description ?? "";
    const merchant = cleanMerchant(merchant_raw);
    const description = row.description ?? merchant;
    const amount = Number(row.amount);
    const date = row.date;

    const categorized = await categorizeTransaction(
      userId,
      merchant,
      amount,
      description,
    );

    await transactionService.create({
      receiptId: null,
      extracted: {
        total: amount,
        date,
        merchant_raw,
        merchant,
        merchant_category: categorized.category,
        merchant_subcategory: categorized.subcategory,
      },
      form: {
        amount,
        date,
        merchant,
        merchant_raw,
        description,
        category: categorized.category,
        subcategory: categorized.subcategory,
      },
      source: "csv",
    });
  }

  console.log("CSV import complete with new categorization engine");
}

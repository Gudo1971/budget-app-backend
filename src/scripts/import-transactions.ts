import fs from "fs";
import { parseCsv } from "./csv.parser";
import { normalizeMerchant } from "../shared/services/normalizeMerchant";
import { transactionService } from "../services/transactions/transactions.service";

export async function importTransactionsCsv(filePath: string, userId: string) {
  const buffer = fs.readFileSync(filePath);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    const merchant_raw = row.description ?? "";
    const normMerchant = normalizeMerchant(merchant_raw);

    const amount = Number(row.amount);
    const date = row.date;
    const description = row.description ?? normMerchant.display;

    // ⭐ GEEN category_id meer uit CSV
    // ⭐ GEEN merchant_memory override
    // ⭐ GEEN fallback 13
    // ⭐ GEEN mapCsvCategory
    // ⭐ Backend bepaalt ALLES

    await transactionService.create({
      amount,
      date,
      merchant: normMerchant.display,
      description,
      userId,
      receiptId: null,
    });
  }

  console.log("CSV import complete using NEW backend categorization");
}

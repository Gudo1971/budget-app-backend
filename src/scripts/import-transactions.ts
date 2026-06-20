import fs from "fs";
import { parseCsv } from "./csv.parser";
import { normalizeMerchant } from "../shared/services/normalizeMerchant";
import { transactionService } from "../services/transactions/transactions.service";

export async function importTransactionsCsv(filePath: string, userId: string) {
  const buffer = fs.readFileSync(filePath);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    // ⭐ Normalize
    const date = (row.date || "").trim();
    const description = (row.description || "").trim();
    const amountRaw = (row.amount || "").trim();

    // ⭐ Skip lege regels
    if (!date || !description || !amountRaw) {
      continue;
    }

    const amount = Number(amountRaw);
    if (Number.isNaN(amount)) {
      continue;
    }

    const merchant_raw = description;
    const normMerchant = normalizeMerchant(merchant_raw);

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

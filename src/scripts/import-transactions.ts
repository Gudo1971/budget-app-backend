import fs from "fs";
import { parseCsv } from "./csv.parser";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";
import { transactionService } from "../services/transactions/transactions.service";
import { findCategoryIdByName } from "../services/categories/category.service";
import { mapCsvCategory } from "@shared/constants/categoryCsvMap";

export async function importTransactionsCsv(filePath: string, userId: string) {
  const buffer = fs.readFileSync(filePath);
  const rows = await parseCsv(buffer);

  for (const row of rows) {
    const merchant_raw = row.description ?? "";
    const normMerchant = normalizeMerchant(merchant_raw);

    const amount = Number(row.amount);
    const date = row.date;
    const description = row.description ?? normMerchant.display;

    // ⭐ Gebruik centrale mapping
    const mappedName = mapCsvCategory(row.category_name);

    const categoryId = findCategoryIdByName(mappedName);

    await transactionService.create({
      receiptId: null,
      extracted: {
        total: amount,
        date,
        merchant_raw,
        merchant: normMerchant.display,
        merchant_category: {
          category_id: categoryId,
          confidence: 1,
          source: "csv",
        },
        category: { category_id: categoryId, confidence: 1, source: "csv" },
        subcategory: null,
      },
      form: {
        amount,
        date,
        merchant: normMerchant.display,
        merchant_raw,
        description,
        category: { category_id: categoryId, confidence: 1, source: "csv" },
        subcategory: null,
      },
      source: "csv",
    });
  }

  console.log("CSV import complete using shared category mapping");
}

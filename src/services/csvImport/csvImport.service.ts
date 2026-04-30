import { parseCsv } from "../../scripts/csv.parser";
import { transactionService } from "../transactions/transactions.service";
import {
  getCategoryForMerchant,
  upsertMerchantMemory,
} from "../merchantMemory/service/merchantMemory.service";
import { normalizeMerchant } from "../../../../shared/services/normalizeMerchant";
import { resolveCategory } from "../categories/resolveCategory";

export const csvImportService = {
  async import(buffer: Buffer) {
    const rows = await parseCsv(buffer);
    const results = [];

    for (const row of rows) {
      const userId = "1";

      const normalized = normalizeMerchant(row.merchant).key;

      // 1) Check merchant memory
      const memory = await getCategoryForMerchant(userId, normalized);

      let categoryId: number | null = null;

      if (memory) {
        categoryId = memory.category_id;
      } else {
        // ⭐ FIXED: resolveCategory correct aangeroepen
        const resolved = await resolveCategory(
          userId,
          normalized,
          row.description ?? row.merchant,
          row.amount,
        );

        categoryId = resolved.category_id;

        // 4) Memory leren
        await upsertMerchantMemory(userId, normalized, categoryId);
      }

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
        category_id: categoryId,
      };

      const created = await transactionService.create({
        receiptId: null,
        extracted,
        form,
        source: "csv",
      });

      results.push(created);
    }

    return {
      success: true,
      data: results,
      error: null,
    };
  },
};

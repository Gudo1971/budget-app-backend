import { parseCsv } from "../../scripts/csv.parser";
import { transactionService } from "../transactions/transactions.service";

export const csvImportService = {
  async import(buffer: Buffer) {
    // 1. Parse CSV from buffer
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

      // 2. Uniform create flow
      const created = transactionService.create({
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

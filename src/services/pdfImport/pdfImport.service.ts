import { parsePdf } from "./pdf.parser";
import { transactionService } from "../transactions/transactions.service";

export const pdfImportService = {
  async import(buffer: Buffer) {
    // 1. Extract data from PDF
    const { extracted, form } = await parsePdf(buffer);

    // 2. Create transaction via central flow
    const created = transactionService.create({
      receiptId: null,
      extracted,
      form,
      source: "pdf",
    });

    return created;
  },
};

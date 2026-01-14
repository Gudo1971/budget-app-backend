import { transactionService } from "../transactions/transactions.service";

export const manualImportService = {
  create(form: any) {
    const extracted = {}; // manual input heeft geen extracted data

    return transactionService.create({
      receiptId: null,
      extracted,
      form,
      source: "manual",
    });
  },
};

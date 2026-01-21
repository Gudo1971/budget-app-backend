import { Receipt } from "../schemas/ReceiptSchema";
import { MatchInput } from "../../../../shared/types/matching";

export function mapReceiptToMatchInput(
  receiptId: number,
  receipt: Receipt,
): MatchInput {
  return {
    receiptId,

    amount: receipt.total ?? 0,

    // Fallback datum
    date: receipt.date ?? undefined,

    // Aankoopdatum
    transaction_date: receipt.transaction_date ?? undefined,

    // Genormaliseerde merchant
    merchant: receipt.merchant ?? undefined,

    // Exacte merchant
    merchant_raw: receipt.merchant_raw ?? undefined,
  };
}

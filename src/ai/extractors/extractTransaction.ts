import { runExtraction } from "../engine/engine";
import { transactionExtractionPrompt } from "../prompts/transactionExtractionPrompt";
import { TransactionSchema, Transaction } from "../schemas/TransactionSchema";

export async function extractTransaction(text: string): Promise<Transaction> {
  return await runExtraction(
    transactionExtractionPrompt(text),
    TransactionSchema,
  );
}

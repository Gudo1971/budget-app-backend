import { runExtraction } from "../engine";
import { receiptExtractionPrompt } from "../prompts/receiptExtractionPrompt";
import { ReceiptSchema, Receipt } from "../schemas/ReceiptSchema";

export async function extractReceipt(ocrText: string): Promise<Receipt> {
  return await runExtraction(receiptExtractionPrompt(ocrText), ReceiptSchema);
}

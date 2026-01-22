import { runVisionExtraction } from "../engine/runVisionExtraction";
import { ReceiptJson } from "../../../../shared/types/receipts";

export async function extractReceiptFromImage(
  image: Buffer,
): Promise<{ ocrText: string; parsedJson: ReceiptJson }> {
  const base64 = image.toString("base64");

  const prompt = `
You are a receipt OCR engine.
Extract ALL structured data from this receipt image.
Do NOT guess, interpret, translate, or categorize anything.
Return ONLY valid JSON with the following fields:

{
  "merchant": string | null,
  "merchant_category": null,
  "category": null,
  "subcategory": null,
  "date": string | null,
  "total": number | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "price": number | null,
      "total": number | null
    }
  ]
}

Rules:
- ALWAYS include all fields, even if null.
- Do NOT categorize merchants or items.
- Do NOT infer category or subcategory.
- Use the text EXACTLY as it appears.
- If something is unclear, return null.
- Do NOT include any text outside the JSON.
`;

  const parsedJson = (await runVisionExtraction(base64, prompt)) as ReceiptJson;

  return {
    ocrText: "",
    parsedJson,
  };
}

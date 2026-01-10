import fs from "fs";
import { openai } from "../visionClient";
import { ReceiptSchema, Receipt } from "../schemas/ReceiptSchema";
import { runExtraction } from "../engine";

export async function extractReceiptFromImage(
  filePath: string
): Promise<Receipt> {
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString("base64");

  // 1) OCR via GPT-4.1 using base64 image
  const ocrResponse = await openai.responses.create({
    model: "gpt-4.1",
    input: `
Je bent een OCR-engine. Lees ALLE tekst uit deze afbeelding.

IMAGE:
data:image/jpeg;base64,${base64}
`,
  });

  const ocrText = ocrResponse.output_text || "";

  // 2) OCR → JSON extractie via jouw engine
  const prompt = `
Je bent een AI die kassabonnen omzet naar gestructureerde JSON.

OCR tekst:
${ocrText}

Geef ALLEEN geldige JSON terug met:
{
  "merchant": string | null,
  "date": string | null,
  "total": number | null,
  "currency": string | null,
  "items": [
    {
      "name": string,
      "quantity": number,
      "price": number,
      "total": number | null,
      "category": string | null
    }
  ]
}
`;

  return await runExtraction(prompt, ReceiptSchema);
}

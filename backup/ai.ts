import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { z } from "zod";

// 1. Maak één moderne client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 2. Definieer het schema voor transacties
const TransactionSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.number(),
});

const TransactionsSchema = z.array(TransactionSchema);

export const aiClient = {
  async extractBankTransactionsFromPdf(buffer: Buffer) {
    // 1. Tijdelijk bestand opslaan
    const tempPath = path.join(process.cwd(), "temp-upload.pdf");
    fs.writeFileSync(tempPath, buffer);

    // 2. Upload via fs.createReadStream
    const uploaded = await client.files.create({
      file: fs.createReadStream(tempPath),
      purpose: "vision",
    });

    // 3. Tijdelijk bestand verwijderen
    fs.unlinkSync(tempPath);

    // 4. Vision + schema parsing via Responses API
    const response = await client.responses.parse({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Je bent een parser voor banktransacties in PDF-vorm.
Extraheer ALLE transacties en geef ze terug als JSON array.
Zorg dat elke transactie bestaat uit:
- date (string)
- description (string)
- amount (number, negatief bij afschrijving)
`,
            },
            {
              type: "input_file",
              file_id: uploaded.id,
            },
          ],
        },
      ],
      schema: TransactionsSchema,
    });

    return response.output;
  },
};

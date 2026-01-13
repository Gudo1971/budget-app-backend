import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 4. Vision prompt
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Je bent een parser voor banktransacties in PDF-vorm.
Extraheer ALLE transacties en geef ze terug als JSON array.
`,
        },
        {
          role: "user",
          content: `Hier is het PDF-bestand: file_id:${uploaded.id}`,
        },
      ],
    });

    const text = response.choices[0].message.content ?? "{}";
    return JSON.parse(text);
  },
};

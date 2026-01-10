import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function extractReceiptFromImage(
  fileUrl: string
): Promise<{ ocrText: string; parsedJson: any }> {
  // 1. OCR extractie vanuit de afbeelding
  const ocrResponse = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Extract all text from this receipt.",
          },
          {
            type: "input_image",
            image_url: fileUrl,
            detail: "high", // ← verplicht in de types
          },
        ],
      },
    ],
  });

  const ocrText = ocrResponse.output_text ?? "";

  // 2. JSON parsing op basis van de OCR-tekst
  const jsonResponse = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Parse this receipt text into JSON with fields:
merchant, date, total, currency, items[]. Each item has: name, quantity, price.`,
          },
          {
            type: "input_text",
            text: ocrText,
          },
        ],
      },
    ],
  });

  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(jsonResponse.output_text ?? "{}");
  } catch {
    parsedJson = {
      error: "Failed to parse JSON",
      raw: jsonResponse.output_text,
    };
  }

  return {
    ocrText,
    parsedJson,
  };
}

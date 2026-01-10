import OpenAI from "openai";
import fs from "fs";
import { receiptExtractionPrompt } from "../prompts/receiptExtractionPrompt";
import { extractTextFromResponse } from "../helpers/extractTextFromResponse";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function stripCodeFences(text: string): string {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function extractReceiptFromImage(
  filePath: string
): Promise<{ ocrText: string; parsedJson: any }> {
  try {
    // 1. Upload de afbeelding naar OpenAI
    const uploaded = await client.files.create({
      file: fs.createReadStream(filePath),
      purpose: "vision",
    });

    // 2. OCR extractie
    const ocrResponse = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Extract all text from this receipt. Return ONLY the text.",
            },
            {
              type: "input_image",
              file_id: uploaded.id,
              detail: "high",
            },
          ],
        },
      ],
    });

    const ocrText = extractTextFromResponse(ocrResponse) ?? "";

    // 3. JSON parsing
    const jsonResponse = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: receiptExtractionPrompt(ocrText),
            },
          ],
        },
      ],
    });

    let parsedJson: any = null;

    try {
      const cleaned = stripCodeFences(jsonResponse.output_text ?? "");
      parsedJson = JSON.parse(cleaned);
    } catch {
      parsedJson = {
        error: "Failed to parse JSON",
        raw: jsonResponse.output_text,
      };
    }

    return { ocrText, parsedJson };
  } catch (err: any) {
    console.error("OpenAI extract error:", err);

    return {
      ocrText: "",
      parsedJson: {
        error: "OpenAI request failed",
        details: err?.message ?? err,
      },
    };
  }
}

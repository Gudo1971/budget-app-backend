// src/ai/engine.ts
import { z } from "zod";
import { openai } from "./client";

export async function runExtraction<T>(
  prompt: string,
  schema: z.ZodType<T>
): Promise<T> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  console.log("RAW AI OUTPUT:", raw);

  if (!raw) throw new Error("Lege AI-respons");

  const parsed = JSON.parse(raw);
  return schema.parse(parsed);
}

import OpenAI from "openai";
import { ZodSchema } from "zod";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function runExtraction<T>(
  prompt: string,
  schema: ZodSchema<T>
): Promise<T> {
  const response = await openai.responses.parse({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
    schema,
  });

  return response.output as T;
}

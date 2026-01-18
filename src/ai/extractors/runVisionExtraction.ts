import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runVisionExtraction(imageBase64: string, prompt: string) {
  const response = await client.responses.parse({
    model: "gpt-4.1",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_image",
            image_url: "data:image/jpeg;base64," + imageBase64,
            detail: "high",
          },
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
  });

  const first = response.output?.[0];

  if (first && "parsed" in first) {
    return first.parsed;
  }

  throw new Error("Vision extraction returned no parsed JSON");
}

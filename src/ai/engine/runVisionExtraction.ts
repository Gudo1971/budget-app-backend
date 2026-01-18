import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runVisionExtraction(imageBase64: string, prompt: string) {
  if (!imageBase64) {
    throw new Error("runVisionExtraction: imageBase64 is leeg");
  }

  const response = await (client as any).chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
  } as any);

  const text = response.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("Vision: geen tekstuele JSON-respons ontvangen");
  }

  // 1. Strip codeblocks
  let clean = text
    .trim()
    .replace(/```json/i, "")
    .replace(/```/g, "")
    .trim();

  // 2. Kleine JSON-fixes
  clean = clean
    .replace(/,\s*}/g, "}") // trailing comma in object
    .replace(/,\s*]/g, "]"); // trailing comma in array

  // 3. Parse
  try {
    return JSON.parse(clean);
  } catch (err) {
    console.error("Vision gaf geen valide JSON terug:", clean);
    throw err;
  }
}

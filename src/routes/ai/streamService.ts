import { openai } from "../../lib/openai";

export async function streamAIResponse(
  prompt: string,
  onChunk: (text: string) => void
) {
  const stream = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    stream: true,
  });

  for await (const event of stream) {
    // Only process text deltas
    if (event.type === "response.output_text.delta") {
      const text = event.delta;
      if (typeof text === "string") {
        onChunk(text);
      }
    }

    // End of stream
    if (event.type === "response.completed") {
      return;
    }
  }
}

import type { Response } from "openai/resources/responses/responses";

export function extractTextFromResponse(response: Response): string | null {
  // 1. output_text is het meest betrouwbaar
  if (response.output_text) {
    return clean(response.output_text);
  }

  // 2. Zoek een message-like item
  const messageItem = response.output?.find((item) => {
    const content = (item as any)?.content;
    return (
      item &&
      item.type === "message" &&
      Array.isArray(content) &&
      content.some((c: any) => typeof c?.text === "string")
    );
  });

  if (messageItem) {
    const content = (messageItem as any).content;

    // Zoek de eerste text-block in de content array
    const textBlock = content.find((c: any) => typeof c?.text === "string");

    if (textBlock?.text) {
      return clean(textBlock.text);
    }
  }

  return null;
}

function clean(text: string): string {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

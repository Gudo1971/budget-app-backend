// src/routes/ai/extractTextFromResponse.ts

// Kleine helper om whitespace op te schonen
function clean(text: string): string {
  return text.trim();
}

// De response van OpenAI heeft geen officieel type dat je hoeft te importeren.
// We gebruiken gewoon `any` omdat output_text altijd aanwezig is bij responses.create() en responses.parse().
export function extractTextFromResponse(response: any): string | null {
  if (response?.output_text) {
    return clean(response.output_text);
  }

  // Soms zit tekst in output[0].content
  if (Array.isArray(response?.output)) {
    for (const item of response.output) {
      if (typeof item === "string") {
        return clean(item);
      }
      if (item?.content) {
        return clean(String(item.content));
      }
    }
  }

  return null;
}

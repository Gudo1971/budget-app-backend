// src/routes/ai/extractTextFromResponse.ts

function clean(text: string): string {
  return text.trim();
}

export function extractTextFromResponse(response: any): string | null {
  // 1. Direct output_text (meest voorkomend bij text-only)
  if (response?.output_text) {
    return clean(response.output_text);
  }

  // 2. Vision-style: output[*].content[*].text
  if (Array.isArray(response?.output)) {
    for (const block of response.output) {
      if (Array.isArray(block?.content)) {
        for (const c of block.content) {
          if (c?.type === "output_text" && typeof c.text === "string") {
            return clean(c.text);
          }
        }
      }

      // 3. Soms is content direct een string
      if (typeof block?.content === "string") {
        return clean(block.content);
      }
    }
  }

  return null;
}

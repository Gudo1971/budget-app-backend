// src/routes/ai/extractTextFromResponse.ts

function clean(text: string): string {
  return text.trim();
}

export function extractTextFromResponse(response: any): string | null {
  if (!response) return null;

  // 1. Direct output_text (string)
  if (typeof response.output_text === "string") {
    return clean(response.output_text);
  }

  // 1b. output_text als array
  if (Array.isArray(response.output_text)) {
    const joined = response.output_text.join("\n").trim();
    if (joined.length > 0) return joined;
  }

  // 2. output[*].text (veelvoorkomend)
  if (Array.isArray(response.output)) {
    for (const block of response.output) {
      if (typeof block?.text === "string") {
        return clean(block.text);
      }
    }
  }

  // 3. Vision-style: output[*].content[*].text
  if (Array.isArray(response.output)) {
    for (const block of response.output) {
      if (Array.isArray(block?.content)) {
        for (const c of block.content) {
          if (
            (c?.type === "output_text" || c?.type === "text") &&
            typeof c.text === "string"
          ) {
            return clean(c.text);
          }
        }
      }

      // 4. content direct als string
      if (typeof block?.content === "string") {
        return clean(block.content);
      }

      // 5. content als array van strings
      if (Array.isArray(block?.content)) {
        const strings = block.content.filter((x: any) => typeof x === "string");

        if (strings.length > 0) {
          return clean(strings.join("\n"));
        }
      }
    }
  }

  return null;
}

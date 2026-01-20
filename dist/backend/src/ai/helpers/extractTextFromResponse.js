"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromResponse = extractTextFromResponse;
function clean(text) {
    return text.trim();
}
function extractTextFromResponse(response) {
    if (!response)
        return null;
    // 1. Direct output_text (string)
    if (typeof response.output_text === "string") {
        return clean(response.output_text);
    }
    // 1b. output_text als array
    if (Array.isArray(response.output_text)) {
        const joined = response.output_text.join("\n").trim();
        if (joined.length > 0)
            return joined;
    }
    // 2. OpenAI chat-style: choices[*].message.content
    if (Array.isArray(response.choices)) {
        for (const choice of response.choices) {
            const content = choice?.message?.content;
            if (typeof content === "string")
                return clean(content);
        }
    }
    // 3. output[*].text
    if (Array.isArray(response.output)) {
        for (const block of response.output) {
            if (typeof block?.text === "string") {
                return clean(block.text);
            }
        }
    }
    // 4. Vision-style: output[*].content[*].text
    if (Array.isArray(response.output)) {
        for (const block of response.output) {
            if (Array.isArray(block?.content)) {
                for (const c of block.content) {
                    if ((c?.type === "output_text" || c?.type === "text") &&
                        typeof c.text === "string") {
                        return clean(c.text);
                    }
                }
            }
            // 5. content direct als string
            if (typeof block?.content === "string") {
                return clean(block.content);
            }
            // 6. content als array van strings
            if (Array.isArray(block?.content)) {
                const strings = block.content.filter((x) => typeof x === "string");
                if (strings.length > 0) {
                    return clean(strings.join("\n"));
                }
            }
        }
    }
    // 7. Fallback: response.text
    if (typeof response.text === "string") {
        return clean(response.text);
    }
    // 8. Fallback: response.content (string)
    if (typeof response.content === "string") {
        return clean(response.content);
    }
    // 9. Fallback: response.content[*].text
    if (Array.isArray(response.content)) {
        for (const c of response.content) {
            if (typeof c?.text === "string") {
                return clean(c.text);
            }
        }
    }
    return null;
}

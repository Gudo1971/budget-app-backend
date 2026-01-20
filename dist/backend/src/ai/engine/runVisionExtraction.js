"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVisionExtraction = runVisionExtraction;
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
async function runVisionExtraction(imageBase64, prompt) {
    if (!imageBase64) {
        throw new Error("runVisionExtraction: imageBase64 is leeg");
    }
    const response = await client.chat.completions.create({
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
    });
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
    }
    catch (err) {
        console.error("Vision gaf geen valide JSON terug:", clean);
        throw err;
    }
}

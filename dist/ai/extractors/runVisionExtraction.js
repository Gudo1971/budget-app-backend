"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVisionExtraction = runVisionExtraction;
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
async function runVisionExtraction(imageBase64, prompt) {
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

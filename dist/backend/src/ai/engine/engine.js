"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExtraction = runExtraction;
const client_1 = require("./client");
async function runExtraction(prompt, schema) {
    const completion = await client_1.openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });
    const raw = completion.choices[0]?.message?.content;
    console.log("RAW AI OUTPUT:", raw);
    if (!raw)
        throw new Error("Lege AI-respons");
    const parsed = JSON.parse(raw);
    return schema.parse(parsed);
}

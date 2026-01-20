"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSchema = void 0;
const zod_1 = require("zod");
const parseAmount = (val) => {
    if (val === null || val === undefined)
        return undefined;
    if (typeof val === "number")
        return Number.isFinite(val) ? val : undefined;
    if (typeof val === "string") {
        const cleaned = val
            .replace(/[^\d\-,.]/g, "")
            .replace(/\./g, "")
            .replace(",", ".");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
};
exports.TransactionSchema = zod_1.z.object({
    date: zod_1.z.string().min(5).optional(),
    description: zod_1.z.string().min(2).optional(),
    amount: zod_1.z.preprocess(parseAmount, zod_1.z.number().optional()),
    currency: zod_1.z.string().optional(),
    type: zod_1.z.enum(["income", "expense"]).optional(),
    confidence: zod_1.z.number().optional(),
});

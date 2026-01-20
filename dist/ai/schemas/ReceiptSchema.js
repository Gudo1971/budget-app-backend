"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptSchema = exports.ReceiptItemSchema = void 0;
const zod_1 = require("zod");
exports.ReceiptItemSchema = zod_1.z.object({
    name: zod_1.z.string(),
    quantity: zod_1.z.number().default(1),
    price: zod_1.z.number(),
    total: zod_1.z.number().optional(),
    category: zod_1.z.string().optional(),
});
exports.ReceiptSchema = zod_1.z.object({
    merchant: zod_1.z.string().optional(),
    date: zod_1.z.string().optional(),
    total: zod_1.z.number().optional(),
    currency: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.ReceiptItemSchema).default([]),
});

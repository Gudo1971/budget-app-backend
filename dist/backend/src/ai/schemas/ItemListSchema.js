"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemListSchema = exports.ItemSchema = void 0;
const zod_1 = require("zod");
exports.ItemSchema = zod_1.z.object({
    name: zod_1.z.string(),
    quantity: zod_1.z.number().default(1),
    price: zod_1.z.number(),
    total: zod_1.z.number().optional(), // sommige bonnen hebben line totals
    category: zod_1.z.string().optional(),
});
exports.ItemListSchema = zod_1.z.array(exports.ItemSchema);

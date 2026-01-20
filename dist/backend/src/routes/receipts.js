"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = __importDefault(require("./receipts/index"));
const extract_1 = __importDefault(require("./receipts/extract"));
const match_1 = __importDefault(require("./receipts/match"));
const archive_1 = __importDefault(require("./receipts/archive"));
console.log("Loading receipts router");
const router = (0, express_1.Router)();
router.use("/", extract_1.default);
router.use("/", match_1.default);
router.use("/", index_1.default);
router.use("/", archive_1.default);
exports.default = router;

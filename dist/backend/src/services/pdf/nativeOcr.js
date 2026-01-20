"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrImageWithTesseract = ocrImageWithTesseract;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function ocrImageWithTesseract(imagePath) {
    return new Promise((resolve, reject) => {
        const outputBase = path_1.default.join(path_1.default.dirname(imagePath), `ocr_${Date.now()}`);
        (0, child_process_1.execFile)("tesseract", [imagePath, outputBase, "-l", "eng+nl"], (error) => {
            if (error) {
                console.error("Tesseract error:", error);
                return reject(error);
            }
            const txtPath = `${outputBase}.txt`;
            const text = fs_1.default.readFileSync(txtPath, "utf8");
            fs_1.default.unlinkSync(txtPath);
            resolve(text);
        });
    });
}

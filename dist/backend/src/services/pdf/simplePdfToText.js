"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplePdfToText = simplePdfToText;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const nativeOcr_1 = require("./nativeOcr");
function runPdftoppm(pdfPath, outputBase) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.execFile)("pdftoppm", ["-png", pdfPath, outputBase], (error) => {
            if (error)
                return reject(error);
            resolve();
        });
    });
}
async function simplePdfToText(buffer) {
    const tempDir = os_1.default.tmpdir();
    // 1. Save PDF
    const pdfPath = path_1.default.join(tempDir, `temp_${Date.now()}.pdf`);
    fs_1.default.writeFileSync(pdfPath, buffer);
    // 2. Convert PDF → PNG
    const outputBase = path_1.default.join(tempDir, `page_${Date.now()}`);
    await runPdftoppm(pdfPath, outputBase);
    // 3. Collect PNGs
    const files = fs_1.default
        .readdirSync(tempDir)
        .filter((f) => f.startsWith(path_1.default.basename(outputBase)) && f.endsWith(".png"));
    let fullText = "";
    // 4. OCR each PNG
    for (const file of files) {
        const imgPath = path_1.default.join(tempDir, file);
        const text = await (0, nativeOcr_1.ocrImageWithTesseract)(imgPath);
        fullText += text + "\n";
        fs_1.default.unlinkSync(imgPath);
    }
    fs_1.default.unlinkSync(pdfPath);
    return fullText;
}

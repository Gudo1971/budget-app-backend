import path from "path";
import fs from "fs";
import os from "os";
import { execFile } from "child_process";
import { ocrImageWithTesseract } from "./nativeOcr";

function runPdftoppm(pdfPath: string, outputBase: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile("pdftoppm", ["-png", pdfPath, outputBase], (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

export async function simplePdfToText(buffer: Buffer): Promise<string> {
  const tempDir = os.tmpdir();

  // 1. Save PDF
  const pdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
  fs.writeFileSync(pdfPath, buffer);

  // 2. Convert PDF → PNG
  const outputBase = path.join(tempDir, `page_${Date.now()}`);
  await runPdftoppm(pdfPath, outputBase);

  // 3. Collect PNGs
  const files = fs
    .readdirSync(tempDir)
    .filter(
      (f) => f.startsWith(path.basename(outputBase)) && f.endsWith(".png")
    );

  let fullText = "";

  // 4. OCR each PNG
  for (const file of files) {
    const imgPath = path.join(tempDir, file);

    const text = await ocrImageWithTesseract(imgPath);
    fullText += text + "\n";

    fs.unlinkSync(imgPath);
  }

  fs.unlinkSync(pdfPath);

  return fullText;
}

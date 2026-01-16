import { execFile } from "child_process";
import path from "path";
import fs from "fs";

export function ocrImageWithTesseract(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputBase = path.join(path.dirname(imagePath), `ocr_${Date.now()}`);

    execFile("tesseract", [imagePath, outputBase, "-l", "eng+nl"], (error) => {
      if (error) {
        console.error("Tesseract error:", error);
        return reject(error);
      }

      const txtPath = `${outputBase}.txt`;
      const text = fs.readFileSync(txtPath, "utf8");

      fs.unlinkSync(txtPath);

      resolve(text);
    });
  });
}

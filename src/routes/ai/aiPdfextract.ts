import express from "express";
import multer from "multer";
import { extractTransactionsFromPdfText } from "../../ai/extractors/extractTransactionsFromPdfText";
import { simplePdfToText } from "../../services/pdf/simplePdfToText";

const upload = multer({
  // optioneel: beperk de bestandsgrootte (pas aan naar wens)
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const aiPdfExtractRouter = express.Router();

aiPdfExtractRouter.post(
  "/pdf-extract",
  upload.single("pdf"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "PDF ontbreekt" });
      }

      // 1) PDF -> tekst
      const text = await simplePdfToText(file.buffer);
      console.log("PDF TEXT (first 500 chars):\n", text.slice(0, 500));

      // 2) Tekst -> transacties
      let transactions: any;
      try {
        transactions = await extractTransactionsFromPdfText(text);
      } catch (innerErr: unknown) {
        // Veilig extracten van foutdetails (TypeScript-compatibel)
        const innerMsg = (innerErr as any)?.message ?? String(innerErr);
        const innerStack = (innerErr as any)?.stack ?? undefined;

        // Fallback/logging: laat de fout duidelijk zien en probeer graceful fallback
        console.error(
          "extractTransactionsFromPdfText failed:",
          innerMsg,
          innerStack
        );
        // Geef de originele fout terug (400 of 500 afhankelijk van hoe je het wilt)
        return res.status(500).json({
          error: "Fout bij het extraheren van transacties",
          details: innerMsg,
        });
      }

      // 3) Normaliseer de return-waarde: verwacht array van transacties
      if (!transactions) {
        transactions = [];
      } else if (!Array.isArray(transactions)) {
        // Mogelijke vormen:
        // - { rows: [...] }
        // - { transactions: [...] }
        // - een enkel object => wrap in array
        if (Array.isArray((transactions as any).rows)) {
          transactions = (transactions as any).rows;
        } else if (Array.isArray((transactions as any).transactions)) {
          transactions = (transactions as any).transactions;
        } else {
          transactions = [transactions];
        }
      }

      console.log("Extracted transactions count:", transactions.length);
      console.log("First transaction (if any):", transactions[0] ?? null);

      return res.json({ rows: transactions });
    } catch (err: unknown) {
      const errMsg = (err as any)?.message ?? String(err);
      const errStack = (err as any)?.stack ?? undefined;
      console.error("PDF extract error:", errMsg, errStack);
      return res
        .status(500)
        .json({ error: "Kon PDF niet verwerken", details: errMsg });
    }
  }
);

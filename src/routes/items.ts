import express from "express";
import { extractItems } from "../ai/extractors/extractItems";

const router = express.Router();

router.post("/extract", async (req, res) => {
  try {
    const { ocrText } = req.body;

    if (!ocrText) {
      return res.status(400).json({ error: "Missing ocrText field" });
    }

    const items = await extractItems(ocrText);

    res.json({
      success: true,
      items,
    });
  } catch (err) {
    console.error("Item extraction error:", err);
    res.status(500).json({ error: "AI item extraction failed" });
  }
});

export default router;

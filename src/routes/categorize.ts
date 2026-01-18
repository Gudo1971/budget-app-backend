import { Router } from "express";
import { categorizeTransaction } from "../categorization/categorizeTransaction";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const result = await categorizeTransaction(req.body);
    res.json(result);
  } catch (err) {
    console.error("Categorize error:", err);
    res.status(500).json({ error: "Categorization failed" });
  }
});

export default router;

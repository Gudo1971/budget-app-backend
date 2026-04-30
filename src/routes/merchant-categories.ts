import { Router, Request, Response } from "express";
import { pool } from "../lib/db";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { merchant, category } = req.body;

  if (!merchant || !category) {
    return res.status(400).json({ error: "Missing merchant or category" });
  }

  try {
    await pool.query(
      `
      INSERT INTO merchant_memory (user_id, merchant, category_id, confidence)
      VALUES ($1, $2, $3, 1.0)
      ON CONFLICT (user_id, merchant) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        confidence = 1.0
      `,
      ["demo-user", merchant, category],
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;

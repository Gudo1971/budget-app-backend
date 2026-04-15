import { Router, Request, Response } from "express";
import { db } from "../lib/db";

const router = Router();

router.post("/", (req: Request, res: Response) => {
  const { merchant, category } = req.body;

  if (!merchant || !category) {
    return res.status(400).json({ error: "Missing merchant or category" });
  }

  try {
    const stmt = db.prepare(`
  INSERT INTO merchant_memory (user_id, merchant, category_id, confidence)
  VALUES (?, ?, ?, 1.0)
  ON CONFLICT(user_id, merchant) DO UPDATE SET
    category_id = excluded.category_id,
    confidence = 1.0
`);
    stmt.run("demo-user", merchant, category);

    return res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;

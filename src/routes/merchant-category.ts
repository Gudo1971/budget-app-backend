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
      INSERT INTO merchant_memory (name, category)
      VALUES (?, ?)
      ON CONFLICT(name) DO UPDATE SET category = excluded.category
    `);

    stmt.run(merchant, category);

    return res.json({ success: true });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ success: false });
  }
});

export default router;

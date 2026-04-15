import { Router } from "express";
import { db } from "../lib/db";

const router = Router();

router.get("/", (req, res) => {
  const { userId = "demo-user", from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "Missing 'from' or 'to' query parameters",
    });
  }

  try {
    const rows = db
      .prepare(
        `
      SELECT 
  t.category_id,
  COALESCE(c.name, 'Onbekend') AS name,
  SUM(ABS(t.amount)) AS total
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.user_id = ?
  AND t.transaction_date >= ?
  AND t.transaction_date <= ?
  AND t.amount < 0
GROUP BY t.category_id
ORDER BY total ASC

    `,
      )
      .all(userId, from, to);

    res.json({
      success: true,
      data: rows,
      error: null,
    });
  } catch (err) {
    console.error("❌ Error in /api/summary:", err);
    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to load summary",
    });
  }
});

export default router;

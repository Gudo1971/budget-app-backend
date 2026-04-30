import { Router } from "express";
import { pool } from "../lib/db";

const router = Router();

router.get("/", async (req, res) => {
  const { userId = "demo-user", from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "Missing 'from' or 'to' query parameters",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        t.category_id,
        COALESCE(c.name, 'Onbekend') AS name,
        SUM(ABS(t.amount)) AS total
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = $1
        AND t.transaction_date >= $2
        AND t.transaction_date <= $3
        AND t.amount < 0
      GROUP BY t.category_id, c.name
      ORDER BY total ASC
      `,
      [userId, from, to],
    );

    res.json({
      success: true,
      data: result.rows,
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

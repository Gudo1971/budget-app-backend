import { Router } from "express";
import { pool } from "../../lib/db";

const router = Router();

router.put("/:id/archive", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `
      UPDATE receipts
      SET status = 'archived'
      WHERE id = $1
      `,
      [id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Archive error:", err);
    res.status(500).json({ error: "Failed to archive receipt" });
  }
});

export default router;

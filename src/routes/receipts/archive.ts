import { Router } from "express";
import { db } from "../../lib/db";

const router = Router();

router.put("/:id/archive", (req, res) => {
  const id = req.params.id;

  db.prepare("UPDATE receipts SET status = 'archived' WHERE id = ?").run(id);

  res.json({ success: true });
});

export default router;

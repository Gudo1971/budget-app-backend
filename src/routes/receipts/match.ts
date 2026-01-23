import { Router } from "express";
import { db } from "../../lib/db";
import { matchingService } from "../../services/matching/matching.service";
import { MatchResult, MatchInput } from "../../../../shared/types/matching";
import { normalizeMerchant } from "@shared/services/normalizeMerchant";
const router = Router();
const USER_ID = "demo-user";

type ReceiptRecord = {
  id: number;
  aiResult?: string | null;
};

router.get("/:id/match", async (req, res) => {
  const receiptId = Number(req.params.id);

  if (!receiptId) {
    return res.status(400).json({ error: "Invalid receipt ID" });
  }

  try {
    // 1. RECEIPT OPHALEN
    const receipt = db
      .prepare(
        `
        SELECT id, aiResult
        FROM receipts
        WHERE id = ? AND user_id = ?
        `,
      )
      .get(receiptId, USER_ID) as ReceiptRecord | undefined;

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // 2. AI RESULT PARSEN
    let extracted: any = {};
    try {
      extracted = JSON.parse(receipt.aiResult ?? "{}");
    } catch {
      extracted = {};
    }

    console.log("🔍 MATCH DEBUG - aiResult from DB:", receipt.aiResult);
    console.log("🔍 MATCH DEBUG - Parsed extracted:", extracted);

    // 3. VALIDATIE
    if (!extracted.total || !extracted.merchant) {
      return res.status(400).json({
        error: "Receipt has no merchant or total. AI analysis may have failed.",
      });
    }

    // 4. DATUM CONVERSIE: various formats → YYYY-MM-DD
    let normalizedDate = extracted.date;

    if (!normalizedDate) {
      normalizedDate = new Date().toISOString().split("T")[0];
    } else if (normalizedDate.includes("/")) {
      // Convert DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = normalizedDate.split("/");
      normalizedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } else if (
      normalizedDate.includes("-") &&
      normalizedDate.match(/\d{1,2}-[a-z]{3}-\d{4}/i)
    ) {
      // Convert '12-dec-2022 10:33' to YYYY-MM-DD
      const cleanDate = normalizedDate.split(" ")[0]; // remove time
      const parsedDate = new Date(cleanDate);
      if (!isNaN(parsedDate.getTime())) {
        normalizedDate = parsedDate.toISOString().split("T")[0];
      }
    }

    // ⭐ 5. NORMALIZE MERCHANT (CRUCIAAL!)
    const normMerchant = normalizeMerchant(extracted.merchant);

    // 6. MATCHING ENGINE V2
    const matchInput: MatchInput = {
      receiptId: receipt.id,
      amount: extracted.total,
      date: normalizedDate,
      merchant: normMerchant.key, // ✔ string
      merchant_raw: normMerchant.display, // optioneel maar handig
    };

    const matchResult: MatchResult = matchingService.findMatch(
      matchInput,
      USER_ID,
    );

    console.log("🔍 MATCH RESULT (v2):", matchResult);

    return res.json(matchResult);
  } catch (error) {
    console.error("❌ Match error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

export default router;

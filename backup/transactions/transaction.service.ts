import { db } from "../../lib/db";
import { categorizeTransaction } from "./categorizeTransaction";
import { findOrCreateCategory } from "../categories/category.service";

export function createTransaction(data: {
  date: string;
  amount: number;
  merchant: string;
  description: string;
  source?: string;
}) {
  // 1. categoriseer op basis van merchant/description
  const categoryName = categorizeTransaction(data.merchant, data.description);

  // 2. haal category_id op (of maak aan)
  const categoryId = findOrCreateCategory(categoryName);

  // 3. sla transactie op
  const insert = db
    .prepare(
      `INSERT INTO transactions 
      (date, amount, merchant, description, category_id, source)
     VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.date,
      data.amount,
      data.merchant,
      data.description,
      categoryId,
      data.source ?? "csv"
    );

  return insert.lastInsertRowid as number;
}

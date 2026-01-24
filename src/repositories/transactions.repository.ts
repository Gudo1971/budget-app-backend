import { db } from "../lib/db";

// ⭐ Helper: uniform mapping
function mapRow(row: any) {
  return {
    id: row.id,
    receipt_id: row.receipt_id,
    amount: row.amount,
    transaction_date: row.transaction_date,
    merchant: row.merchant,
    description: row.description,
    category_id: row.category_id,
    subcategory_id: row.subcategory_id,
    user_id: row.user_id,
    recurring: row.recurring,
    receipt_filename: row.receipt_filename,
    receipt_ai_result: row.receipt_ai_result,
  };
}

export const transactionRepository = {
  // ⭐ GET ALL
  getAll() {
    const rows = db
      .prepare(
        `
SELECT 
  t.id,
  t.receipt_id,
  t.amount,
  t.transaction_date,
  t.merchant,
  t.description,
  t.category_id,
  t.subcategory_id,
  t.user_id,
  t.recurring,

  r.filename AS receipt_filename,
  r.aiResult AS receipt_ai_result

FROM transactions t
LEFT JOIN receipts r ON r.id = t.receipt_id
ORDER BY t.transaction_date DESC
      `,
      )
      .all();

    return rows.map(mapRow);
  },

  // ⭐ CREATE
  create(data: any) {
    const stmt = db.prepare(`
      INSERT INTO transactions (
        receipt_id,
        amount,
        transaction_date,
        merchant,
        description,
        category_id,
        subcategory_id,
        user_id,
        recurring
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.receipt_id ?? null,
      data.amount,
      data.transaction_date,
      data.merchant,
      data.description,
      data.category_id,
      data.subcategory_id ?? null,
      data.user_id,
      data.recurring ? 1 : 0,
    );

    return { id: result.lastInsertRowid };
  },

  // ⭐ FILTER (Branch 5)

  filter(params: {
    userId: string;

    // single
    year?: number;
    month?: number;
    week?: number;

    // multi
    years?: number[];
    months?: number[];
    weeks?: number[];

    // custom
    from?: string;
    to?: string;

    // legacy
    dates?: string[];
  }) {
    const conditions: string[] = ["t.user_id = ?"];
    const values: any[] = [params.userId];

    // -----------------------------
    // ⭐ SINGLE YEAR
    // -----------------------------
    if (
      params.year &&
      !params.month &&
      !params.week &&
      !params.from &&
      !params.to
    ) {
      conditions.push("strftime('%Y', t.transaction_date) = ?");
      values.push(String(params.year));
    }

    // -----------------------------
    // ⭐ SINGLE MONTH
    // -----------------------------
    if (params.year && params.month) {
      conditions.push("strftime('%Y', t.transaction_date) = ?");
      conditions.push("strftime('%m', t.transaction_date) = ?");
      values.push(String(params.year), String(params.month).padStart(2, "0"));
    }

    // -----------------------------
    // ⭐ SINGLE WEEK
    // SQLite: %W = week number (Mon-Sun)
    // -----------------------------
    if (params.year && params.week) {
      conditions.push("strftime('%Y', t.transaction_date) = ?");
      conditions.push("strftime('%W', t.transaction_date) = ?");
      values.push(String(params.year), String(params.week).padStart(2, "0"));
    }

    // -----------------------------
    // ⭐ MULTI-YEAR
    // -----------------------------
    if (params.years?.length) {
      conditions.push(
        `strftime('%Y', t.transaction_date) IN (${params.years.map(() => "?").join(",")})`,
      );
      values.push(...params.years.map(String));
    }

    // -----------------------------
    // ⭐ MULTI-MONTH
    // -----------------------------
    if (params.months?.length && params.year) {
      conditions.push("strftime('%Y', t.transaction_date) = ?");
      values.push(String(params.year));

      conditions.push(
        `strftime('%m', t.transaction_date) IN (${params.months.map(() => "?").join(",")})`,
      );
      values.push(...params.months.map((m) => String(m).padStart(2, "0")));
    }

    // -----------------------------
    // ⭐ MULTI-WEEK
    // -----------------------------
    if (params.weeks?.length && params.year) {
      conditions.push("strftime('%Y', t.transaction_date) = ?");
      values.push(String(params.year));

      conditions.push(
        `strftime('%W', t.transaction_date) IN (${params.weeks.map(() => "?").join(",")})`,
      );
      values.push(...params.weeks.map((w) => String(w).padStart(2, "0")));
    }

    // -----------------------------
    // ⭐ CUSTOM RANGE
    // -----------------------------
    if (params.from && params.to) {
      conditions.push("t.transaction_date BETWEEN ? AND ?");
      values.push(params.from, params.to);
    }

    // -----------------------------
    // ⭐ MULTIPLE DAYS (legacy)
    // -----------------------------
    if (params.dates?.length) {
      conditions.push(
        `t.transaction_date IN (${params.dates.map(() => "?").join(",")})`,
      );
      values.push(...params.dates);
    }

    // -----------------------------
    // ⭐ FINAL QUERY
    // -----------------------------
    const query = `
SELECT 
  t.id,
  t.receipt_id,
  t.amount,
  t.transaction_date,
  t.merchant,
  t.description,
  t.category_id,
  t.subcategory_id,
  t.user_id,
  t.recurring,

  r.filename AS receipt_filename,
  r.aiResult AS receipt_ai_result

FROM transactions t
LEFT JOIN receipts r ON r.id = t.receipt_id
WHERE ${conditions.join(" AND ")}
ORDER BY t.transaction_date DESC
  `;

    const rows = db.prepare(query).all(...values);
    return rows.map(mapRow);
  },
};

import { pool } from "../lib/db";

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
  async getAll() {
    const result = await pool.query(
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
    );

    return result.rows.map(mapRow);
  },

  // ⭐ CREATE
  async create(data: any) {
    const result = await pool.query(
      `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
      [
        data.receipt_id ?? null,
        data.amount,
        data.transaction_date,
        data.merchant,
        data.description,
        data.category_id,
        data.subcategory_id ?? null,
        data.user_id,
        data.recurring ? 1 : 0,
      ],
    );

    return { id: result.rows[0].id };
  },

  // ⭐ FILTER (Branch 5)
  async filter(params: {
    userId: string;

    year?: number;
    month?: number;
    week?: number;

    years?: number[];
    months?: number[];
    weeks?: number[];

    from?: string;
    to?: string;

    dates?: string[];
  }) {
    const conditions: string[] = ["t.user_id = $1"];
    const values: any[] = [params.userId];
    let index = 2; // PostgreSQL placeholders beginnen bij $1

    // ⭐ SINGLE YEAR
    if (
      params.year &&
      !params.month &&
      !params.week &&
      !params.from &&
      !params.to
    ) {
      conditions.push(`EXTRACT(YEAR FROM t.transaction_date) = $${index}`);
      values.push(params.year);
      index++;
    }

    // ⭐ SINGLE MONTH
    if (params.year && params.month) {
      conditions.push(`EXTRACT(YEAR FROM t.transaction_date) = $${index}`);
      values.push(params.year);
      index++;

      conditions.push(`EXTRACT(MONTH FROM t.transaction_date) = $${index}`);
      values.push(params.month);
      index++;
    }

    // ⭐ SINGLE WEEK
    if (params.year && params.week) {
      conditions.push(`EXTRACT(YEAR FROM t.transaction_date) = $${index}`);
      values.push(params.year);
      index++;

      conditions.push(`EXTRACT(WEEK FROM t.transaction_date) = $${index}`);
      values.push(params.week);
      index++;
    }

    // ⭐ MULTI-YEAR
    if (params.years?.length) {
      const placeholders = params.years.map(() => `$${index++}`).join(",");
      conditions.push(
        `EXTRACT(YEAR FROM t.transaction_date) IN (${placeholders})`,
      );
      values.push(...params.years);
    }

    // ⭐ MULTI-MONTH
    if (params.months?.length && params.year) {
      conditions.push(`EXTRACT(YEAR FROM t.transaction_date) = $${index}`);
      values.push(params.year);
      index++;

      const placeholders = params.months.map(() => `$${index++}`).join(",");
      conditions.push(
        `EXTRACT(MONTH FROM t.transaction_date) IN (${placeholders})`,
      );
      values.push(...params.months);
    }

    // ⭐ MULTI-WEEK
    if (params.weeks?.length && params.year) {
      conditions.push(`EXTRACT(YEAR FROM t.transaction_date) = $${index}`);
      values.push(params.year);
      index++;

      const placeholders = params.weeks.map(() => `$${index++}`).join(",");
      conditions.push(
        `EXTRACT(WEEK FROM t.transaction_date) IN (${placeholders})`,
      );
      values.push(...params.weeks);
    }

    // ⭐ CUSTOM RANGE
    if (params.from && params.to) {
      conditions.push(`t.transaction_date BETWEEN $${index} AND $${index + 1}`);
      values.push(params.from, params.to);
      index += 2;
    }

    // ⭐ MULTIPLE DAYS
    if (params.dates?.length) {
      const placeholders = params.dates.map(() => `$${index++}`).join(",");
      conditions.push(`t.transaction_date IN (${placeholders})`);
      values.push(...params.dates);
    }

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

    const result = await pool.query(query, values);
    return result.rows.map(mapRow);
  },
};

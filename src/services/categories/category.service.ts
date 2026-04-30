import { pool } from "../../lib/db";

export async function findCategoryIdByName(
  name: string,
): Promise<number | null> {
  const result = await pool.query(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER($1)",
    [name],
  );

  const existing = result.rows[0] as { id: number } | undefined;

  return existing?.id ?? null;
}

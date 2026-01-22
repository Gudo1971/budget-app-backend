import { db } from "../../lib/db";

export function findCategoryIdByName(name: string): number | null {
  const existing = db
    .prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)")
    .get(name) as { id: number } | undefined;

  return existing?.id ?? null;
}

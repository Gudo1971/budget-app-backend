import { db } from "../../lib/db";

export function findOrCreateCategory(name: string): number {
  const existing = db
    .prepare("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)")
    .get(name) as { id: number } | null;

  if (existing?.id) return existing.id;

  const insert = db
    .prepare("INSERT INTO categories (name, type) VALUES (?, ?)")
    .run(name, "variable") as { lastInsertRowid: number };

  return insert.lastInsertRowid as number;
}

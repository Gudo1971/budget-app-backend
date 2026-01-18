import { aiChooseCategory } from "./aiChooseCategory";
import { getMerchantMemory, upsertMerchantMemory } from "../lib/merchantMemory";
import { guessSubcategory } from "./guessSubcategory";
import { db } from "../lib/db";

export async function categorizeTransaction({
  userId,
  merchantName,
  description,
  amount,
  date,
}: {
  userId: string;
  merchantName: string;
  description: string;
  amount: number;
  date: string;
}) {
  console.log("CATEGORIZE INPUT:", { merchantName, description });

  // 1. Haal categorieën uit DB
  const rows = db
    .prepare("SELECT name FROM categories WHERE user_id = ?")
    .all(userId) as { name: string }[];

  const categories = rows.map((r) => r.name);

  // 2. MEMORY FIRST
  const memory = getMerchantMemory(userId, merchantName);
  if (memory) {
    console.log("CATEGORIZED RESULT (MEMORY):", memory);
    return { ...memory, memoryApplied: true };
  }

  // 3. AI fallback
  const aiCategory = await aiChooseCategory(
    merchantName,
    description,
    categories,
  );

  let category = aiCategory;
  let subcategory: string | null = null;

  // 4. Heuristieken (string-based)
  const lower = (merchantName + " " + description).toLowerCase();

  if (
    lower.includes("netflix") ||
    lower.includes("spotify") ||
    lower.includes("youtube")
  ) {
    category = "Abonnementen";
    subcategory = "Streaming";
  }

  if (
    lower.includes("restaurant") ||
    lower.includes("café") ||
    lower.includes("eten")
  ) {
    category = "Restaurant";
    subcategory = "Uit eten";
  }

  // 5. Subcategorie guessing
  subcategory = guessSubcategory(category, merchantName, description);

  const result = {
    category,
    subcategory,
    memoryApplied: false,
  };

  // 6. Memory opslaan
  upsertMerchantMemory(userId, merchantName, category, subcategory);

  console.log("CATEGORIZED RESULT:", result);
  return result;
}

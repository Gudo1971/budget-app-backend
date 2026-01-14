import { aiChooseCategory } from "./aiChooseCategory";
import { getMerchantMemory } from "../lib/merchantMemory";
import { guessSubcategory } from "./guessSubcategory";
import {
  CategorizeInput,
  CategorizeOutput,
  Category,
  isCategory,
} from "./types";

// -----------------------------
// Heuristiek: huurbetalingen
// -----------------------------
function isHousingRent(text: string): boolean {
  const lower = text.toLowerCase();

  if (!lower.includes("huur")) return false;

  const nonHousing = [
    "auto",
    "fiets",
    "scooter",
    "bus",
    "busje",
    "aanhanger",
    "gereedschap",
    "opslag",
    "box",
    "verhuur",
  ];
  if (nonHousing.some((k) => lower.includes(k))) return false;

  const housingSignals = ["woning", "appartement", "huis", "kamer"];
  if (housingSignals.some((s) => lower.includes(s))) return true;

  const months = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ];
  if (months.some((m) => lower.includes(m))) return true;

  return true;
}

export async function categorizeTransaction(
  input: CategorizeInput
): Promise<CategorizeOutput> {
  const { userId, merchantName, description } = input;

  console.log("CATEGORIZE INPUT:", { merchantName, description });

  // -----------------------------
  // 1. MEMORY FIRST
  // -----------------------------
  const memory = getMerchantMemory(userId, merchantName);
  if (memory) {
    console.log("CATEGORIZED RESULT (MEMORY):", memory);
    return {
      category: memory.category,
      subcategory: memory.subcategory,
      memoryApplied: true,
    };
  }

  // -----------------------------
  // 2. AI FIRST
  // -----------------------------
  const aiCategory = await aiChooseCategory(merchantName, description);
  console.log("AI CATEGORY:", aiCategory);

  let category: Category;

  if (isCategory(aiCategory)) {
    category = aiCategory;
  } else {
    console.warn("AI gaf ongeldige categorie:", aiCategory);
    category = "Overig";
  }

  let subcategory = null;

  // -----------------------------
  // 3. HEURISTIEK: HUUR
  // -----------------------------
  if (isHousingRent(merchantName) || isHousingRent(description)) {
    category = "Wonen";
    subcategory = "Huur";
    console.log("CATEGORIZED RESULT (HEURISTIC - HUUR):", {
      category,
      subcategory,
    });
    return { category, subcategory, memoryApplied: false };
  }

  // -----------------------------
  // 3b. HEURISTIEK: KLEDING
  // -----------------------------
  const clothingSignals = ["zalando", "h&m", "primark", "c&a", "kleding"];
  const lowerMerchant = merchantName.toLowerCase();
  const lowerDesc = description.toLowerCase();
  const normalizedMerchant = lowerMerchant
    .replace(/se|payments|online|netherlands|nl/g, "")
    .replace(/[^a-z]/g, "");
  if (
    clothingSignals.some((s) => normalizedMerchant.includes(s)) ||
    clothingSignals.some((s) => lowerDesc.includes(s))
  ) {
    category = "Kleding";
    subcategory = null;
    console.log("CATEGORIZED RESULT (HEURISTIC - KLEDING):", {
      category,
      subcategory,
    });
    return { category, subcategory, memoryApplied: false };
  }
  // -----------------------------
  // 4. SUBCATEGORY
  // -----------------------------
  subcategory = guessSubcategory(category, merchantName, description);

  const result = {
    category,
    subcategory,
    memoryApplied: false,
  };

  console.log("CATEGORIZED RESULT:", result);
  return result;
}

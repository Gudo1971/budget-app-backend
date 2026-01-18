// ------------------------------------------------------------
// INPUT
// ------------------------------------------------------------
export interface CategorizeInput {
  userId: string;
  merchantName: string;
  description: string;
  amount: number;
  date: string; // ISO date
}

// ------------------------------------------------------------
// CATEGORY TYPES (DYNAMISCH)
// ------------------------------------------------------------
export type Category = string; // komt uit database
export type Subcategory = string | null; // dynamisch of null

// ------------------------------------------------------------
// MEMORY ENTRY (MERCHANT MEMORY)
// ------------------------------------------------------------
export interface MerchantMemoryEntry {
  merchant: string;
  category: Category;
  subcategory: Subcategory;
  lastUsed: string;
  confidence: number;
}

// ------------------------------------------------------------
// CATEGORY RULE (HEURISTIEKEN)
// ------------------------------------------------------------
export interface CategoryRule {
  match: {
    merchantContains?: string[];
    descriptionContains?: string[];
    amountGreaterThan?: number;
    amountLessThan?: number;
  };
  result: {
    category: Category;
    subcategory: Subcategory;
  };
}

// ------------------------------------------------------------
// OUTPUT
// ------------------------------------------------------------
export interface CategorizeOutput {
  category: Category;
  subcategory: Subcategory;
  memoryApplied: boolean;
  ruleApplied?: string;
}

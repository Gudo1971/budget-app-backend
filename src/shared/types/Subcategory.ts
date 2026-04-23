export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  user_id: string;
}

export type SubcategoryId = number | null;

export type SubcategoryDictionary = Record<number, string>;

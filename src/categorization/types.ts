export interface CategorizeInput {
  userId: string;
  merchantName: string;
  description: string;
  amount: number;
  date: string;
}

export interface CategorizeOutput {
  category: string;
  subcategory: string | null;
  memoryApplied: boolean;
}
export type Category =
  | "Boodschappen"
  | "PersoonlijkeVerzorging"
  | "Huishouden"
  | "Kleding"
  | "Vervoer"
  | "Abonnementen"
  | "VrijeTijd"
  | "Wonen"
  | "Inkomen"
  | "Overig";
export const ALL_CATEGORIES: Category[] = [
  "Boodschappen",
  "PersoonlijkeVerzorging",
  "Huishouden",
  "Vervoer",
  "Abonnementen",
  "VrijeTijd",
  "Wonen",
  "Inkomen",
  "Overig",
];
export function isCategory(value: string): value is Category {
  return ALL_CATEGORIES.includes(value as Category);
}

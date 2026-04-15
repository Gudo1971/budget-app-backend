// backend/src/services/transactions/normalizeAmount.ts

export function normalizeAmount(raw: any, categoryName?: string) {
  const num = Number(raw);

  if (isNaN(num)) return 0;

  // Inkomsten altijd positief
  if (categoryName && categoryName.toLowerCase() === "inkomen") {
    return Math.abs(num);
  }

  // Uitgaven altijd negatief
  return num > 0 ? -num : num;
}

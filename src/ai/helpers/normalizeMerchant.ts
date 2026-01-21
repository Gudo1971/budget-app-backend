export function normalizeMerchant(name?: string): string {
  if (!name) return "";

  const cleaned = name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Yoghurt Barn varianten
  if (cleaned.includes("yoghurtbarn") || cleaned.includes("yb")) {
    return "Yoghurt Barn";
  }

  return name.trim();
}

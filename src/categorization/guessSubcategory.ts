export function guessSubcategory(
  category: string,
  merchantName: string,
  description: string,
): string | null {
  const lower = (merchantName + " " + description).toLowerCase();

  if (lower.includes("netflix")) return "Streaming";
  if (lower.includes("spotify")) return "Muziek";
  if (lower.includes("youtube")) return "Video";

  if (lower.includes("restaurant") || lower.includes("eten")) return "Uit eten";

  if (lower.includes("ns") || lower.includes("ov")) return "Openbaar vervoer";

  return null;
}

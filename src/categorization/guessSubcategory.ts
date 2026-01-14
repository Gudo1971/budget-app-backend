import { Category } from "./types";

export function guessSubcategory(
  category: Category,
  merchantName: string,
  description: string
): string | null {
  const lower = (merchantName + " " + description).toLowerCase();

  if (category === "Abonnementen") {
    if (lower.includes("netflix")) return "Streaming";
    if (lower.includes("spotify")) return "Muziek";
    if (lower.includes("youtube")) return "Video";
  }

  if (category === "Vervoer") {
    if (lower.includes("ns")) return "Trein";
    if (lower.includes("ov")) return "OpenbaarVervoer";
  }

  if (category === "VrijeTijd") {
    if (lower.includes("restaurant")) return "UitEten";
  }

  return null;
}

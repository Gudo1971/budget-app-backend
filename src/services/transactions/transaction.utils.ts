export function normalizeDate(d: string): string {
  if (!d) return new Date().toISOString().slice(0, 10);

  // Parse various date formats to ISO YYYY-MM-DD

  // 1. Already ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    return d.split("T")[0];
  }

  // 2. European format: DD/MM/YYYY
  if (d.includes("/")) {
    const [day, month, year] = d.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // 3. Named date format: '12-dec-2022' or '12-dec-2022 10:33'
  if (/^\d{1,2}-[a-z]{3}-\d{4}/i.test(d)) {
    const cleanDate = d.split(" ")[0]; // remove time
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  // Fallback: try to parse as general date string
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } catch (e) {
    // ignore
  }

  // Last resort: use today
  console.warn(`⚠️ Could not parse date "${d}", using today`);
  return new Date().toISOString().slice(0, 10);
}

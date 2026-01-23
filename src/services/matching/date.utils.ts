export function dateRange(center: string, days: number): string[] {
  // Parse European DD/MM/YYYY or ISO YYYY-MM-DD format
  let base: Date;

  if (center.includes("/")) {
    // European format: DD/MM/YYYY
    const [day, month, year] = center.split("/").map(Number);
    base = new Date(year, month - 1, day);
  } else {
    // ISO format: YYYY-MM-DD
    base = new Date(center);
  }

  // Validate parsed date
  if (isNaN(base.getTime())) {
    throw new Error(
      `Invalid date format: "${center}". Expected DD/MM/YYYY or YYYY-MM-DD.`,
    );
  }

  const dates: string[] = [];

  for (let offset = -days; offset <= days; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates;
}

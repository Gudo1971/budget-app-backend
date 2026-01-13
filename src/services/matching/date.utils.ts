export function dateRange(center: string, days: number): string[] {
  const base = new Date(center);
  const dates: string[] = [];

  for (let offset = -days; offset <= days; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates;
}

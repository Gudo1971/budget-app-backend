export function normalizeDate(d: string): string {
  if (!d) return new Date().toISOString().slice(0, 10);

  // Als het geen ISO is, fallback naar vandaag
  if (!/^\d{4}-\d{2}-\d{2}/.test(d)) {
    return new Date().toISOString().slice(0, 10);
  }

  return d.split("T")[0];
}

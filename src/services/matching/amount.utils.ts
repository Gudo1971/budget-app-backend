export function amountCloseEnough(
  a: number,
  b: number,
  tolerance = 0.05
): boolean {
  return Math.abs(a - b) <= tolerance;
}

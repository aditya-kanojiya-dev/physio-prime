// Payout period helpers. Periods are inclusive YYYY-MM-DD strings, so string
// comparison is the same as date comparison.
export function periodsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

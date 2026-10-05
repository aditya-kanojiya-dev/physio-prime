// ponytail: mirrors server/src/lib/commission.ts by hand so the admin preview
// shows what the payout path computes. server/src/lib/commission.selfcheck.ts
// fails if the two ever disagree.
export const DEFAULT_PLATFORM_FEE_PERCENT = 30

export type VisitMode = 'home' | 'online'

export function resolveRate(
  rates: {
    categoryHome?: number | null
    categoryOnline?: number | null
    home?: number | null
    online?: number | null
    shared?: number | null
    department?: number | null
  },
  mode: VisitMode,
): number {
  const categoryPerMode = mode === 'home' ? rates.categoryHome : rates.categoryOnline
  const doctorPerMode = mode === 'home' ? rates.home : rates.online
  return categoryPerMode ?? doctorPerMode ?? rates.shared ?? rates.department ?? DEFAULT_PLATFORM_FEE_PERCENT
}

export function splitFee(grossPaise: number, platformFeePercent: number) {
  const platformFeePaise = Math.round((grossPaise * platformFeePercent) / 100)
  return { platformFeePaise, doctorPaise: grossPaise - platformFeePaise }
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

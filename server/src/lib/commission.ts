import { sql, type SQLWrapper } from 'drizzle-orm';

// Commission math shared across booking, collection, cash and settlement paths.
// Single source of truth for the platform-fee split so every path agrees.
export interface Commission {
  grossPaise: number;
  platformFeePaise: number;
  doctorEarningsPaise: number;
}

// platformFeePercent is the platform's cut. Effective rate resolves:
// doctor override (set by admin) -> department default -> 30 fallback.
export const DEFAULT_PLATFORM_FEE_PERCENT = 30;

export function resolvePlatformFeePercent(
  doctorPercent: number | null | undefined,
  departmentPercent: number | null | undefined,
): number {
  return doctorPercent ?? departmentPercent ?? DEFAULT_PLATFORM_FEE_PERCENT;
}

export function computeCommission(grossPaise: number, platformFeePercent: number): Commission {
  const platformFeePaise = Math.round((grossPaise * platformFeePercent) / 100);
  return {
    grossPaise,
    platformFeePaise,
    doctorEarningsPaise: grossPaise - platformFeePaise,
  };
}

// SQL twin of computeCommission for aggregate queries (earnings/payouts).
// Must stay in lockstep — numeric division + round so it matches JS Math.round.
export function netAmountSql(feePaise: SQLWrapper, platformFeePercent: SQLWrapper): SQLWrapper {
  return sql`${feePaise} - round(${feePaise}::numeric * ${platformFeePercent} / 100)`;
}

// Whole rows-to-money fragment for the repeating summary pattern:
// COALESCE(SUM(CASE WHEN <condition> THEN net ELSE 0 END), 0).
export function sumEarnedSql(
  condition: SQLWrapper,
  feePaise: SQLWrapper,
  platformFeePercent: SQLWrapper,
): SQLWrapper {
  return sql`coalesce(sum(case when ${condition} then ${netAmountSql(feePaise, platformFeePercent)} else 0 end), 0)`;
}

// SQL money-path twin of resolvePlatformFeePercent. Callers pass the COALESCE'd
// rate (e.g. computed via resolvePlatformFeePercentSql in their joined query).
export function resolvePlatformFeePercentSql(
  doctorPercent: SQLWrapper,
  departmentPercent: SQLWrapper,
): SQLWrapper {
  return sql`coalesce(${doctorPercent}, ${departmentPercent}, ${DEFAULT_PLATFORM_FEE_PERCENT})`;
}

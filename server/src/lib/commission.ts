import { sql, type SQLWrapper } from 'drizzle-orm';
import { departments, doctorCategoryCommissions, doctors } from '../db/schema';

// Commission math shared across booking, collection, cash and settlement paths.
// Single source of truth for the platform-fee split so every path agrees.
export interface Commission {
  grossPaise: number;
  platformFeePaise: number;
  doctorEarningsPaise: number;
}

// platformFeePercent is the platform's cut. Effective rate resolves:
// category (per-mode) -> mode-specific doctor override -> shared doctor
// override -> department default -> 30 fallback.
//
// The category level is keyed on the category the patient booked through
// (appointments.category_id), so one doctor can carry a different cut per
// category. Category rates are per-mode only: the admin sets a home and a
// video rate for each category, and a category row with both NULL falls
// through to the doctor level rather than blocking it.
export const DEFAULT_PLATFORM_FEE_PERCENT = 30;

export type VisitMode = 'home' | 'online';

export interface PerModeRates {
  categoryHome?: number | null;
  categoryOnline?: number | null;
  home?: number | null;
  online?: number | null;
  shared?: number | null;
  department?: number | null;
}

export function resolvePlatformFeePercent(rates: PerModeRates, mode: VisitMode | string): number {
  const categoryPerMode = mode === 'home' ? rates.categoryHome : rates.categoryOnline;
  const doctorPerMode = mode === 'home' ? rates.home : rates.online;
  return categoryPerMode ?? doctorPerMode ?? rates.shared ?? rates.department ?? DEFAULT_PLATFORM_FEE_PERCENT;
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

// Joined columns the rate resolver reads, grouped by table so a misordered
// argument is a type error instead of a silent mispayout.
export interface RateSources {
  category?: Pick<typeof doctorCategoryCommissions, 'platformFeeHomePercent' | 'platformFeeOnlinePercent'>;
  doctor: Pick<typeof doctors, 'platformFeeHomePercent' | 'platformFeeOnlinePercent' | 'platformFeePercent'>;
  department: Pick<typeof departments, 'platformFeePercent'>;
}

// SQL twin of resolvePlatformFeePercent, evaluated per appointment row so each
// booking picks the rate for its own visit mode and booked category. Pass the
// joined drizzle tables; the category table must be LEFT-joined on the
// appointment's category, so its columns can come back null.
export function rateForModeSql(mode: SQLWrapper, src: RateSources): SQLWrapper {
  const c = src.category;
  const catHome = c?.platformFeeHomePercent ?? sql`null`;
  const catOnline = c?.platformFeeOnlinePercent ?? sql`null`;
  const d = src.doctor;
  const dept = src.department.platformFeePercent;
  return sql`case when ${mode} = 'home'
    then coalesce(${catHome}, ${d.platformFeeHomePercent}, ${d.platformFeePercent}, ${dept}, ${DEFAULT_PLATFORM_FEE_PERCENT})
    else coalesce(${catOnline}, ${d.platformFeeOnlinePercent}, ${d.platformFeePercent}, ${dept}, ${DEFAULT_PLATFORM_FEE_PERCENT})
  end`;
}

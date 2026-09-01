import { sql, type SQLWrapper } from 'drizzle-orm';

// Commission math shared across booking, collection, cash and settlement paths.
// Single source of truth for the platform-fee split so every path agrees.
export interface Commission {
  grossPaise: number;
  platformFeePaise: number;
  doctorEarningsPaise: number;
}

// platformFeePercent is the platform's cut (admin sets per doctor, default 30).
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

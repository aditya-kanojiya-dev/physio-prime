// Run: npx tsx src/lib/commission.selfcheck.ts
// Guards the money split. Three implementations exist (server JS, server SQL,
// admin JS mirror) and a mismatch silently mispays doctors, so this compares
// them against each other and against real Postgres round().
//
// ponytail: covers the split, not the whole payout path. Add a case here
// rather than a test file when a rate rule changes.
import assert from 'node:assert/strict';
import { and, eq, sql } from 'drizzle-orm';
import { db, pool } from '../db/pool';
import { appointments, departments, doctorCategoryCommissions, doctors } from '../db/schema';
import { computeCommission, effectiveFees, rateForModeSql, resolvePlatformFeePercent, DEFAULT_PLATFORM_FEE_PERCENT } from './commission';
import { formatPaise, resolveRate, splitFee } from '../../../admin/src/lib/commission';

const FAILURES: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    FAILURES.push(name);
    console.error(`  FAIL ${name}: ${(err as Error).message.split('\n')[0]}`);
  }
}

// 1. Rate resolution chain, per mode.
check('per-mode rate wins over shared', () => {
  assert.equal(resolvePlatformFeePercent({ home: 12, online: 18, shared: 25, department: 30 }, 'home'), 12);
  assert.equal(resolvePlatformFeePercent({ home: 12, online: 18, shared: 25, department: 30 }, 'online'), 18);
});
check('per-mode category rate beats every doctor level', () => {
  assert.equal(resolvePlatformFeePercent({ categoryHome: 5, categoryOnline: 9, home: 12, online: 18, shared: 25, department: 30 }, 'home'), 5);
  assert.equal(resolvePlatformFeePercent({ categoryHome: 5, categoryOnline: 9, home: 12, online: 18, shared: 25, department: 30 }, 'online'), 9);
});
check('a category rate set on one mode does not leak to the other', () => {
  const r = { categoryHome: 5, categoryOnline: null, home: 12, online: 18, shared: 25 };
  assert.equal(resolvePlatformFeePercent(r, 'home'), 5);
  assert.equal(resolvePlatformFeePercent(r, 'online'), 18, 'video must fall back to the doctor online rate');
});
check('a blank per-mode category rate falls back to the doctor', () => {
  const r = { categoryHome: null, categoryOnline: null, home: 12, online: 18, shared: 25 };
  assert.equal(resolvePlatformFeePercent(r, 'home'), 12);
  assert.equal(resolvePlatformFeePercent(r, 'online'), 18);
});
check('an all-blank category row falls through to the doctor', () => {
  const r = { categoryHome: null, categoryOnline: null, home: 12, online: 18, shared: 25 };
  assert.equal(resolvePlatformFeePercent(r, 'home'), 12);
  assert.equal(resolvePlatformFeePercent(r, 'online'), 18);
});
check('a 0% category rate is honoured, not skipped', () => {
  const rates = { categoryHome: 0, home: 12, shared: 25 };
  assert.equal(resolvePlatformFeePercent(rates, 'home'), 0);
  assert.equal(computeCommission(100_00, resolvePlatformFeePercent(rates, 'home')).doctorEarningsPaise, 100_00);
});
check('shared wins when the mode is unset', () => {
  assert.equal(resolvePlatformFeePercent({ home: null, online: undefined, shared: 25, department: 30 }, 'home'), 25);
  assert.equal(resolvePlatformFeePercent({ home: null, online: undefined, shared: 25, department: 30 }, 'online'), 25);
});
check('department default then 30 fallback', () => {
  assert.equal(resolvePlatformFeePercent({ shared: null, department: 22 }, 'home'), 22);
  assert.equal(resolvePlatformFeePercent({ shared: null, department: null }, 'online'), DEFAULT_PLATFORM_FEE_PERCENT);
});
check('0 is a real rate, not a missing one', () => {
  assert.equal(resolvePlatformFeePercent({ home: 0, shared: 25 }, 'home'), 0);
  const c = computeCommission(100_00, resolvePlatformFeePercent({ home: 0, shared: 25 }, 'home'));
  assert.equal(c.platformFeePaise, 0);
  assert.equal(c.doctorEarningsPaise, 100_00);
});
check('split always sums back to the gross', () => {
  for (const gross of [0, 1, 99, 100_00, 123_45, 999_99, 123_456]) {
    for (const rate of [0, 1, 7, 12, 25, 30, 33, 50, 99, 100]) {
      const c = computeCommission(gross, rate);
      assert.equal(c.platformFeePaise + c.doctorEarningsPaise, gross, `gross=${gross} rate=${rate}`);
      assert.ok(c.platformFeePaise >= 0 && c.doctorEarningsPaise >= 0, `negative split gross=${gross} rate=${rate}`);
    }
  }
});

// 1b. Consultation fee override: the price shown and the price charged.
check('category fee override wins per mode, paise converts to rupees', () => {
  const fees = effectiveFees({ home: 500, online: 400 }, { homePaise: 750_00, onlinePaise: null });
  assert.deepEqual(fees, { home: 750, online: 400 });
});
check('a null override falls back to the doctor fee', () => {
  assert.deepEqual(effectiveFees({ home: 500, online: 400 }, { homePaise: null, onlinePaise: null }), { home: 500, online: 400 });
  assert.deepEqual(effectiveFees({ home: 500, online: 400 }, null), { home: 500, online: 400 });
  assert.deepEqual(effectiveFees({ home: 500, online: 400 }), { home: 500, online: 400 });
});
check('a mode nobody prices comes back null, not zero', () => {
  assert.deepEqual(effectiveFees({ home: 500, online: 0 }, { homePaise: 750_00, onlinePaise: null }).online, 0);
  assert.equal(effectiveFees({ home: null, online: undefined }, null).home, null);
});

// 2. The admin mirror must not drift from the server resolver.
check('admin mirror matches server resolver', () => {
  const cases: { categoryHome?: number | null; categoryOnline?: number | null; home: number | null; online: number | null; shared: number | null; department: number | null }[] = [
    { home: 12, online: 18, shared: 25, department: 30 },
    { home: null, online: null, shared: 25, department: 30 },
    { home: 0, online: null, shared: 25, department: 30 },
    { home: null, online: null, shared: null, department: null },
    { home: null, online: 40, shared: null, department: 22 },
    { categoryHome: 0, categoryOnline: 0, home: 12, online: 18, shared: 25, department: 30 },
    { categoryHome: null, categoryOnline: null, home: 12, online: 18, shared: 25, department: 30 },
    { categoryHome: 5, categoryOnline: 9, home: 12, online: 18, shared: 25, department: 30 },
    { categoryHome: 5, categoryOnline: null, home: 12, online: 18, shared: 25, department: 30 },
    { categoryHome: null, categoryOnline: 9, home: 12, online: 18, shared: 25, department: 30 },
  ];
  for (const c of cases) {
    for (const mode of ['home', 'online'] as const) {
      assert.equal(
        resolveRate(c, mode),
        resolvePlatformFeePercent(c, mode),
        `mirror mismatch ${mode} ${JSON.stringify(c)}`,
      );
    }
  }
});
check('admin mirror rounds the same way', () => {
  for (const gross of [0, 1, 99, 100_00, 123_45, 999_99, 123_456]) {
    for (const rate of [0, 1, 7, 12, 25, 30, 33, 50, 99, 100]) {
      const server = computeCommission(gross, rate);
      const admin = splitFee(gross, rate);
      assert.equal(admin.platformFeePaise, server.platformFeePaise, `platform gross=${gross} rate=${rate}`);
      assert.equal(admin.doctorPaise, server.doctorEarningsPaise, `doctor gross=${gross} rate=${rate}`);
    }
  }
});
check('formatPaise shows whole rupees', () => {
  assert.equal(formatPaise(100_00), '₹100');
  assert.equal(formatPaise(123_45), '₹123.45');
  assert.equal(formatPaise(0), '₹0');
});

const CASES = [0, 1, 99, 100_00, 123_45, 999_99, 123_456];
const RATES = [0, 1, 7, 12, 25, 30, 33, 50, 99, 100];

// The SQL helper is hand-built, and a reshuffled coalesce still compiles and
// still returns a number. Pin the column order in the generated statement.
check('generated SQL resolves category(mode) -> doctor(mode,shared) -> dept -> 30', () => {
  const { sql: text, params } = db
    .select({ t: sql<number>`${rateForModeSql(appointments.mode, { category: doctorCategoryCommissions, doctor: doctors, department: departments })}` })
    .from(appointments)
    .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
    .leftJoin(departments, eq(departments.name, doctors.department))
    .leftJoin(doctorCategoryCommissions, and(eq(doctorCategoryCommissions.doctorId, doctors.id), eq(doctorCategoryCommissions.categoryId, appointments.categoryId)))
    .toSQL() as { sql: string; params: unknown[] };
  const norm = text.replace(/\s+/g, ' ').replace(/"/g, '');
  const DCC = 'doctor_category_commissions';
  const chain = (col: string) =>
    `coalesce(${DCC}.${col}, doctors.${col}, doctors.platform_fee_percent, departments.platform_fee_percent, `;
  assert.ok(norm.includes(`case when appointments.mode = 'home' then ${chain('platform_fee_home_percent')}`), `home branch wrong: ${norm}`);
  assert.ok(norm.includes(`else ${chain('platform_fee_online_percent')}`), `online branch wrong: ${norm}`);
  assert.ok(!norm.includes(`${DCC}.platform_fee_percent,`), 'category commission is per-mode only; no shared category rate in the chain');
  assert.ok(norm.includes(`${DCC}.category_id = appointments.category_id`), 'category join must key off the booked category, not the doctor primary category');
  assert.ok(!norm.includes('doctors.category_id'), 'must not fall back to the doctor primary category');
  assert.deepEqual(params, [DEFAULT_PLATFORM_FEE_PERCENT, DEFAULT_PLATFORM_FEE_PERCENT], 'both modes must fall back to the 30 default');
});

try {
  // 3. Real Postgres round() must equal JS Math.round. This is the actual
  // payout expression, so a numeric-vs-float divergence fails here.
  const res = await pool.query<{ gross: string; rate: string; sql_fee: string; sql_net: string }>(
    `select g::text as gross, r::text as rate,
       round(g::numeric * r / 100)::text as sql_fee,
       (g - round(g::numeric * r / 100))::text as sql_net
     from unnest($1::bigint[]) as g
     cross join unnest($2::int[]) as r`,
    [CASES, RATES],
  );
  check(`SQL round() matches JS Math.round (${res.rows.length} combinations)`, () => {
    for (const row of res.rows) {
      const js = computeCommission(Number(row.gross), Number(row.rate));
      assert.equal(Number(row.sql_fee), js.platformFeePaise, `fee mismatch gross=${row.gross} rate=${row.rate}`);
      assert.equal(Number(row.sql_net), js.doctorEarningsPaise, `net mismatch gross=${row.gross} rate=${row.rate}`);
    }
  });
} catch (err) {
  FAILURES.push('postgres parity');
  console.error(`  SKIP postgres parity: ${(err as Error).message}`);
} finally {
  await pool.end();
}

if (FAILURES.length) {
  console.error(`\n${FAILURES.length} commission self-check(s) failed.`);
  process.exit(1);
}
console.log('\ncommission self-check passed.');

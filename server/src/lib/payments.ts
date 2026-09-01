import { randomUUID } from 'node:crypto';
import { doctorCashLedger, paymentTransactions } from '../db/schema';
import { db } from '../db/pool';

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function recordPaymentTransaction(
  tx: Tx,
  data: Omit<typeof paymentTransactions.$inferInsert, 'transactionId' | 'createdAt'>,
): Promise<void> {
  await tx.insert(paymentTransactions).values({ ...data, transactionId: genId('TXN') });
}

export async function recordCashEntry(
  tx: Tx,
  data: Omit<typeof doctorCashLedger.$inferInsert, 'createdAt'>,
): Promise<void> {
  await tx.insert(doctorCashLedger).values(data);
}

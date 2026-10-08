import { ConsultationMode, Doctor } from '../types';

// Effective price for one booking: the per-speciality price when a category is
// picked, else the doctor's own fee. Mirrors the server's effectiveFees.
export function feeFor(doctor: Doctor, mode: ConsultationMode, categoryId?: number | null): number {
  const cat = categoryId != null ? doctor.categories?.find((c) => c.categoryId === categoryId) : undefined;
  const price = mode === 'home' ? cat?.feeHome : cat?.feeOnline;
  return price ?? doctor.fees[mode];
}

// Card label: the min-max bracket across the doctor's prices, one number when
// they only price one thing, the doctor's own fee when the server sent none.
export function feeLabel(range: { min: number; max: number } | null | undefined, fallback: number): string {
  const fmt = (n: number) => n.toLocaleString('en-IN');
  if (!range) return fmt(fallback);
  return range.min === range.max ? fmt(range.min) : `${fmt(range.min)}\u2013${fmt(range.max)}`;
}

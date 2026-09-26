import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

interface FieldProps {
  /** Must match the `id` Field injects on the control. */
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  /** Absolutely positioned prefix, e.g. a lucide icon. */
  icon?: ReactNode;
  /** Absolutely positioned suffix, e.g. a show/hide-password button. */
  action?: ReactNode;
  /** The codebase has two label styles; override to match the surrounding form. */
  labelClass?: string;
  children: ReactNode;
}

/**
 * Label + control + inline error. The error is wired to the control with
 * `aria-invalid` / `aria-describedby`; the red border comes from the global
 * `[aria-invalid='true']` rule in index.css, so no per-form styling.
 */
export function Field({ id, label, error, hint, icon, action, labelClass, children }: FieldProps) {
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
      })
    : children;

  return (
    <div>
      <label htmlFor={id} className={labelClass ?? 'ml-1 text-xs font-bold text-slate-700'}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        {control}
        {action}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="ml-1 mt-1 text-xs text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="ml-1 mt-1 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

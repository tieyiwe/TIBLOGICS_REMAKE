"use client";

// Form fields in the admin kit style. TODO: switch to components/admin/ui
// when the kit grows form inputs.
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 hover:border-[#b5c3d6] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20 disabled:bg-[var(--a-surface-2)]";

export function FieldShell({ label, hint, error, children, htmlFor, optional }: { label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode; htmlFor: string; optional?: boolean }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 font-dm text-[12.5px] font-semibold text-[var(--a-ink-2)]">
        <span>{label}</span>
        {optional ? <span className="text-[11.5px] font-medium text-[var(--a-ink-3)]">Optional</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 font-dm text-[12.5px] font-medium text-[var(--a-danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 font-dm text-[12px] text-[var(--a-ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode; error?: string | null; optional?: boolean }>(
  function TextField({ label, hint, error, optional, className, id, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell label={label} hint={hint} error={error} htmlFor={fid} optional={optional}>
        <input ref={ref} id={fid} {...rest} className={cn(inputCls, "h-9", className)} aria-invalid={error ? true : undefined} />
      </FieldShell>
    );
  },
);

export function TextArea({
  label,
  hint,
  error,
  optional,
  className,
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode; error?: string | null; optional?: boolean }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={fid} optional={optional}>
      <textarea id={fid} {...rest} className={cn(inputCls, "min-h-[88px] resize-y py-2 leading-relaxed", className)} aria-invalid={error ? true : undefined} />
    </FieldShell>
  );
}

/** POST JSON and return the parsed answer; throws with the API's message. */
export async function postJson<T = Record<string, unknown>>(url: string, body: unknown, method = "POST"): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

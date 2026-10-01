import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--a-orange-text)] text-white hover:bg-[#9c4408] border border-transparent shadow-[0_1px_2px_rgba(13,27,42,.08)]",
  secondary:
    "bg-[var(--a-surface)] text-[var(--a-ink)] border border-[var(--a-border-strong)] hover:bg-[var(--a-surface-2)]",
  ghost: "bg-transparent text-[var(--a-ink-2)] border border-transparent hover:bg-[var(--a-surface-2)] hover:text-[var(--a-ink)]",
  danger: "bg-[var(--a-danger)] text-white border border-transparent hover:bg-[#991b1b]",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--a-radius-control)] font-dm font-semibold",
    "transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none select-none",
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A lucide icon component (or any element type taking `size`). */
  icon?: ElementType;
  iconRight?: ElementType;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: string;
    /** For href buttons: open in a new tab. */
    external?: boolean;
  };

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading,
  className,
  children,
  href,
  external,
  type,
  disabled,
  ...rest
}: ButtonProps) {
  const iconSize = size === "sm" ? 14 : 16;
  const content = (
    <>
      {loading ? (
        <LoaderCircle size={iconSize} className="animate-spin" aria-hidden />
      ) : Icon ? (
        <Icon size={iconSize} aria-hidden />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight size={iconSize} aria-hidden /> : null}
    </>
  );
  const cls = buttonClasses(variant, size, className);
  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={cls}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={rest["aria-label"]}
        title={rest.title}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type={type ?? "button"}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}

/** Square icon-only button; always pass an aria-label. */
export function IconButton({
  icon: Icon,
  className,
  size = "md",
  variant = "ghost",
  ...rest
}: Omit<ButtonProps, "children" | "icon"> & { icon: ElementType; "aria-label": string }) {
  return (
    <Button
      {...rest}
      variant={variant}
      size={size}
      className={cn(size === "sm" ? "w-8 px-0" : "w-9 px-0", className)}
      icon={Icon}
    />
  );
}

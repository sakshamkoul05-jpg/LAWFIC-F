import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small, server-safe building blocks shared by the compliance dashboard and
 * the free tools. No hooks and no "use client": every tool is a plain GET
 * form rendered on the server, so it works with JavaScript off, the result
 * has a URL someone can bookmark or send, and a search engine can read it.
 */

export const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-subtle focus:border-primary/50";

export function PageShell({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
  width = "max-w-5xl",
}: {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  crumbs?: { label: string; href: string }[];
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className={`mx-auto w-full ${width} px-5 py-12 sm:px-8`}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="type-label mb-6 flex flex-wrap gap-2 text-subtle">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex gap-2">
              <Link href={c.href} className="hover:text-primary">
                {c.label}
              </Link>
              {i < crumbs.length - 1 && <span aria-hidden>/</span>}
            </span>
          ))}
        </nav>
      )}
      <p className="type-label text-primary">{eyebrow}</p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.1] tracking-tight text-foreground">
        {title}
      </h1>
      {lead && <div className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{lead}</div>}
      <div className="mt-10">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="type-label block text-muted">{children}</span>
      {hint && <span className="mt-0.5 block text-[11.5px] text-subtle">{hint}</span>}
    </label>
  );
}

export function Field({
  name,
  label,
  hint,
  ...rest
}: { name: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label htmlFor={name} hint={hint}>
        {label}
      </Label>
      <input id={name} name={name} className={inputClass} {...rest} />
    </div>
  );
}

export function Select({
  name,
  label,
  options,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} hint={hint}>
        {label}
      </Label>
      <select id={name} name={name} defaultValue={defaultValue} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Check({
  name,
  label,
  defaultChecked,
  value = "1",
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  value?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/40 px-3.5 py-3 text-[13.5px] text-foreground has-[:checked]:border-primary/40 has-[:checked]:bg-primary-lighter">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 accent-[var(--color-primary)]" />
      <span>{label}</span>
    </label>
  );
}

export function Submit({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "quiet" }) {
  return (
    <button
      type="submit"
      className={
        variant === "primary"
          ? "inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover"
          : "inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-[12.5px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      }
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "quiet";
  external?: boolean;
}) {
  const cls =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover"
      : "inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-[12.5px] text-foreground transition-colors hover:border-primary/40 hover:text-primary";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <span aria-hidden className="ml-1.5">↗</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

const CHIP: Record<string, string> = {
  good: "bg-success-light text-success",
  bad: "bg-destructive-light text-destructive",
  warn: "bg-primary-light text-primary",
  neutral: "bg-surface-2 text-muted",
  info: "bg-accent-light text-accent",
};

export function Chip({ tone, children }: { tone: keyof typeof CHIP; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${CHIP[tone]}`}>
      {children}
    </span>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return <p className="mt-6 max-w-3xl text-[11.5px] leading-relaxed text-subtle">{children}</p>;
}

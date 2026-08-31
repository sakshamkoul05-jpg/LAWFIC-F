export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="25" height="25" rx="5" stroke="var(--color-primary)" strokeWidth="1" />
        <path
          d="M13 5.5 19 9v8l-6 3.5L7 17V9l6-3.5Z"
          stroke="var(--color-primary)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path d="M9.6 12.2h6.8M9.6 14.8h4.4" stroke="var(--color-primary)" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <span className="text-[17px] font-bold tracking-[0.14em] text-foreground">
        LAWFIC
      </span>
    </span>
  );
}

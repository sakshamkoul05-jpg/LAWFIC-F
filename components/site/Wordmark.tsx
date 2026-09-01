export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt="LAWFIC"
        className="h-9 w-9 object-contain sm:h-11 sm:w-11 lg:h-12 lg:w-12"
      />
      <span className="flex flex-col">
        <span className="font-display text-[18px] font-bold tracking-[-0.01em] text-foreground leading-none sm:text-[22px]">
          LAWFIC
        </span>
        <span className="mt-0.5 text-[8px] font-medium tracking-[0.12em] text-muted-fg uppercase leading-none sm:tracking-[0.14em] sm:text-[9.5px]">
          Registrations &amp; Compliance
        </span>
      </span>
    </span>
  );
}

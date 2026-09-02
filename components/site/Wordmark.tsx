export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt="LAWFIC"
        className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10 lg:h-11 lg:w-11"
      />
      <span className="flex flex-col">
        <span className="font-display text-[17px] font-bold tracking-[-0.02em] text-foreground leading-none sm:text-[20px]">
          LAWFIC
        </span>
        <span className="mt-0.5 hidden text-[8px] font-medium tracking-[0.12em] text-muted-fg uppercase leading-none sm:block sm:tracking-[0.14em] sm:text-[9.5px]">
          Registrations &amp; Compliance
        </span>
      </span>
    </span>
  );
}

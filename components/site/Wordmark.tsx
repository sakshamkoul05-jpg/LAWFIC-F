export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt="LAWFIC"
        className="h-10 w-10 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
      />
      <span className="flex flex-col">
        <span className="text-[17px] font-extrabold tracking-[0.14em] text-foreground leading-none sm:text-[22px]">
          LAWFIC
        </span>
        <span className="mt-0.5 text-[9px] font-medium tracking-[0.14em] text-muted uppercase leading-none sm:tracking-[0.18em] sm:text-[11px]">
          Quality Service With Love
        </span>
      </span>
    </span>
  );
}

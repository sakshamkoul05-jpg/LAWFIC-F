export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt="LAWFIC"
        className="logo-mark h-9 w-9 object-contain sm:h-10 sm:w-10"
      />
      <span className="flex flex-col">
        <span className="text-[16px] font-bold tracking-[0.14em] text-foreground leading-none">
          LAWFIC
        </span>
        <span className="text-[9px] font-medium tracking-[0.18em] text-muted uppercase leading-none mt-0.5">
          Quality Service With Love
        </span>
      </span>
    </span>
  );
}

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt="LAWFIC"
        className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      />
      <span className="flex flex-col">
        <span className="text-[22px] font-extrabold tracking-[0.14em] text-foreground leading-none">
          LAWFIC
        </span>
        <span className="text-[11px] font-medium tracking-[0.18em] text-muted uppercase leading-none mt-0.5">
          Quality Service With Love
        </span>
      </span>
    </span>
  );
}

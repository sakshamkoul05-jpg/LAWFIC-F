/**
 * The menu icon: four bars in four colours.
 *
 * Both menus on the bar use it — the site menu at the far left and the
 * account menu at the far right — so the two ends of the header read as a
 * pair. Colour is decoration on a control that already has a label; it
 * carries no meaning a viewer would miss without it.
 */
export default function MenuLines({ className = "size-[18px] sm:size-[22px] lg:size-[26px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden className={className}>
      <path d="M2 3.5h14" stroke="#C58F6B" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M2 7.2h14" stroke="#7FA8A0" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M2 10.9h14" stroke="#C9B87E" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M2 14.6h14" stroke="#8FA3C9" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

import type { IconKey } from "@/lib/catalogue";

/**
 * One icon per category, not one per service.
 *
 * Thirty-nine distinct glyphs would be noise — the icon's job here is to make
 * the grouping legible at a glance, so repeating it across a category is the
 * point rather than a shortcut. Drawn on a 20px grid, 1.3 stroke, to sit with
 * the hairline borders elsewhere.
 */
export default function CategoryIcon({
  name,
  className = "",
  size = 20,
}: {
  name: IconKey;
  className?: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    // An identity card with a portrait well.
    case "identity":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="16" height="12" rx="2" />
          <circle cx="7" cy="9" r="1.7" />
          <path d="M4.4 13.4c.4-1.3 1.4-2 2.6-2s2.2.7 2.6 2" />
          <path d="M12.4 8.6h3.2M12.4 11.4h2.2" />
        </svg>
      );

    // A storefront: awning over a door.
    case "business":
      return (
        <svg {...common}>
          <path d="M3 7.5 4.3 4h11.4L17 7.5" />
          <path d="M3 7.5c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2c0 1.1.9 2 2 2s2-.9 2-2" />
          <path d="M4.2 9.4V16h11.6V9.4" />
          <path d="M8.2 16v-3.6h3.6V16" />
        </svg>
      );

    // A receipt with a percentage.
    case "tax":
      return (
        <svg {...common}>
          <path d="M4.5 2.8h11v14.4l-2.2-1.4-2.15 1.4L9 15.8l-2.15 1.4-2.35-1.4V2.8Z" />
          <path d="m8 11.5 4-5" />
          <circle cx="8.2" cy="7.3" r=".9" />
          <circle cx="11.8" cy="10.7" r=".9" />
        </svg>
      );

    // A stamped certificate with a ribbon seal.
    case "licence":
      return (
        <svg {...common}>
          <path d="M4 3h9l3 3v6H4V3Z" />
          <path d="M13 3v3h3" />
          <path d="M6.5 6.5h4M6.5 9h5.5" />
          <circle cx="10" cy="15" r="2.6" />
          <path d="M8.6 17.1 8 19.4l2-1 2 1-.6-2.3" />
        </svg>
      );

    // A registered mark inside a shield.
    case "ip":
      return (
        <svg {...common}>
          <path d="M10 2.6 16.2 5v5c0 3.4-2.4 6.1-6.2 7.4C6.2 16.1 3.8 13.4 3.8 10V5L10 2.6Z" />
          <path d="M8.4 12V7.6h1.9a1.5 1.5 0 0 1 0 3H8.4" />
          <path d="m10.3 10.6 1.5 1.9" />
        </svg>
      );

    // Two people, one behind the other.
    case "payroll":
      return (
        <svg {...common}>
          <circle cx="8" cy="7" r="2.4" />
          <path d="M3.4 16c.4-2.6 2.3-4.1 4.6-4.1s4.2 1.5 4.6 4.1" />
          <path d="M13.4 5.2a2.4 2.4 0 0 1 .6 4.6" />
          <path d="M14.6 11.9c1.2.5 2 1.7 2.2 3.3" />
        </svg>
      );

    // A folded document with a signature line.
    case "legal":
      return (
        <svg {...common}>
          <path d="M5 2.6h6.6L15.4 6v11.4H5V2.6Z" />
          <path d="M11.4 2.6V6h4" />
          <path d="M7.6 13.6c1-1.3 1.6-.2 2.5-1.1s.4-1.9 1.3-2.4" />
          <path d="M7.6 15.8h5.2" />
        </svg>
      );
  }
}

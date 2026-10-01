"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useProfile } from "@/components/profile/ProfileProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * The logo quick icon bar — the client's row of eighteen, in their order and
 * with their labels, from "Saksham Sir Home Page Work.xlsx":
 *
 *   Theme · Partnership · Membership · My Network · Best Offer ·
 *   Gift Voucher & Cupon · My Add & Subscription · Aakhri Umeed ·
 *   Lawfic Pay Later · Lawfic Wallet · <Name> Money · Investment ·
 *   Instant Help · Lawfic Expert · Suggestion · Lawfic Store · Favourite ·
 *   My Shopping Bag
 *
 * COLOUR, ON PURPOSE
 *
 * The sheet draws these as colourful badges, not line icons, so they are
 * drawn here as small flat illustrations — each its own colours, all on one
 * 32-unit grid so they still read as a set. They are this site's own
 * drawings rather than the clip-art pasted into the sheet, which came from
 * sources nobody has the rights to.
 *
 * "<Name> Money" is the signed-in customer's first name ("Aarti Money" in the
 * sheet), and "My Money" for a visitor.
 */
type Action = { label: string; href: string; icon: React.ReactNode };

const ACTIONS: Action[] = [
  {
    label: "Partnership",
    href: "/partner",
    icon: (
      <>
        <path d="M16 3a13 13 0 0 1 11.3 6.5L22 12.5a7 7 0 0 0-6-3.5z" fill="#F4A12A" />
        <path d="M27.3 9.5a13 13 0 0 1 0 13L22 19.5a7 7 0 0 0 0-7z" fill="#3BA6A0" />
        <path d="M27.3 22.5A13 13 0 0 1 16 29v-6.5a7 7 0 0 0 6-3z" fill="#E1543B" />
        <path d="M16 29A13 13 0 0 1 4.7 22.5L10 19.5a7 7 0 0 0 6 3z" fill="#7BB342" />
        <path d="M4.7 22.5a13 13 0 0 1 0-13L10 12.5a7 7 0 0 0 0 7z" fill="#2E7DC1" />
        <path d="M4.7 9.5A13 13 0 0 1 16 3v6.5a7 7 0 0 0-6 3z" fill="#F2C94C" />
      </>
    ),
  },
  {
    label: "Membership",
    href: "/pricing",
    icon: (
      <>
        <path d="m16 2 3 3.2 4.3-.7.9 4.3 3.9 2-1.9 3.9 1.9 3.9-3.9 2-.9 4.3-4.3-.7L16 30l-3-3.2-4.3.7-.9-4.3-3.9-2 1.9-3.9L3.9 11.5l3.9-2 .9-4.3 4.3.7z" fill="#E6B23C" />
        <circle cx="16" cy="16" r="9" fill="#1B1B1B" />
        <text x="16" y="19.4" textAnchor="middle" fontSize="8.2" fontWeight="700" fill="#F2C94C" fontFamily="Georgia, serif">VIP</text>
      </>
    ),
  },
  {
    label: "My Network",
    href: "/social",
    icon: (
      <>
        <path d="M16 16 6 7M16 16l10-9M16 16 6 25M16 16l10 9" stroke="#2D6CB5" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="5" fill="#2D6CB5" />
        {[[6, 7], [26, 7], [6, 25], [26, 25]].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#5BC0BE" />
        ))}
      </>
    ),
  },
  {
    label: "Best Offer",
    href: "/#offers",
    icon: (
      <>
        <circle cx="16" cy="16" r="13.5" fill="#D7262B" />
        <circle cx="16" cy="16" r="10.5" fill="none" stroke="#F7C948" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <text x="16" y="15" textAnchor="middle" fontSize="6.6" fontWeight="800" fill="#FFF">BEST</text>
        <text x="16" y="21.5" textAnchor="middle" fontSize="6.2" fontWeight="800" fill="#F7C948">OFFER</text>
      </>
    ),
  },
  {
    label: "Gift Voucher & Cupon",
    href: "/gift",
    icon: (
      <>
        <rect x="4" y="12" width="24" height="16" rx="2" fill="#E1543B" />
        <rect x="3" y="9" width="26" height="5" rx="1.5" fill="#F27A54" />
        <rect x="14" y="9" width="4" height="19" fill="#F2C94C" />
        <path d="M16 9c-3-6-9-4-7 0M16 9c3-6 9-4 7 0" fill="none" stroke="#F2C94C" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "My Add & Subscription",
    href: "/your-ad",
    icon: (
      <>
        <circle cx="16" cy="16" r="13.5" fill="#C62828" />
        <circle cx="16" cy="16" r="10" fill="#FFF" />
        <path d="m16 9.5 2 4.3 4.6.5-3.4 3.1 1 4.6-4.2-2.4-4.2 2.4 1-4.6-3.4-3.1 4.6-.5z" fill="#C62828" />
      </>
    ),
  },
  {
    label: "Aakhri Umeed",
    href: "/aakhri-umeed",
    icon: (
      <>
        <circle cx="16" cy="16" r="13.5" fill="#E8F1FB" stroke="#2D8BD8" strokeWidth="1.6" />
        <path d="M16 22.5s-6-3.8-6-8a3.4 3.4 0 0 1 6-2.1 3.4 3.4 0 0 1 6 2.1c0 4.2-6 8-6 8Z" fill="#E94E77" />
        <path d="M6 22c3 3 6 4 10 4s7-1 10-4" fill="none" stroke="#F4A12A" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Lawfic Pay Later",
    href: "/wallet",
    icon: (
      <>
        <circle cx="16" cy="16" r="12.5" fill="none" stroke="#7A7A7A" strokeWidth="1.4" strokeDasharray="2 1.4" />
        <rect x="2" y="12" width="28" height="9" rx="1.5" fill="#F29C1F" />
        <text x="16" y="18.6" textAnchor="middle" fontSize="6" fontWeight="800" fill="#FFF">PAY LATER</text>
      </>
    ),
  },
  {
    label: "Lawfic Wallet",
    href: "/wallet",
    icon: (
      <>
        <path d="M6 9 22 4l2 5" fill="#4E9BE0" />
        <rect x="3" y="9" width="26" height="18" rx="3.5" fill="#1F6FBF" />
        <rect x="20" y="15" width="9" height="6" rx="2" fill="#FFF" />
        <circle cx="23.5" cy="18" r="1.4" fill="#1F6FBF" />
      </>
    ),
  },
  {
    label: "Money",
    href: "/profile",
    icon: (
      <>
        <rect x="4" y="4" width="24" height="22" rx="2.5" fill="none" stroke="#3E7CC7" strokeWidth="2.4" />
        <circle cx="13" cy="15" r="4.4" fill="none" stroke="#3E7CC7" strokeWidth="2" />
        <path d="M22 11v8" stroke="#3E7CC7" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M8 26v3M24 26v3" stroke="#3E7CC7" strokeWidth="2.4" />
      </>
    ),
  },
  {
    label: "Investment",
    href: "/investment",
    icon: (
      <>
        <circle cx="16" cy="16" r="14" fill="#2B2B2B" stroke="#E6B23C" strokeWidth="1.2" />
        <path d="M11.5 8h9M11.5 11.5h9M11.5 8h3a3.6 3.6 0 0 1 0 7.2h-3L18 21" fill="none" stroke="#F29C1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 21c2 3 5 4 9 4s7-1 9-4" fill="none" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Instant Help",
    href: "/instant-help",
    icon: (
      <>
        <circle cx="16" cy="13" r="5.5" fill="#E8B48A" />
        <path d="M7 27a9 9 0 0 1 18 0z" fill="#2D6CB5" />
        <path d="M9 13a7 7 0 0 1 14 0" fill="none" stroke="#333" strokeWidth="1.8" />
        <rect x="7.5" y="12" width="3" height="5" rx="1.2" fill="#333" />
        <path d="M21 4h8v5h-5l-2 2v-2h-1z" fill="#E94E77" />
        <path d="M3 22a14 14 0 0 0 4 6" fill="none" stroke="#E1543B" strokeWidth="2.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Lawfic Expert",
    href: "/professionalism",
    icon: (
      <>
        <path d="M16 3a12 12 0 1 0 6.8 21.9L28 29l-1.6-6.3A12 12 0 0 0 16 3Z" fill="none" stroke="#171717" strokeWidth="2.2" />
        <path d="M10.5 15.5h11a5.5 5.5 0 1 0-1.4 4" fill="none" stroke="#D7262B" strokeWidth="2.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Suggestion",
    href: "/contact",
    icon: (
      <>
        <circle cx="16" cy="16" r="13.5" fill="#EFE7F7" stroke="#7E57C2" strokeWidth="1.6" />
        <rect x="2.5" y="12" width="27" height="8" rx="1" fill="#7E57C2" transform="rotate(-12 16 16)" />
        <text x="16" y="18.4" textAnchor="middle" fontSize="5" fontWeight="800" fill="#FFF" transform="rotate(-12 16 16)">IDEA</text>
      </>
    ),
  },
  {
    label: "Lawfic Store",
    href: "/our-store",
    icon: (
      <>
        <rect x="5" y="14" width="22" height="14" rx="1.5" fill="#4E9BE0" />
        <path d="M3 8h26l-2 7H5z" fill="#E1543B" />
        <path d="M8 8l-1.2 7M13 8l-.6 7M19 8l.6 7M24 8l1.2 7" stroke="#FFF" strokeWidth="1.4" />
        <rect x="13" y="19" width="6" height="9" fill="#F2C94C" />
      </>
    ),
  },
  {
    label: "Favourite",
    href: "/wishlist?view=favourites",
    icon: <path d="M16 28S3 20.2 3 11.6A6.6 6.6 0 0 1 16 8.4a6.6 6.6 0 0 1 13 3.2C29 20.2 16 28 16 28Z" fill="#3E7CC7" />,
  },
  {
    label: "My Shopping Bag",
    href: "/cart",
    icon: (
      <>
        <path d="M10 13 16 4l6 9" fill="none" stroke="#3E7CC7" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M3 13h26l-3 15H6z" fill="#3E7CC7" />
        <path d="M9 17v8M13 17v8M17 17v8M21 17v8M6 21h20" stroke="#FFF" strokeWidth="1.4" />
      </>
    ),
  },
];

export default function HeaderActions({ className = "" }: { className?: string }) {
  const { tx } = useLocale();
  const { firstName } = useProfileName();

  return (
    <div className={`flex-wrap items-stretch justify-center gap-y-1 ${className}`}>
      {/* Theme first, as in the sheet — the site's own light/dark switch. */}
      <span title={tx("Theme")} className="header-quick-cell">
        <span className="grid h-[30px] place-items-center [&_button]:!size-[30px] [&_button]:!rounded-full [&_button]:!border-0 [&_button]:!bg-[#2D6CB5]/10 [&_button]:!text-[#2D6CB5]">
          <ThemeToggle />
        </span>
        <Label>{tx("Theme")}</Label>
      </span>

      {ACTIONS.map((a) => {
        const label = a.label === "Money" ? `${firstName || tx("My")} ${tx("Money")}` : tx(a.label);
        return (
          <Link key={a.label} href={a.href} aria-label={label} title={label} className="header-quick-cell">
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden className="header-quick-icon">
              {a.icon}
            </svg>
            <Label>{label}</Label>
          </Link>
        );
      })}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="block w-full text-center text-[9.5px] font-medium leading-[1.15] text-foreground/85">{children}</span>;
}

function useProfileName() {
  const { profile } = useProfile();
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] ?? "";
  return { firstName };
}

import type { LucideIcon } from "lucide-react";
import {
  BotMessageSquare,
  CalendarCheck,
  Headset,
  HelpCircle,
  IndianRupee,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  PhoneCall,
  ShoppingBag,
} from "lucide-react";
import { company } from "@/lib/company";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE ONE FILE YOU EDIT.
 *
 *  Every phone number, e-mail address, WhatsApp number and destination the
 *  Quick Actions widget can reach is in this file and nowhere else. Change a
 *  value here and it changes on every page, in the floating ball and in the
 *  homepage trigger at once.
 *
 *  The three CONTACT values default to lib/company.ts, which is the file the
 *  footer, the invoices and the grievance page already read. Fill them there
 *  and they appear here for free; put a literal string below to override.
 * ─────────────────────────────────────────────────────────────────────────
 */

/* ── 1. CONTACT DETAILS ────────────────────────────────────────────────────
   An empty string means "not configured yet". The row still appears — the
   client's brief fixes the list at eight — but it does not pretend to dial a
   number nobody answers. Fill lib/company.ts (supportPhone, supportEmail,
   whatsapp) or type the value here. */
const contact = {
  /** Digits only, with country code, no plus sign and no spaces: 919876543210 */
  whatsapp: (company.whatsapp ?? "").replace(/\D/g, ""),
  /** help@lawfic.pro */
  email: company.supportEmail ?? "",
  /** Dialable, with country code: +919876543210 */
  phone: company.supportPhone ?? "",
};

/** Pre-filled first line of the WhatsApp chat. */
const whatsappGreeting = "Hello LAWFIC, I need some help.";

/* ── 2. WHERE EACH ACTION GOES ─────────────────────────────────────────────
   Internal paths start with a slash. External links start with https:// and
   open in a new tab automatically. */
const links = {
  consultancy: "/instant-help",
  payment: "/wallet/topup",
  store: "/our-store",
  shop: "/lawfic",
  postAd: "/your-ad",
  faq: "/contact",
  support: "/contact",
};

/* ── 3. THE HEADER ─────────────────────────────────────────────────────────
   The client's mock shows a sample name. A signed-in visitor sees their own
   name instead; a signed-out visitor sees no name at all rather than a
   stranger's, which is why this is a greeting and not a placeholder person. */
export const header = {
  eyebrow: "Welcome",
  question: "Today, How Can I help you ?",
  /** Shown to signed-out visitors in place of a name. Blank hides the line. */
  signedOutName: "",
} as const;

export const tooltip = "Help & Quick Actions";

/* ── 4. THE ACTIONS ────────────────────────────────────────────────────────
   The eight labels are the client's, verbatim, and the list is deliberately
   fixed at eight. Reorder freely; rewording is a decision for LAWFIC, not for
   this file. */
export type QuickAction = {
  id: string;
  label: string;
  /** One quiet line under the label. */
  hint: string;
  icon: LucideIcon;
  /** Absent when the underlying contact detail has not been configured yet. */
  href?: string;
  /** mailto:, tel: and wa.me leave the site, so they must not be routed. */
  external?: boolean;
  /**
   * Swaps the panel to another view instead of going anywhere. An action
   * with this set has no href and is not a link — it is a button, because
   * it does not navigate and must not offer a middle-click or a new tab.
   */
  opensView?: "chat";
};

const waHref = contact.whatsapp
  ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(whatsappGreeting)}`
  : undefined;
const telHref = contact.phone ? `tel:${contact.phone.replace(/\s+/g, "")}` : undefined;

export const quickActions: QuickAction[] = [
  /* First, at the client's request. It is the only row that opens something
     inside the panel rather than taking the visitor away from it. */
  {
    id: "panda",
    label: "Chat with Panda AI",
    hint: "Ask anything, answered instantly",
    icon: BotMessageSquare,
    opensView: "chat",
  },
  {
    id: "consultancy",
    label: "Book free consultancy",
    hint: "Talk to an advisor, no charge",
    icon: CalendarCheck,
    href: links.consultancy,
  },
  {
    id: "whatsapp",
    label: "Connect to whatsapp",
    hint: "Chat with us now",
    icon: MessageCircle,
    href: waHref,
    external: true,
  },
  {
    id: "email",
    label: "E-mail to us",
    hint: contact.email || "Write to our team",
    icon: Mail,
    href: contact.email ? `mailto:${contact.email}` : undefined,
    external: true,
  },
  {
    id: "call",
    label: "Call to us",
    hint: contact.phone || company.supportHours,
    icon: Phone,
    href: telHref,
    external: true,
  },
  {
    id: "payment",
    label: "Instant any payment",
    hint: "Top up or pay securely",
    icon: IndianRupee,
    href: links.payment,
  },
  {
    id: "store",
    label: "Find Store",
    hint: "Locate us near you",
    icon: MapPin,
    href: links.store,
  },
  {
    id: "shop",
    label: "Shop anything",
    hint: "Browse the LAWFIC store",
    icon: ShoppingBag,
    href: links.shop,
  },
  {
    id: "post-ad",
    label: "Post Add With Lawfic",
    hint: "Advertise to our audience",
    icon: Megaphone,
    href: links.postAd,
  },
];

/* ── 5. THE HELP PANEL ─────────────────────────────────────────────────────
   Reached from the footer of the main panel. It replaces the list in place
   rather than opening a second window. */
export const helpActions: QuickAction[] = [
  {
    id: "faq",
    label: "FAQ",
    hint: "Answers to common questions",
    icon: HelpCircle,
    href: links.faq,
  },
  {
    id: "contact-support",
    label: "Contact Support",
    hint: company.supportHours,
    icon: Headset,
    href: links.support,
  },
  {
    id: "book-consultation",
    label: "Book Consultation",
    hint: "Pick a time that suits you",
    icon: CalendarCheck,
    href: links.consultancy,
  },
  {
    id: "whatsapp-support",
    label: "WhatsApp Support",
    hint: "Chat with us now",
    icon: MessageCircle,
    href: waHref,
    external: true,
  },
  {
    id: "call-support",
    label: "Call Support",
    hint: contact.phone || company.supportHours,
    icon: PhoneCall,
    href: telHref,
    external: true,
  },
];

/* ── 6. POSITION AND SIZE ──────────────────────────────────────────────────
   These feed straight into inline styles, so they are the only numbers to
   touch to move or resize the widget. */
export const geometry = {
  /** Distance from the bottom edge, in px. Where the ball RESTS before the
      visitor drags it somewhere else. */
  offsetBottom: { desktop: 24, mobile: 16 },
  /** Distance from the right edge, in px. */
  offsetRight: { desktop: 24, mobile: 16 },
  /** Ball diameter, in px. Never below 44 — that is the minimum touch target. */
  ballSize: { desktop: 84, mobile: 72 },
  /** Panel width, in px. Mobile falls back to the viewport minus both offsets. */
  panelWidth: 332,
} as const;

/* ── 6b. MOVING IT ────────────────────────────────────────────────────────
   The ball can be dragged anywhere on screen and stays where it is put.
   It remains position:fixed on purpose: the client's brief is that it is
   reachable from every page wherever you are on it ("hum kahi bhi rahe"), and
   a ball that scrolled away with the document would be unreachable exactly
   when somebody wanted it. What DOES respond to scroll is the orb behind the
   panda, which turns as the page moves, plus a small parallax drift. */
export const dragging = {
  enabled: true,
  /** Pointer travel, in px, past which a gesture counts as a drag, not a tap. */
  threshold: 5,
  /** Keeps the ball this far inside the viewport edges while dragging. */
  edgePadding: 8,
  /** Where the dragged position is remembered, per browser. Null disables it. */
  storageKey: "lawfic:panda-position",
  /** How far the ball drifts as the page scrolls, in px. 0 turns it off. */
  scrollDrift: 10,
} as const;

/* ── 7. COLOURS ────────────────────────────────────────────────────────────
   Named tokens, not literals, so the widget follows the rest of the site. The
   defaults are the navy and gold band tokens defined in app/globals.css.
   Change them THERE to restyle every dark surface on the site at once, or
   override just the widget by replacing a value below with a literal colour. */
export const palette = {
  /* Very slightly translucent so the panel's backdrop blur has something to
     do — an opaque fill over a blur is just an opaque fill. 93% keeps text
     contrast well clear of the WCAG floor over any page behind it. */
  surface: "color-mix(in srgb, var(--band-deep, #060E22) 93%, transparent)",
  surfaceLift: "color-mix(in srgb, var(--band, #0B1D4A) 90%, transparent)",
  headerFrom: "var(--band, #0B1D4A)",
  headerTo: "var(--band-lift, #142C66)",
  ink: "var(--band-ink, #F2EEE4)",
  inkDim: "var(--band-ink-dim, rgba(242,238,228,0.78))",
  gold: "var(--band-gold, #E6C36B)",
  edge: "var(--band-edge, rgba(230,195,107,0.22))",
} as const;

/* ── 8. THE ORB ───────────────────────────────────────────────────────────
   The glowing sphere the panda sits on, drawn by PandaOrb.tsx. The client's
   reference was a watermarked stock clip of a magenta energy orb; this is an
   original take on it, so the colours are ours to choose. Swap them for the
   brand gold (--band-gold) if the violet ever reads as off-brand. */
export const orb = {
  /** Hot centre. */
  core: "#C74BF0",
  /** Outer body, where it falls into shadow. */
  deep: "#3A0D6B",
  /** The rim light and the sparks. */
  hot: "#FF8AF0",
  /** How far the bloom spills past the ball, in px. */
  bloom: 22,

  /* Fixed rather than random: a value from Math.random() differs between the
     server render and the browser's, which React reports as a hydration
     mismatch. Hand-picked so no two sparks pulse together. */
  sparks: [
    { x: 22, y: 18, r: 2.5, delay: 0.0, duration: 3.4 },
    { x: 74, y: 12, r: 2.0, delay: 0.7, duration: 4.1 },
    { x: 88, y: 44, r: 2.8, delay: 1.5, duration: 3.1 },
    { x: 12, y: 52, r: 2.2, delay: 2.2, duration: 3.8 },
    { x: 34, y: 78, r: 2.6, delay: 0.4, duration: 4.4 },
    { x: 66, y: 84, r: 2.0, delay: 1.9, duration: 3.3 },
    { x: 50, y: 8, r: 2.4, delay: 2.8, duration: 3.9 },
    { x: 92, y: 70, r: 1.8, delay: 1.1, duration: 4.6 },
    { x: 8, y: 30, r: 2.1, delay: 3.3, duration: 3.2 },
    { x: 58, y: 40, r: 1.6, delay: 0.9, duration: 4.8 },
    { x: 40, y: 60, r: 1.9, delay: 2.5, duration: 3.6 },
    { x: 80, y: 26, r: 2.3, delay: 1.6, duration: 4.2 },
  ],
} as const;

/**
 * THE PANDA'S FACE.
 *
 * By default the panda is drawn as inline SVG by PandaFace.tsx, so it blinks
 * with real eyelid motion and costs no extra request.
 *
 * TO USE YOUR OWN ARTWORK INSTEAD: save the two frames into /public and name
 * them here — `open` with the eyes open, `blink` with them closed or winking.
 * PandaFace cross-fades between the two on the same blink rhythm. Both must be
 * set; one alone falls back to the drawn panda. Square images with a
 * transparent or white background work best.
 *
 *   open: "/panda-open.png",
 *   blink: "/panda-blink.png",
 */
export const pandaFrames: { open: string | null; blink: string | null } = {
  open: "/panda-open.png",
  blink: "/panda-blink.png",
};

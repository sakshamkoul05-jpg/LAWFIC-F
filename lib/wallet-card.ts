/**
 * What a LAWFIC card is, and what actually differs between them.
 *
 * The previous model offered five "card types" — Standard, Premium, Business,
 * Student, Advocate — which were colour swaps and nothing else. They implied a
 * tier system the business does not have: no membership gates them, nothing
 * earns them, and "Premium" on an account holding ₹0 is a claim with nothing
 * behind it. Choosing between them was choosing a wallpaper that pretended to
 * be a status.
 *
 * Three separate ideas replace it, each honest about what it is:
 *
 *   ENTITY    — what the holder actually is. Changes what the card *says*: a
 *               company carries a CIN, a proprietor a Udyam number, an
 *               individual a PAN. Different information, not different paint.
 *
 *   FINISH    — the openly cosmetic choice. Matte, gloss, brushed, etched.
 *               It admits to being surface treatment and nothing more.
 *
 *   SIGNATURE — see `signatureFor`. Generated from the customer's real filing
 *               history, so the card is unique to them and earned rather than
 *               picked.
 */

export type EntityId = "individual" | "proprietor" | "firm" | "company" | "professional";

export type Entity = {
  id: EntityId;
  /** Shown in the picker. */
  name: string;
  /** Why someone would choose it — the actual distinguishing fact. */
  desc: string;
  /** The identifier this kind of holder is known by. */
  idLabel: string;
  /** Shape hint rendered on the card when no real number is on file. */
  idFormat: string;
};

export const ENTITIES: Entity[] = [
  {
    id: "individual",
    name: "Individual",
    desc: "Filing in your own name.",
    idLabel: "PAN",
    idFormat: "ABCDE0000F",
  },
  {
    id: "proprietor",
    name: "Proprietor",
    desc: "A business you run in your own name.",
    idLabel: "UDYAM",
    idFormat: "UDYAM-XX-00-0000000",
  },
  {
    id: "firm",
    name: "Firm / LLP",
    desc: "A partnership or limited liability partnership.",
    idLabel: "LLPIN",
    idFormat: "AAA-0000",
  },
  {
    id: "company",
    name: "Company",
    desc: "Private limited, OPC or public limited.",
    idLabel: "CIN",
    idFormat: "U00000XX0000XXX000000",
  },
  {
    id: "professional",
    name: "Professional",
    desc: "Practising CA, CS, advocate or consultant.",
    idLabel: "REG. NO.",
    idFormat: "000000",
  },
];

export function getEntity(id: string): Entity | undefined {
  return ENTITIES.find((e) => e.id === id);
}

export type FinishId = "matte" | "gloss" | "brushed" | "etched";

export type Finish = {
  id: FinishId;
  name: string;
  desc: string;
  /** How strong the specular sweep reads on this surface. */
  sheen: number;
  /** Overlay texture drawn across the card face. */
  texture: "none" | "grain" | "lines" | "engrave";
};

export const FINISHES: Finish[] = [
  { id: "matte", name: "Matte", desc: "Flat and quiet. Almost no reflection.", sheen: 0.08, texture: "grain" },
  { id: "gloss", name: "Gloss", desc: "A hard, wet-looking highlight.", sheen: 0.4, texture: "none" },
  { id: "brushed", name: "Brushed", desc: "Fine directional grain, like milled metal.", sheen: 0.22, texture: "lines" },
  { id: "etched", name: "Etched", desc: "The signature cut into the surface.", sheen: 0.14, texture: "engrave" },
];

export function getFinish(id: string): Finish | undefined {
  return FINISHES.find((f) => f.id === id);
}

/* ------------------------------------------------------------------------- */

/**
 * The seven service categories, and the colour each one contributes to a
 * card's signature. Warm family throughout, so a card with filings across all
 * seven still reads as one object rather than a pie chart.
 *
 * Ids match `lib/catalogue.ts`.
 */
export const CATEGORY_INK: Record<string, string> = {
  identity: "#D0AE55",
  business: "#86D3AB",
  tax: "#96C2DD",
  licence: "#E3A079",
  ip: "#D9A8C4",
  payroll: "#C9B78F",
  legal: "#9FBE8E",
};

export type CategorySpend = Record<string, number>;

export type Blot = {
  category: string;
  ink: string;
  /** 0..1 within the card face. */
  x: number;
  y: number;
  /** Radius as a fraction of card width. */
  r: number;
  opacity: number;
};

export type Signature = {
  /** Deterministic per account — two accounts never draw the same base. */
  seedAngle: number;
  seedDrift: number;
  blots: Blot[];
  /** True until the first debit lands. */
  blank: boolean;
};

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** A small deterministic generator, so a card looks identical on every device. */
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (Math.abs(s) % 100000) / 100000;
  };
}

/**
 * Build a card's signature from what the customer has actually filed.
 *
 * Every debit on the ledger belongs to a service, every service to one of the
 * seven categories, so the totals below are real money against real work — not
 * a decoration parameterised by a random number. A brand-new account draws
 * almost nothing; the card fills in as its holder uses it, which is the point.
 *
 * The account id seeds the placement, so two customers who happen to have
 * filed identical work still carry visibly different cards.
 */
export function signatureFor(accountId: string, spend: CategorySpend): Signature {
  const h = hash(accountId || "lawfic");
  const rand = rng(h);

  const total = Object.values(spend).reduce((a, b) => a + b, 0);
  const present = Object.entries(spend).filter(([, v]) => v > 0);

  const blots: Blot[] = present.map(([category, amount]) => {
    const share = total > 0 ? amount / total : 0;
    return {
      category,
      ink: CATEGORY_INK[category] ?? "#C9B78F",
      // Kept away from the extreme edges so nothing clips at the card corners.
      x: 0.12 + rand() * 0.76,
      y: 0.14 + rand() * 0.72,
      // Square-rooted so one large filing does not swallow the whole face.
      r: 0.14 + Math.sqrt(share) * 0.3,
      opacity: 0.3 + share * 0.4,
    };
  });

  return {
    seedAngle: (h % 360),
    seedDrift: ((h >> 7) % 100) / 100,
    blots,
    blank: blots.length === 0,
  };
}

/** Turn ledger rows into per-category totals. */
export function spendByCategory(
  rows: Array<{ direction: string; amount_paise: number; category?: string | null }>,
): CategorySpend {
  const out: CategorySpend = {};
  for (const r of rows) {
    if (r.direction !== "debit" || !r.category) continue;
    out[r.category] = (out[r.category] ?? 0) + r.amount_paise;
  }
  return out;
}

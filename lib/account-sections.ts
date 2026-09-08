/**
 * The customer profile, as the client set it out.
 *
 * Transcribed from sheet 3, "CUSTOMER PROFILE", of the blueprint: nine groups
 * marked "##" with their rows marked "*". The wording is theirs.
 *
 * WHAT "live" MEANS HERE, AND WHY MOST ROWS DO NOT HAVE IT
 *
 * A row is live when there is a page behind it that does the thing. The rest
 * are drawn but not linked, because a settings list whose rows lead to a 404 is
 * worse than one that says plainly which parts are built — the reader learns
 * the shape of their account either way, and only one of the two versions is
 * honest about it. This file is therefore also the build list: every row
 * without an href is a page still to write.
 */

export type AccountRow = {
  /** The client's wording, verbatim. */
  label: string;
  /** Present only when a page exists. */
  href?: string;
  /** One line under the label, where the label alone is ambiguous. */
  note?: string;
};

export type AccountGroup = {
  id: string;
  /** Their heading. `{name}` is replaced with the customer's first name. */
  title: string;
  rows: AccountRow[];
};

export const ACCOUNT_GROUPS: AccountGroup[] = [
  {
    id: "profile",
    title: "Profile",
    rows: [
      { label: "Name", href: "/profile/edit" },
      { label: "Change Profile & Cover Pics" },
      { label: "Mobile Number", href: "/profile/edit" },
      { label: "Email ID & Website", href: "/profile/edit" },
    ],
  },
  {
    id: "wallet",
    title: "Wallet",
    rows: [
      { label: "Wallet Balance", href: "/wallet" },
      { label: "Wallet Auto Reload Money", note: "Top up automatically below a limit you set." },
      { label: "Wallet Theme & Design", href: "/wallet/customize" },
      { label: "Wallet Security Question" },
      { label: "Create & Design Own Wallet", href: "/wallet/customize" },
      { label: "Wallet Password / PIN Change" },
      { label: "Wallet Transaction History", href: "/wallet/transactions" },
      { label: "Download Wallet Statement" },
      { label: "Refer Friend & Earn Money" },
    ],
  },
  {
    id: "dashboard",
    title: "Dash Board",
    rows: [{ label: "Set Dash Board Preference" }],
  },
  { id: "address", title: "Address", rows: [{ label: "Saved addresses" }] },
  {
    id: "wishlist",
    title: "Wish List",
    rows: [{ label: "Everything you have saved", href: "/wishlist" }],
  },
  {
    id: "privacy",
    title: "Account Privacy",
    rows: [
      { label: "Who can see your details" },
      { label: "Privacy policy", href: "/legal/privacy" },
    ],
  },
  { id: "storage", title: "Your Storage File", rows: [{ label: "Documents held for you" }] },
  {
    id: "offline",
    title: "Your Offline File",
    rows: [{ label: "Files collected at a branch" }],
  },
];

/**
 * The money summary — "Aditya Money" in the sheet, which lists the LAWFIC
 * wallet alongside a savings account, two recurring deposits, an insurance fund
 * and a post office account, each with a figure.
 *
 * ONLY THE FIRST ONE IS A NUMBER WE CAN KNOW
 *
 * The wallet balance comes from our own ledger. The other five are accounts at
 * other institutions, and LAWFIC is not connected to any of them: reading a
 * customer's bank balance in India means going through an RBI-licensed Account
 * Aggregator, with that customer's consent, under a licence this business does
 * not hold. The figures in the sheet are illustrative, and printing them — or
 * anything like them — next to a real name would tell a customer we can see
 * their bank, which we cannot.
 *
 * So the rows are kept, because the client wants the shape of the summary, and
 * every one of them says plainly that it is not connected. What turns them into
 * numbers later is either a licensed aggregator or a figure the customer types
 * in themselves and knows they typed.
 */
export const MONEY_ROWS: { label: string; source: "wallet" | "external" }[] = [
  { label: "Lawfic Wallet Balance", source: "wallet" },
  { label: "Saving A/C Balance", source: "external" },
  { label: "RD A/C Balance", source: "external" },
  { label: "Second RD A/C Balance", source: "external" },
  { label: "Insurance Fund Balance", source: "external" },
  { label: "Post Office A/C Balance", source: "external" },
];

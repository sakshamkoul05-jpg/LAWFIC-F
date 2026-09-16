/**
 * Types for @cashfreepayments/cashfree-js, which ships none.
 *
 * Written from their README and the runtime shape, and deliberately NARROWER
 * than what the SDK accepts: only the options this app actually uses are
 * declared. A wide `Record<string, unknown>` would typecheck a misspelt
 * `paymentSessionID` and fail at the moment a customer presses pay.
 *
 * If the SDK ever ships its own types, delete this file — a hand-written
 * declaration that disagrees with the real one is worse than none.
 */
declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeMode = "sandbox" | "production";

  export type CheckoutOptions = {
    paymentSessionId: string;
    /**
     * `_modal` keeps the customer on our page; `_self` navigates away to
     * Cashfree's hosted page and comes back via return_url.
     */
    redirectTarget?: "_self" | "_blank" | "_modal" | HTMLElement;
    returnUrl?: string;
  };

  export type CheckoutResult = {
    /** Set when checkout could not start or the customer's payment failed. */
    error?: { message?: string; code?: string; type?: string };
    /** True when the SDK handed off to a redirect rather than resolving here. */
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string } & Record<string, unknown>;
  };

  export type Cashfree = {
    checkout(options: CheckoutOptions): Promise<CheckoutResult>;
  };

  /** Resolves to null in a server environment. */
  export function load(options: { mode: CashfreeMode }): Promise<Cashfree | null>;
}

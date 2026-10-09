/**
 * "What do I need?" — from a handful of facts about a business, which
 * registrations the law asks of it.
 *
 * ⚠ THRESHOLDS ARE LAW AND THEY CHANGE. Checked October 2026:
 *   - GST: s.22 CGST Act and Notification 10/2019 – Central Tax (goods ₹40 lakh
 *     where the state opted in, ₹20 lakh elsewhere; services ₹20 lakh, ₹10 lakh
 *     in Manipur, Mizoram, Nagaland and Tripura); s.24 for registration
 *     regardless of turnover.
 *   - FSSAI: turnover limits revised with effect from 1 April 2026 — basic
 *     registration up to ₹1.5 crore, state licence to ₹50 crore, central above.
 *   - Udyam: lib/msme.ts, which carries its own warning.
 *   - EPF from 20 employees, ESI from 10 (most states).
 *
 * Every answer says WHY, in a sentence, because "you need GST" with no reason
 * is a sales line, and the customer should be able to check it.
 */

import { classify, type Classification } from "../msme.ts";

const LAKH = 100_000;
const CRORE = 10_000_000;

export type Supply = "goods" | "services" | "both";

export type EligibilityInput = {
  state: string;
  supply: Supply;
  /** Aggregate turnover for the year, rupees, all-India, same PAN. */
  turnover: number;
  /** Investment in plant, machinery and equipment, rupees. */
  investment?: number;
  interState: boolean;
  ecommerce: boolean;
  food: boolean;
  importExport: boolean;
  /** Operates from more than one state (decides FSSAI central). */
  multiState: boolean;
  employees: number;
};

export type Verdict = "required" | "recommended" | "not-required" | "check";

export type Finding = {
  id: string;
  title: string;
  verdict: Verdict;
  why: string;
  /** Catalogue slug for "Get it done". */
  slug?: string;
};

/** States where the goods threshold stays at ₹20 lakh. */
const GOODS_20L = new Set(["TG", "PY", "ML", "MZ", "TR", "MN", "SK", "NL", "AR", "UK"]);
/** States where the services threshold is ₹10 lakh. */
const SERVICES_10L = new Set(["MN", "MZ", "NL", "TR"]);

/** States that levy professional tax. Verify before relying on it. */
const PT_STATES = new Set([
  "MH", "KA", "WB", "AP", "TG", "TN", "GJ", "KL", "MP", "AS", "ML", "TR",
  "SK", "OR", "BR", "JH", "MN", "MZ", "NL", "PY",
]);

export function gstThreshold(state: string, supply: Supply): number {
  const goods = GOODS_20L.has(state) ? 20 * LAKH : 40 * LAKH;
  const services = SERVICES_10L.has(state) ? 10 * LAKH : 20 * LAKH;
  if (supply === "goods") return goods;
  if (supply === "services") return services;
  // Both: the services limit applies to the whole turnover.
  return services;
}

export function fssaiTier(turnover: number, importExport: boolean, multiState: boolean): {
  tier: "basic" | "state" | "central";
  why: string;
} {
  if (importExport) return { tier: "central", why: "Importers and exporters of food need a central licence whatever their turnover." };
  if (turnover > 50 * CRORE) return { tier: "central", why: "Turnover above ₹50 crore needs a central licence." };
  if (multiState) return { tier: "central", why: "Operating in more than one state usually needs a central licence for the head office, with state licences for each unit." };
  if (turnover > 1.5 * CRORE) return { tier: "state", why: "Turnover between ₹1.5 crore and ₹50 crore needs a state licence." };
  return { tier: "basic", why: "Turnover up to ₹1.5 crore needs basic FSSAI registration." };
}

const inr = (n: number) =>
  n >= CRORE ? `₹${+(n / CRORE).toFixed(2)} crore` : `₹${+(n / LAKH).toFixed(2)} lakh`;

export function assess(i: EligibilityInput): { findings: Finding[]; msme: Classification | null } {
  const findings: Finding[] = [];

  /* GST */
  const threshold = gstThreshold(i.state, i.supply);
  const compulsory: string[] = [];
  if (i.interState && i.supply !== "services") compulsory.push("you sell goods to other states");
  /* Notification 34/2023 – Central Tax: from 1 October 2023 a goods seller on
     a marketplace may stay unregistered if it sells only within its own state
     and turnover is up to ₹20 lakh — with an enrolment number instead. */
  const ecomExempt = i.ecommerce && !i.interState && i.turnover <= 20 * LAKH;
  if (i.ecommerce && i.supply !== "services" && !ecomExempt) compulsory.push("you sell goods through an e-commerce marketplace");
  if (compulsory.length) {
    findings.push({
      id: "gst",
      title: "GST registration",
      verdict: "required",
      why: `Required whatever your turnover, because ${compulsory.join(" and ")} (s.24).`,
      slug: "gst",
    });
  } else if (ecomExempt && i.supply !== "services") {
    findings.push({
      id: "gst",
      title: "GST registration",
      verdict: "recommended",
      why: "Not compulsory yet: you sell only within your state through a marketplace and turnover is up to ₹20 lakh, so you can sell with a GST enrolment number instead (Notification 34/2023). The moment you ship to another state, registration becomes compulsory.",
      slug: "gst",
    });
  } else if (i.turnover > threshold) {
    findings.push({
      id: "gst",
      title: "GST registration",
      verdict: "required",
      why: `Your turnover of ${inr(i.turnover)} is above the ${inr(threshold)} limit for ${i.supply === "goods" ? "goods" : "services"} in your state.`,
      slug: "gst",
    });
  } else {
    findings.push({
      id: "gst",
      title: "GST registration",
      verdict: i.turnover > threshold * 0.75 ? "recommended" : "not-required",
      why:
        i.turnover > threshold * 0.75
          ? `Not yet — you are at ${inr(i.turnover)} against a ${inr(threshold)} limit. You must register within 30 days of crossing it, so it is worth starting now.`
          : `Not required below ${inr(threshold)}. Some business buyers will still ask for a GSTIN so they can claim credit.`,
      slug: "gst",
    });
  }

  /* Udyam */
  let msme: Classification | null = null;
  if (i.investment !== undefined) {
    msme = classify(i.investment, i.turnover);
  }
  findings.push({
    id: "udyam",
    title: "Udyam (MSME) registration",
    verdict: msme && msme.result === "beyond" ? "not-required" : "recommended",
    why:
      msme && msme.result !== "beyond"
        ? `You would be classed ${msme.label.toLowerCase()}. It is free, and it is what banks and buyers check for MSME benefits.`
        : msme
          ? "Your figures are above the medium-enterprise limits, so Udyam does not apply."
          : "Free, and what banks and buyers check for MSME benefits. Add your investment figure to see your class.",
    slug: "msme-udyam",
  });

  /* FSSAI */
  if (i.food) {
    const f = fssaiTier(i.turnover, i.importExport, i.multiState);
    findings.push({
      id: "fssai",
      title: f.tier === "basic" ? "FSSAI basic registration" : f.tier === "state" ? "FSSAI state licence" : "FSSAI central licence",
      verdict: "required",
      why: f.why,
      slug: "fssai",
    });
  }

  /* IEC */
  if (i.importExport) {
    findings.push({
      id: "iec",
      title: "Import Export Code (IEC)",
      verdict: "required",
      why: "Customs will not clear a shipment for a business without one.",
      slug: "iec",
    });
  }

  /* Shop & Establishment */
  findings.push({
    id: "shop",
    title: "Shop & Establishment registration",
    verdict: "check",
    why: "Most states require it for any premises open to the public or with staff, usually within 30 days of opening. The rules are your state's.",
    slug: "shop-establishment",
  });

  /* Professional tax */
  if (PT_STATES.has(i.state)) {
    findings.push({
      id: "pt",
      title: "Professional tax",
      verdict: i.employees > 0 ? "required" : "check",
      why:
        i.employees > 0
          ? "Your state levies professional tax: you register as an employer and deduct it from salaries."
          : "Your state levies professional tax on businesses and professionals, often as a small annual amount.",
      slug: "professional-tax",
    });
  }

  /* PF / ESI */
  if (i.employees > 0) {
    findings.push({
      id: "pf",
      title: "EPF registration",
      verdict: i.employees >= 20 ? "required" : "not-required",
      why: i.employees >= 20 ? "Required once you employ 20 or more people." : `Required from 20 employees; you have ${i.employees}. Voluntary registration is allowed.`,
      slug: "pf-registration",
    });
    findings.push({
      id: "esi",
      title: "ESI registration",
      verdict: i.employees >= 10 ? "required" : "not-required",
      why: i.employees >= 10 ? "Required from 10 employees in most states, for staff earning up to ₹21,000 a month." : `Required from 10 employees in most states; you have ${i.employees}.`,
      slug: "esi-registration",
    });
  }

  return { findings, msme };
}

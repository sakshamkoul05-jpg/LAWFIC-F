"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Building2, Check, Factory, ShoppingCart, Wrench } from "lucide-react";
import {
  ACTIVITIES,
  ORG_TYPES,
  SLABS,
  SLABS_EFFECTIVE_FROM,
  TRADING_CAVEAT,
  classify,
  groupIndian,
  inWords,
  type ActivityId,
  type OrgTypeId,
} from "@/lib/msme";
import {
  Callout,
  ChoiceGrid,
  Field,
  StepHeading,
  StepNav,
  StepPanel,
  Stepper,
  digitsOnly,
  gstinError,
  mobileError,
  panError,
} from "./kit";

/**
 * Udyam registration, as an application.
 *
 * THE CALCULATOR IS THE POINT
 *
 * LAWFIC's own description of this service opens with "we work out whether you
 * are micro, small or medium on the current slabs — getting this wrong costs
 * you scheme eligibility". That sentence is the product, and it was previously
 * only a sentence. Step two does it live: two figures, and the band moves.
 *
 * It is also the honest way to sell the thing. Somebody who can see their own
 * classification before paying knows what they are buying. The alternative —
 * collect the money, classify in private, tell them afterwards — is how this
 * industry earned its reputation.
 *
 * WHY THE FORM ARGUES WITH YOU
 *
 * Two places where it says something the customer may not want to hear, before
 * they pay rather than after:
 *
 *   - TRADING. Traders can register, but only for priority-sector lending, not
 *     the schemes or the 45-day payment protection most people are actually
 *     after. Said the moment the tile is pressed.
 *   - ABOVE THE LIMITS. If the figures put them outside MSME entirely, the form
 *     says Udyam does not apply rather than taking the order.
 *
 * A form that never disagrees is a form that will take money for a filing that
 * cannot succeed.
 */

const STEPS = ["Business", "Size", "Details", "Review"];

type State = {
  org: OrgTypeId | "";
  activity: ActivityId | "";
  name: string;
  investment: string;
  turnover: string;
  pan: string;
  gstin: string;
  aadhaarLast4: string;
  mobile: string;
  city: string;
};

const EMPTY: State = {
  org: "",
  activity: "",
  name: "",
  investment: "",
  turnover: "",
  pan: "",
  gstin: "",
  aadhaarLast4: "",
  mobile: "",
  city: "",
};

export default function UdyamApply() {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const investment = Number(s.investment.replace(/\D/g, "")) || 0;
  const turnover = Number(s.turnover.replace(/\D/g, "")) || 0;
  const hasFigures = s.investment !== "" && s.turnover !== "";

  const result = useMemo(
    () => (hasFigures ? classify(investment, turnover) : null),
    [hasFigures, investment, turnover],
  );

  const orgChoice = ORG_TYPES.find((o) => o.id === s.org);

  const panMsg = touched.pan ? panError(s.pan) : null;
  const gstinMsg = touched.gstin ? gstinError(s.gstin) : null;
  const mobileMsg = touched.mobile ? mobileError(s.mobile) : null;

  const canLeave = [
    Boolean(s.org && s.activity && s.name.trim()),
    hasFigures && result?.result !== "beyond",
    Boolean(s.pan && !panError(s.pan) && s.aadhaarLast4.length === 4 && s.mobile && !mobileError(s.mobile)),
    true,
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background">
      {/* ── the rail ── */}
      <div className="border-b border-border bg-surface px-5 py-4 sm:px-7">
        <Stepper steps={STEPS} current={step} onJump={setStep} />
      </div>

      <div className="px-5 py-7 sm:px-7 sm:py-9">
        <AnimatePresence mode="wait">
          {/* ══ 1 — what the business is ══ */}
          {step === 0 && (
            <StepPanel id="org">
              <StepHeading
                kicker="Step 1 of 4"
                title="What are we registering?"
                blurb="Udyam runs against one person's Aadhaar, and which person depends on how the business is constituted. Getting this wrong is the most common reason a filing bounces."
              />

              <ChoiceGrid
                legend="Type of organisation"
                columns={2}
                value={s.org ? [s.org] : []}
                onChange={([v]) => set("org", (v ?? "") as OrgTypeId)}
                choices={ORG_TYPES.map((o) => ({
                  id: o.id,
                  label: o.label,
                  hint: `Filed against ${o.aadhaarOf}'s Aadhaar`,
                  icon: <Building2 size={18} aria-hidden />,
                }))}
              />

              <ChoiceGrid
                legend="Main activity"
                columns={3}
                value={s.activity ? [s.activity] : []}
                onChange={([v]) => set("activity", (v ?? "") as ActivityId)}
                choices={ACTIVITIES.map((a) => ({
                  id: a.id,
                  label: a.label,
                  hint: a.hint,
                  icon:
                    a.id === "manufacturing" ? (
                      <Factory size={18} aria-hidden />
                    ) : a.id === "service" ? (
                      <Wrench size={18} aria-hidden />
                    ) : (
                      <ShoppingCart size={18} aria-hidden />
                    ),
                }))}
              />

              {/* Said the moment it is chosen, not at the end. */}
              <AnimatePresence>
                {s.activity === "trading" && (
                  <Callout tone="warn" title="Traders get a narrower registration">
                    {TRADING_CAVEAT}
                  </Callout>
                )}
              </AnimatePresence>

              <Field
                id="biz-name"
                label="Name of the enterprise"
                hint="Exactly as it appears on the PAN — the portal matches them character for character."
                value={s.name}
                onChange={(v) => set("name", v)}
                placeholder="As printed on the PAN"
              />

              <StepNav
                back={false}
                onNext={() => setStep(1)}
                nextDisabled={!canLeave[0]}
                reassurance="Nothing is filed or paid for yet."
              />
            </StepPanel>
          )}

          {/* ══ 2 — the classifier ══ */}
          {step === 1 && (
            <StepPanel id="size">
              <StepHeading
                kicker="Step 2 of 4"
                title="Which band are you in?"
                blurb="Two figures decide it. Type them and watch — this is the same rule the portal applies, and it is the first thing we would do for you anyway."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="investment"
                  label="Investment in plant, machinery and equipment"
                  hint={s.investment ? `₹${inWords(investment)}` : "Written-down value, not the purchase price."}
                  value={s.investment ? groupIndian(investment) : ""}
                  onChange={(v) => set("investment", digitsOnly(v, 12))}
                  placeholder="0"
                  inputMode="numeric"
                  prefix="₹"
                />
                <Field
                  id="turnover"
                  label="Annual turnover"
                  hint={s.turnover ? `₹${inWords(turnover)}` : "Excluding exports — exports do not count against the limit."}
                  value={s.turnover ? groupIndian(turnover) : ""}
                  onChange={(v) => set("turnover", digitsOnly(v, 12))}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>

              <ClassBand investment={investment} turnover={turnover} show={hasFigures} />

              <AnimatePresence>
                {result && (
                  <motion.div
                    key={result.result}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  >
                    {result.result === "beyond" ? (
                      <Callout tone="warn" title={result.label}>
                        {result.note}
                      </Callout>
                    ) : (
                      <div className="rounded-2xl border border-primary bg-primary-lighter px-5 py-4">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
                          On these figures you are
                        </p>
                        <p className="mt-1 font-display text-[30px] font-semibold tracking-tight text-foreground">
                          {result.label}
                        </p>
                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                          {result.note} Classification takes the higher of the two tests, never the
                          lower.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[11px] leading-relaxed text-subtle">
                Slabs as notified with effect from {SLABS_EFFECTIVE_FROM}. This is an estimate on the
                figures you typed — we confirm it against your filed accounts before anything goes to
                the portal.
              </p>

              <StepNav
                onBack={() => setStep(0)}
                onNext={() => setStep(2)}
                nextDisabled={!canLeave[1]}
                reassurance="Still nothing filed or paid for."
              />
            </StepPanel>
          )}

          {/* ══ 3 — the identifiers ══ */}
          {step === 2 && (
            <StepPanel id="details">
              <StepHeading
                kicker="Step 3 of 4"
                title="The numbers the portal needs"
                blurb={
                  orgChoice
                    ? `Udyam will pull your ITR and GST figures automatically against these. The Aadhaar is ${orgChoice.aadhaarOf}'s.`
                    : "Udyam pulls your ITR and GST figures automatically against these."
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="pan"
                  label="PAN of the business"
                  value={s.pan}
                  onChange={(v) => set("pan", v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10))}
                  onBlur={() => blur("pan")}
                  error={panMsg}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  uppercase
                />
                <Field
                  id="aadhaar4"
                  label="Last 4 digits of Aadhaar"
                  value={s.aadhaarLast4}
                  onChange={(v) => set("aadhaarLast4", digitsOnly(v, 4))}
                  placeholder="0000"
                  maxLength={4}
                  inputMode="numeric"
                  prefix="XXXX XXXX"
                  locked="Four digits is all we ask for and all we keep. The full number goes straight into the portal when we file, from you, and is never stored here."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="mobile"
                  label="Mobile linked to that Aadhaar"
                  hint="The portal sends its OTP here. If this number is not linked, the filing cannot complete."
                  value={s.mobile}
                  onChange={(v) => set("mobile", digitsOnly(v, 10))}
                  onBlur={() => blur("mobile")}
                  error={mobileMsg}
                  placeholder="00000 00000"
                  maxLength={10}
                  inputMode="tel"
                  prefix="+91"
                />
                <Field
                  id="city"
                  label="City of the business address"
                  value={s.city}
                  onChange={(v) => set("city", v)}
                  placeholder="City"
                />
              </div>

              <Field
                id="gstin"
                label="GSTIN — only if you have one"
                hint="Optional. Leave it empty if the business is not registered; Udyam does not require GST."
                value={s.gstin}
                onChange={(v) => set("gstin", v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15))}
                onBlur={() => blur("gstin")}
                error={gstinMsg}
                placeholder="22ABCDE1234F1Z5"
                maxLength={15}
                uppercase
              />

              <StepNav
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
                nextDisabled={!canLeave[2]}
                nextLabel="Review"
              />
            </StepPanel>
          )}

          {/* ══ 4 — review ══ */}
          {step === 3 && (
            <StepPanel id="review">
              <StepHeading
                kicker="Step 4 of 4"
                title="Check it before it goes"
                blurb="Everything below is what we would file. Press back on any line that is wrong."
              />

              <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                <Row k="Enterprise" v={s.name || "—"} />
                <Row k="Constitution" v={orgChoice?.label ?? "—"} />
                <Row
                  k="Activity"
                  v={ACTIVITIES.find((a) => a.id === s.activity)?.label ?? "—"}
                />
                <Row
                  k="Classification"
                  v={result && result.result !== "beyond" ? result.label : "—"}
                  strong
                />
                <Row k="Investment" v={s.investment ? `₹${inWords(investment)}` : "—"} />
                <Row k="Turnover" v={s.turnover ? `₹${inWords(turnover)}` : "—"} />
                <Row k="PAN" v={s.pan || "—"} mono />
                <Row k="Aadhaar" v={s.aadhaarLast4 ? `XXXX XXXX ${s.aadhaarLast4}` : "—"} mono />
                <Row k="Mobile" v={s.mobile ? `+91 ${s.mobile}` : "—"} mono />
                <Row k="GSTIN" v={s.gstin || "Not registered"} mono />
              </dl>

              <Callout title="What happens when you send this">
                Nothing is filed. It reaches the team that handles Udyam, who check the
                classification against your accounts and come back with anything missing. You pay
                once they confirm the filing will go through — never before.
              </Callout>

              <StepNav
                onBack={() => setStep(2)}
                nextLabel="Send to the Udyam team"
                reassurance="₹499 professional fee, payable after we confirm. No government fee — Udyam registration is free."
              />
            </StepPanel>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ k, v, mono, strong }: { k: string; v: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-4 bg-surface px-5 py-3">
      <dt className="w-[140px] shrink-0 text-[12px] text-muted-foreground">{k}</dt>
      <dd
        className={`min-w-0 flex-1 break-words text-[13.5px] ${mono ? "font-mono" : ""} ${
          strong ? "font-semibold text-primary" : "text-foreground"
        }`}
      >
        {v}
      </dd>
    </div>
  );
}

/**
 * The ladder, with a marker on it.
 *
 * A word alone ("Small") does not tell anybody how close they are to the next
 * band, and that is the thing a growing business actually wants to know: how
 * much headroom is left before the classification changes and the schemes
 * change with it. So both tests are drawn, both markers shown, and the one
 * that decided the answer is the one that is lit.
 */
function ClassBand({
  investment,
  turnover,
  show,
}: {
  investment: number;
  turnover: number;
  show: boolean;
}) {
  if (!show) return null;

  const ceiling = SLABS[SLABS.length - 1]!;

  /* Log scale. On a linear axis the micro band is 2% of the width and every
     small business sits invisibly against the left edge. */
  const pos = (v: number, max: number) => {
    if (v <= 0) return 0;
    return Math.min(1, Math.log10(v + 1) / Math.log10(max + 1));
  };

  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-5">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Where you sit
        </p>
        <p className="text-[11px] text-subtle">log scale</p>
      </div>

      {[
        { label: "Investment", value: investment, max: ceiling.investmentMax, key: "investmentMax" as const },
        { label: "Turnover", value: turnover, max: ceiling.turnoverMax, key: "turnoverMax" as const },
      ].map((axis) => (
        <div key={axis.label} className="mb-5 last:mb-0">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12px] text-foreground">{axis.label}</span>
            <span className="font-mono text-[12px] text-muted-foreground">
              ₹{inWords(axis.value)}
            </span>
          </div>

          <div className="relative h-8">
            {/* the bands */}
            <div className="absolute inset-x-0 top-2.5 flex h-3 overflow-hidden rounded-full bg-surface-3">
              {SLABS.map((slab, i) => {
                const from = i === 0 ? 0 : pos(SLABS[i - 1]![axis.key], axis.max);
                const to = pos(slab[axis.key], axis.max);
                return (
                  <div
                    key={slab.id}
                    className="h-full border-r border-background/70 last:border-r-0"
                    style={{
                      width: `${(to - from) * 100}%`,
                      background: `color-mix(in oklab, var(--brand) ${22 + i * 26}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>

            {/* the marker */}
            <motion.div
              className="absolute top-0"
              initial={false}
              animate={{ left: `${pos(axis.value, axis.max) * 100}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 26 }}
            >
              <div className="-translate-x-1/2">
                <div className="mx-auto h-8 w-[2px] rounded-full bg-foreground" />
              </div>
            </motion.div>
          </div>

          <div className="mt-1 flex justify-between text-[10px] text-subtle">
            {SLABS.map((slab) => (
              <span key={slab.id}>
                {slab.label} to ₹{inWords(slab[axis.key])}
              </span>
            ))}
          </div>
        </div>
      ))}

      <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-subtle">
        <Check size={11} className="mt-0.5 shrink-0" aria-hidden />
        Whichever marker sits further right decides the class.
      </p>
    </div>
  );
}

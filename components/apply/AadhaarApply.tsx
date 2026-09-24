"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  Fingerprint,
  Home,
  Mail,
  Smartphone,
  UserRound,
  Users,
} from "lucide-react";
import {
  CENTRE_FEE_NOTE,
  MASKED_ONLY_NOTE,
  UPDATE_FIELDS,
  type UpdateField,
  type UpdateFieldId,
} from "@/lib/aadhaar-updates";
import {
  Callout,
  ChoiceGrid,
  Field,
  StepHeading,
  StepNav,
  StepPanel,
  Stepper,
  digitsOnly,
  mobileError,
} from "./kit";

/**
 * Aadhaar corrections, as an application.
 *
 * THE HARD PART OF THIS FORM IS WHAT IT REFUSES TO PRETEND
 *
 * LAWFIC cannot update anybody's Aadhaar, and neither can anyone else outside
 * an authorised enrolment centre — an update needs biometrics, in person. So
 * this form must not look like it submits one. Everything about it is shaped
 * to make that obvious while still being worth filling in: it collects what a
 * centre will bounce you for, tells you which proof yours will accept, and
 * books the slot.
 *
 * THE LIFETIME COUNTER IS THE FEATURE
 *
 * Name can be changed twice in a lifetime, date of birth once, gender once.
 * Somebody who has used theirs cannot have another, and the ordinary way to
 * discover that is at the counter, having taken a day off work. So the form
 * asks first, and when the answer is no it says so and stops — rather than
 * taking the fee for an appointment that cannot succeed.
 *
 * FOUR DIGITS, NOT TWELVE
 *
 * A full Aadhaar number is the single most valuable thing anybody could type
 * into this site, and there is no use for it: the centre reads the real number
 * off the card. Four digits matches a file to a person. The safest way to hold
 * an Aadhaar number is not to have one, and the form is built so we never do.
 */

const STEPS = ["What", "Check", "You", "Review"];

const ICONS: Record<UpdateFieldId, React.ReactNode> = {
  name: <UserRound size={18} aria-hidden />,
  dob: <CalendarDays size={18} aria-hidden />,
  gender: <Users size={18} aria-hidden />,
  address: <Home size={18} aria-hidden />,
  mobile: <Smartphone size={18} aria-hidden />,
  email: <Mail size={18} aria-hidden />,
};

type State = {
  fields: UpdateFieldId[];
  /** How many times each capped field has already been used. */
  used: Partial<Record<UpdateFieldId, number>>;
  aadhaarLast4: string;
  mobile: string;
  city: string;
  current: string;
  corrected: string;
};

export default function AadhaarApply() {
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>({
    fields: [],
    used: {},
    aadhaarLast4: "",
    mobile: "",
    city: "",
    current: "",
    corrected: "",
  });
  const [touched, setTouched] = useState(false);

  const chosen = useMemo(
    () => UPDATE_FIELDS.filter((f) => s.fields.includes(f.id)),
    [s.fields],
  );

  /** Capped fields the customer has already exhausted. */
  const blocked = useMemo(
    () =>
      chosen.filter(
        (f) => f.lifetimeLimit !== null && (s.used[f.id] ?? 0) >= f.lifetimeLimit,
      ),
    [chosen, s.used],
  );

  const capped = chosen.filter((f) => f.lifetimeLimit !== null);
  const mobileMsg = touched ? mobileError(s.mobile) : null;

  const canLeave = [
    s.fields.length > 0,
    /* Every capped field must have an answer, and none may be exhausted. */
    capped.every((f) => s.used[f.id] !== undefined) && blocked.length === 0,
    s.aadhaarLast4.length === 4 && Boolean(s.mobile) && !mobileError(s.mobile),
    true,
  ];

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background">
      <div className="border-b border-border bg-surface px-5 py-4 sm:px-7">
        <Stepper steps={STEPS} current={step} onJump={setStep} />
      </div>

      {/* Said once, at the top, permanently. Not a footnote. */}
      <div className="flex items-start gap-3 border-b border-border bg-surface-2 px-5 py-3.5 sm:px-7">
        <Fingerprint size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">This does not update your Aadhaar.</span>{" "}
          Nobody outside an authorised enrolment centre can — it takes your biometrics, in person.
          What we do is make sure the file you walk in with is correct, and book the slot.
        </p>
      </div>

      <div className="px-5 py-7 sm:px-7 sm:py-9">
        <AnimatePresence mode="wait">
          {/* ══ 1 — what is wrong ══ */}
          {step === 0 && (
            <StepPanel id="what">
              <StepHeading
                kicker="Step 1 of 4"
                title="What needs correcting?"
                blurb="Pick everything that is wrong. Several corrections can be done in one visit, which is one trip instead of three."
              />

              <ChoiceGrid
                legend="What to correct"
                multiple
                columns={2}
                value={s.fields}
                onChange={(next) => set("fields", next as UpdateFieldId[])}
                choices={UPDATE_FIELDS.map((f) => ({
                  id: f.id,
                  label: f.label,
                  hint: f.note,
                  icon: ICONS[f.id],
                  chip:
                    f.lifetimeLimit === null
                      ? "no limit"
                      : f.lifetimeLimit === 1
                        ? "once only"
                        : `${f.lifetimeLimit} in a lifetime`,
                }))}
              />

              <AnimatePresence>
                {s.fields.length > 1 && (
                  <Callout title="All of these in one appointment">
                    A single visit can carry several corrections. We will put them on one form so you
                    are not booked in twice.
                  </Callout>
                )}
              </AnimatePresence>

              <StepNav
                back={false}
                onNext={() => setStep(1)}
                nextDisabled={!canLeave[0]}
                reassurance="Nothing booked or paid for yet."
              />
            </StepPanel>
          )}

          {/* ══ 2 — the lifetime counter ══ */}
          {step === 1 && (
            <StepPanel id="check">
              <StepHeading
                kicker="Step 2 of 4"
                title="Have you changed these before?"
                blurb="UIDAI caps some of these for life. We ask now because the alternative is finding out at the counter, after you have taken the day off."
              />

              {capped.length === 0 ? (
                <Callout title="Nothing you picked has a lifetime cap">
                  {chosen.map((f) => f.label).join(", ")} can be updated as often as needed. Straight
                  on to your details.
                </Callout>
              ) : (
                <div className="flex flex-col gap-5">
                  {capped.map((f) => (
                    <UsedCounter
                      key={f.id}
                      field={f}
                      used={s.used[f.id]}
                      onChange={(n) => set("used", { ...s.used, [f.id]: n })}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence>
                {blocked.length > 0 && (
                  <Callout tone="warn" title="This one cannot be changed again">
                    {blocked.map((f) => f.label).join(" and ")}{" "}
                    {blocked.length === 1 ? "has" : "have"} reached the lifetime limit UIDAI allows,
                    so an enrolment centre will refuse the request. We are not going to book you an
                    appointment that cannot succeed. If you believe the record is wrong, there is a
                    grievance route — ask us and we will explain it, at no charge.
                  </Callout>
                )}
              </AnimatePresence>

              <StepNav
                onBack={() => setStep(0)}
                onNext={() => setStep(2)}
                nextDisabled={!canLeave[1]}
              />
            </StepPanel>
          )}

          {/* ══ 3 — who you are ══ */}
          {step === 2 && (
            <StepPanel id="you">
              <StepHeading
                kicker="Step 3 of 4"
                title="Enough to find you, and no more"
                blurb="We need to match this file to you and reach you about the appointment. That is all, so that is all we ask for."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="aad4"
                  label="Last 4 digits of your Aadhaar"
                  value={s.aadhaarLast4}
                  onChange={(v) => set("aadhaarLast4", digitsOnly(v, 4))}
                  placeholder="0000"
                  maxLength={4}
                  inputMode="numeric"
                  prefix="XXXX XXXX"
                  locked={MASKED_ONLY_NOTE}
                />
                <Field
                  id="mob"
                  label="Mobile we can reach you on"
                  value={s.mobile}
                  onChange={(v) => set("mobile", digitsOnly(v, 10))}
                  onBlur={() => setTouched(true)}
                  error={mobileMsg}
                  placeholder="00000 00000"
                  maxLength={10}
                  inputMode="tel"
                  prefix="+91"
                />
              </div>

              {(s.fields.includes("name") || s.fields.includes("dob")) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="current"
                    label="What the record says now"
                    hint="Exactly as it is printed, mistakes and all."
                    value={s.current}
                    onChange={(v) => set("current", v)}
                    placeholder="As printed on the Aadhaar"
                  />
                  <Field
                    id="corrected"
                    label="What it should say"
                    value={s.corrected}
                    onChange={(v) => set("corrected", v)}
                    placeholder="The correct version"
                  />
                </div>
              )}

              <Field
                id="city"
                label="Which city should we book the centre in?"
                value={s.city}
                onChange={(v) => set("city", v)}
                placeholder="City"
              />

              <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!canLeave[2]} nextLabel="Review" />
            </StepPanel>
          )}

          {/* ══ 4 — the proof list ══ */}
          {step === 3 && (
            <StepPanel id="review">
              <StepHeading
                kicker="Step 4 of 4"
                title="What to take with you"
                blurb="This is the list your appointment will actually be judged against. We confirm it for your specific case before you go."
              />

              {chosen.map((f) => (
                <div key={f.id} className="rounded-2xl border border-border bg-surface px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-primary">{ICONS[f.id]}</span>
                    <h4 className="text-[14px] font-medium text-foreground">{f.label}</h4>
                    {f.centreOnly && (
                      <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                        biometrics at the centre
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {f.proofs.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <Callout title="The fee, in full">
                {CENTRE_FEE_NOTE} LAWFIC&rsquo;s own fee is ₹199 for preparing the file and booking
                the slot, payable once we have confirmed your proof will be accepted.
              </Callout>

              <StepNav
                onBack={() => setStep(2)}
                nextLabel="Send this to the team"
                reassurance="No appointment is booked yet. We check your file first and come back with anything missing."
              />
            </StepPanel>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * How many times a capped field has already been used.
 *
 * Segmented rather than a number input, because the answer is always 0, 1 or 2
 * and a spinner for three possible values is a worse control than three
 * buttons. Each option says what it leaves you: "1 left", "none left" — which
 * is the thing the customer is actually trying to work out.
 */
function UsedCounter({
  field,
  used,
  onChange,
}: {
  field: UpdateField;
  used: number | undefined;
  onChange: (n: number) => void;
}) {
  const limit = field.lifetimeLimit ?? 0;
  const options = Array.from({ length: limit + 1 }, (_, i) => i);

  return (
    <fieldset>
      <legend className="flex items-baseline gap-2 text-[13px] font-medium text-foreground">
        {field.label}
        <span className="text-[11.5px] font-normal text-subtle">
          {limit === 1 ? "once in a lifetime" : `${limit} times in a lifetime`}
        </span>
      </legend>

      <div role="radiogroup" aria-label={`Times you have already changed your ${field.label}`} className="mt-2.5 flex flex-wrap gap-2">
        {options.map((n) => {
          const on = used === n;
          const left = limit - n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(n)}
              className={[
                "min-h-[46px] rounded-xl border px-4 text-left transition-all",
                on
                  ? "border-primary bg-primary-lighter shadow-[0_0_0_1px_var(--brand)]"
                  : "border-border bg-surface hover:border-border-3",
              ].join(" ")}
            >
              <span className="block text-[13px] font-medium text-foreground">
                {n === 0 ? "Never" : n === 1 ? "Once" : `${n} times`}
              </span>
              <span className={`block text-[11px] ${left === 0 ? "text-destructive" : "text-subtle"}`}>
                {left === 0 ? "none left" : left === 1 ? "1 left" : `${left} left`}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {used !== undefined && limit - used === 1 && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground"
          >
            This is your last one. Worth getting the spelling exactly right before you go — we will
            check it against your proof.
          </motion.p>
        )}
      </AnimatePresence>
    </fieldset>
  );
}

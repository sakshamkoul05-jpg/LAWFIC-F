"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgePlus,
  CalendarDays,
  Fingerprint,
  Home,
  Mail,
  PencilLine,
  Smartphone,
  UserRound,
  Users,
} from "lucide-react";
import {
  CENTRE_FEE_NOTE,
  ENROLMENT_FEE_NOTE,
  ENROL_PATHS,
  HEAD_OF_FAMILY_NOTE,
  MASKED_ONLY_NOTE,
  POA_DOCS,
  POI_DOCS,
  UPDATE_FIELDS,
  type EnrolFor,
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
 * Aadhaar, as an application — for one you do not have yet, or one that is wrong.
 *
 * TWO PROCESSES, NOT ONE WITH A FLAG
 *
 * The form used to assume everybody already had an Aadhaar, which quietly shut
 * out the people with the larger problem. Almost nothing carries between them:
 *
 *   - a first enrolment is FREE; an update is ₹50 at the counter;
 *   - enrolment has no lifetime allowance to check, because nothing has been
 *     used yet;
 *   - it cannot ask for the last four digits of a number nobody has;
 *   - it turns on a proof of identity and a proof of address, where an update
 *     turns on proof of the one detail being changed.
 *
 * So the first thing the form does is ask which, and the two flows share only
 * their shell and the sentence that matters in both: LAWFIC cannot do either
 * of these. They end at an enrolment centre, in person, with biometrics. What
 * we sell is a file that will not bounce and the appointment to take it to.
 *
 * THE TOGGLE STAYS VISIBLE
 *
 * Somebody who picks wrong finds out two steps later, and a form that makes
 * them start again to correct a first-screen mistake is a form they abandon.
 */

type Mode = "enrol" | "update";

const STEPS: Record<Mode, string[]> = {
  enrol: ["Who", "Proofs", "You", "Review"],
  update: ["What", "Check", "You", "Review"],
};

const ICONS: Record<UpdateFieldId, React.ReactNode> = {
  name: <UserRound size={18} aria-hidden />,
  dob: <CalendarDays size={18} aria-hidden />,
  gender: <Users size={18} aria-hidden />,
  address: <Home size={18} aria-hidden />,
  mobile: <Smartphone size={18} aria-hidden />,
  email: <Mail size={18} aria-hidden />,
};

type State = {
  /* update */
  fields: UpdateFieldId[];
  used: Partial<Record<UpdateFieldId, number>>;
  aadhaarLast4: string;
  current: string;
  corrected: string;
  /* enrol */
  who: EnrolFor | "";
  poi: string[];
  poa: string[];
  noAddressProof: boolean;
  fullName: string;
  /* both */
  mobile: string;
  city: string;
};

const EMPTY: State = {
  fields: [],
  used: {},
  aadhaarLast4: "",
  current: "",
  corrected: "",
  who: "",
  poi: [],
  poa: [],
  noAddressProof: false,
  fullName: "",
  mobile: "",
  city: "",
};

export default function AadhaarApply() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>(EMPTY);
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  /* Switching mode resets the answers. The two flows ask different questions,
     and carrying a half-filled update into an enrolment leaves fields set that
     the new flow never shows and cannot clear. */
  const choose = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setStep(0);
    setS(EMPTY);
    setTouched(false);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background">
      {/* ── the toggle, always visible ── */}
      <div className="border-b border-border bg-surface px-5 py-4 sm:px-7">
        <ModeToggle mode={mode} onChange={choose} />
        {mode && (
          <div className="mt-4">
            <Stepper steps={STEPS[mode]} current={step} onJump={setStep} />
          </div>
        )}
      </div>

      {/* Said once, at the top, permanently — and it is true of both flows. */}
      <div className="flex items-start gap-3 border-b border-border bg-surface-2 px-5 py-3.5 sm:px-7">
        <Fingerprint size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            This does not issue or change an Aadhaar.
          </span>{" "}
          Nobody outside an authorised enrolment centre can — it takes biometrics, in person. What we
          do is make sure the file you walk in with is correct, and book the slot.
        </p>
      </div>

      <div className="px-5 py-7 sm:px-7 sm:py-9">
        <AnimatePresence mode="wait">
          {mode === null && <Chooser key="choose" onChoose={choose} />}

          {mode === "enrol" && (
            <EnrolFlow
              key={`enrol-${step}`}
              step={step}
              setStep={setStep}
              s={s}
              set={set}
              touched={touched}
              setTouched={setTouched}
            />
          )}

          {mode === "update" && (
            <UpdateFlow
              key={`update-${step}`}
              step={step}
              setStep={setStep}
              s={s}
              set={set}
              touched={touched}
              setTouched={setTouched}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   THE TOGGLE
   ══════════════════════════════════════════════════════════════════════════ */

function ModeToggle({ mode, onChange }: { mode: Mode | null; onChange: (m: Mode) => void }) {
  const options: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "enrol", label: "Apply for a new Aadhaar", icon: <BadgePlus size={15} aria-hidden /> },
    { id: "update", label: "Correct an existing one", icon: <PencilLine size={15} aria-hidden /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="What do you need?"
      className="relative flex gap-1 rounded-2xl border border-border bg-background p-1"
    >
      {options.map((o) => {
        const on = mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.id)}
            className="relative flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-medium transition-colors"
          >
            {on && (
              /* One element sliding between the two, rather than two crossfading
                 backgrounds — the movement is what tells you they are
                 alternatives rather than a pair of buttons. */
              <motion.span
                layoutId="aadhaar-mode"
                className="absolute inset-0 rounded-xl bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className={`relative z-1 flex items-center gap-2 ${
                on ? "text-background" : "text-muted-foreground"
              }`}
            >
              {o.icon}
              <span className="truncate">{o.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Chooser({ onChoose }: { onChoose: (m: Mode) => void }) {
  return (
    <StepPanel id="chooser">
      <StepHeading
        kicker="First"
        title="Which one is it?"
        blurb="The two are different processes — different documents, different fees, and only one of them has a lifetime limit to worry about."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChoose("enrol")}
          className="flex flex-col gap-2 rounded-2xl border border-border bg-surface px-5 py-5 text-left transition-colors hover:border-primary hover:bg-primary-lighter"
        >
          <BadgePlus size={20} className="text-primary" aria-hidden />
          <span className="text-[15px] font-medium text-foreground">
            I do not have an Aadhaar yet
          </span>
          <span className="text-[12.5px] leading-relaxed text-muted-foreground">
            A first enrolment. One proof of identity, one of address, and biometrics at the centre.
          </span>
          <span className="mt-1 w-fit rounded-full bg-primary-lighter px-2.5 py-1 text-[11px] font-medium text-primary">
            Free — UIDAI charges nothing
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose("update")}
          className="flex flex-col gap-2 rounded-2xl border border-border bg-surface px-5 py-5 text-left transition-colors hover:border-primary hover:bg-primary-lighter"
        >
          <PencilLine size={20} className="text-primary" aria-hidden />
          <span className="text-[15px] font-medium text-foreground">
            Something on mine is wrong
          </span>
          <span className="text-[12.5px] leading-relaxed text-muted-foreground">
            A correction to a name, date of birth, address or mobile. Some of these can only be done
            a fixed number of times.
          </span>
          <span className="mt-1 w-fit rounded-full bg-surface-3 px-2.5 py-1 text-[11px] text-muted-foreground">
            ₹50 at the centre
          </span>
        </button>
      </div>
    </StepPanel>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NEW ENROLMENT
   ══════════════════════════════════════════════════════════════════════════ */

type FlowProps = {
  step: number;
  setStep: (n: number) => void;
  s: State;
  set: <K extends keyof State>(k: K, v: State[K]) => void;
  touched: boolean;
  setTouched: (b: boolean) => void;
};

function EnrolFlow({ step, setStep, s, set, touched, setTouched }: FlowProps) {
  const path = ENROL_PATHS.find((p) => p.id === s.who);
  const mobileMsg = touched ? mobileError(s.mobile) : null;

  const proofsDone = s.poi.length > 0 && (s.poa.length > 0 || s.noAddressProof);

  if (step === 0) {
    return (
      <StepPanel id="enrol-who">
        <StepHeading
          kicker="Step 1 of 4"
          title="Who is the Aadhaar for?"
          blurb="Children are enrolled differently from adults, and what happens at the centre is not the same."
        />

        <ChoiceGrid
          legend="Who is enrolling"
          columns={2}
          value={s.who ? [s.who] : []}
          onChange={([v]) => set("who", (v ?? "") as EnrolFor)}
          choices={ENROL_PATHS.map((p) => ({
            id: p.id,
            label: p.label,
            hint: p.blurb,
            icon: p.id === "adult" || p.id === "nri" ? <UserRound size={18} /> : <Users size={18} />,
          }))}
        />

        <AnimatePresence>
          {path && (
            <Callout title="What happens at the centre">
              {path.biometrics}
              {path.extras.length > 0 && (
                <>
                  {" "}
                  You will also need to bring: {path.extras.join("; ")}.
                </>
              )}
            </Callout>
          )}
        </AnimatePresence>

        <StepNav
          back={false}
          onNext={() => setStep(1)}
          nextDisabled={!s.who}
          reassurance="Nothing booked or paid for yet."
        />
      </StepPanel>
    );
  }

  if (step === 1) {
    return (
      <StepPanel id="enrol-proofs">
        <StepHeading
          kicker="Step 2 of 4"
          title="What can you show?"
          blurb="One proof of identity and one of address. A passport does both at once, which is why it is the easiest route if you have one."
        />

        <ChoiceGrid
          legend="Proof of identity — pick what you have"
          multiple
          columns={2}
          value={s.poi}
          onChange={(v) => set("poi", v)}
          choices={POI_DOCS.map((d) => ({ id: d, label: d }))}
        />

        <ChoiceGrid
          legend="Proof of address — pick what you have"
          multiple
          columns={2}
          value={s.poa}
          onChange={(v) => {
            set("poa", v);
            if (v.length) set("noAddressProof", false);
          }}
          choices={POA_DOCS.map((d) => ({ id: d, label: d }))}
        />

        <button
          type="button"
          onClick={() => {
            set("noAddressProof", !s.noAddressProof);
            if (!s.noAddressProof) set("poa", []);
          }}
          aria-pressed={s.noAddressProof}
          className={`w-full rounded-2xl border px-4 py-3.5 text-left text-[13px] transition-colors ${
            s.noAddressProof
              ? "border-primary bg-primary-lighter text-foreground"
              : "border-border bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          I have none of these in my own name
        </button>

        <AnimatePresence>
          {s.noAddressProof && <Callout title="There is a route for that">{HEAD_OF_FAMILY_NOTE}</Callout>}
          {s.poi.includes("Passport") && (
            <Callout title="Your passport is enough on its own">
              A passport is accepted as both identity and address, so it is the only document you
              need to bring for those two.
            </Callout>
          )}
        </AnimatePresence>

        <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!proofsDone} />
      </StepPanel>
    );
  }

  if (step === 2) {
    return (
      <StepPanel id="enrol-you">
        <StepHeading
          kicker="Step 3 of 4"
          title="Enough to book the slot"
          blurb="The name has to match the proof of identity exactly — that is what the operator types in."
        />

        <Field
          id="enrol-name"
          label={path?.id.startsWith("child") ? "The child's full name" : "Full name"}
          hint="Spelled exactly as it appears on the identity document you are bringing."
          value={s.fullName}
          onChange={(v) => set("fullName", v)}
          placeholder="As printed on the proof of identity"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="enrol-mobile"
            label="Mobile we can reach you on"
            hint="This also becomes the number linked to the Aadhaar, so use one you will keep."
            value={s.mobile}
            onChange={(v) => set("mobile", digitsOnly(v, 10))}
            onBlur={() => setTouched(true)}
            error={mobileMsg}
            placeholder="00000 00000"
            maxLength={10}
            inputMode="tel"
            prefix="+91"
          />
          <Field
            id="enrol-city"
            label="Which city should we book the centre in?"
            value={s.city}
            onChange={(v) => set("city", v)}
            placeholder="City"
          />
        </div>

        <StepNav
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          nextDisabled={!s.fullName.trim() || !s.mobile || Boolean(mobileError(s.mobile))}
          nextLabel="Review"
        />
      </StepPanel>
    );
  }

  return (
    <StepPanel id="enrol-review">
      <StepHeading
        kicker="Step 4 of 4"
        title="What to take with you"
        blurb="We confirm this against your specific case before you go, so the visit works the first time."
      />

      <div className="rounded-2xl border border-border bg-surface px-5 py-4">
        <h4 className="text-[14px] font-medium text-foreground">{path?.label}</h4>
        <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{path?.biometrics}</p>
      </div>

      <TakeList title="Proof of identity" items={s.poi} />
      {s.noAddressProof ? (
        <Callout title="Proof of address — the family route">{HEAD_OF_FAMILY_NOTE}</Callout>
      ) : (
        <TakeList title="Proof of address" items={s.poa} />
      )}
      {path && path.extras.length > 0 && <TakeList title="Also required" items={path.extras} />}

      <Callout title="The fee, in full">
        {ENROLMENT_FEE_NOTE} LAWFIC&rsquo;s own fee is ₹199 for preparing the file and booking the
        slot, payable once we have confirmed your documents will be accepted.
      </Callout>

      <StepNav
        onBack={() => setStep(2)}
        nextLabel="Send this to the team"
        reassurance="No appointment is booked yet. We check the file first and come back with anything missing."
      />
    </StepPanel>
  );
}

function TakeList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <h4 className="text-[14px] font-medium text-foreground">{title}</h4>
      <ul className="mt-3 flex flex-col gap-1.5">
        {items.map((d) => (
          <li key={d} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CORRECTING AN EXISTING ONE
   ══════════════════════════════════════════════════════════════════════════ */

function UpdateFlow({ step, setStep, s, set, touched, setTouched }: FlowProps) {
  const chosen = useMemo(() => UPDATE_FIELDS.filter((f) => s.fields.includes(f.id)), [s.fields]);

  const blocked = useMemo(
    () => chosen.filter((f) => f.lifetimeLimit !== null && (s.used[f.id] ?? 0) >= f.lifetimeLimit),
    [chosen, s.used],
  );

  const capped = chosen.filter((f) => f.lifetimeLimit !== null);
  const mobileMsg = touched ? mobileError(s.mobile) : null;

  if (step === 0) {
    return (
      <StepPanel id="upd-what">
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
              A single visit can carry several corrections. We will put them on one form so you are
              not booked in twice.
            </Callout>
          )}
        </AnimatePresence>

        <StepNav
          back={false}
          onNext={() => setStep(1)}
          nextDisabled={s.fields.length === 0}
          reassurance="Nothing booked or paid for yet."
        />
      </StepPanel>
    );
  }

  if (step === 1) {
    return (
      <StepPanel id="upd-check">
        <StepHeading
          kicker="Step 2 of 4"
          title="Have you changed these before?"
          blurb="UIDAI caps some of these for life. We ask now because the alternative is finding out at the counter, after you have taken the day off."
        />

        {capped.length === 0 ? (
          <Callout title="Nothing you picked has a lifetime cap">
            {chosen.map((f) => f.label).join(", ")} can be updated as often as needed.
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
              {blocked.length === 1 ? "has" : "have"} reached the lifetime limit UIDAI allows, so an
              enrolment centre will refuse the request. We are not going to book you an appointment
              that cannot succeed. If you believe the record is wrong, there is a grievance route —
              ask us and we will explain it, at no charge.
            </Callout>
          )}
        </AnimatePresence>

        <StepNav
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
          nextDisabled={
            !capped.every((f) => s.used[f.id] !== undefined) || blocked.length > 0
          }
        />
      </StepPanel>
    );
  }

  if (step === 2) {
    return (
      <StepPanel id="upd-you">
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

        <StepNav
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          nextDisabled={s.aadhaarLast4.length !== 4 || !s.mobile || Boolean(mobileError(s.mobile))}
          nextLabel="Review"
        />
      </StepPanel>
    );
  }

  return (
    <StepPanel id="upd-review">
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
        {CENTRE_FEE_NOTE} LAWFIC&rsquo;s own fee is ₹199 for preparing the file and booking the slot,
        payable once we have confirmed your proof will be accepted.
      </Callout>

      <StepNav
        onBack={() => setStep(2)}
        nextLabel="Send this to the team"
        reassurance="No appointment is booked yet. We check your file first and come back with anything missing."
      />
    </StepPanel>
  );
}

/**
 * How many times a capped field has already been used.
 *
 * Segmented rather than a number input, because the answer is always 0, 1 or 2
 * and a spinner for three possible values is a worse control than three
 * buttons. Each option says what it LEAVES you — "1 left", "none left" — which
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

  return (
    <fieldset>
      <legend className="flex items-baseline gap-2 text-[13px] font-medium text-foreground">
        {field.label}
        <span className="text-[11.5px] font-normal text-subtle">
          {limit === 1 ? "once in a lifetime" : `${limit} times in a lifetime`}
        </span>
      </legend>

      <div
        role="radiogroup"
        aria-label={`Times you have already changed your ${field.label}`}
        className="mt-2.5 flex flex-wrap gap-2"
      >
        {Array.from({ length: limit + 1 }, (_, n) => {
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

"use client";

import { useAccountPreferences } from "@/components/account/usePreferences";

/**
 * "Set Dash Board Preference" and "Account Privacy", from the blueprint.
 *
 * Switches rather than a form with a Save button. There is nothing to validate
 * and nothing that can fail, so a save step would only add a way to change a
 * setting and not have it apply — and on a screen whose whole subject is what
 * the site is allowed to do with your details, a change that silently did not
 * take is the worst outcome available.
 *
 * Every row says what turning it OFF means, not what turning it on means. A
 * privacy control that only describes its benefits is an advertisement.
 */

const SECTIONS: { key: "promotions" | "why" | "trending" | "categories"; label: string; off: string }[] = [
  {
    key: "promotions",
    label: "Promotional banners",
    off: "The six offers at the top of the home page are hidden.",
  },
  {
    key: "why",
    label: "Why choose LAWFIC",
    off: "The four reasons are hidden.",
  },
  {
    key: "trending",
    label: "Trending in LAWFIC",
    off: "The top ten is hidden.",
  },
  {
    key: "categories",
    label: "Service explore by category",
    off: "The nine category lists are hidden. Every service is still in the search and under Document.",
  },
];

export default function PreferencesForm() {
  const { prefs, update, loaded } = useAccountPreferences();

  /* Nothing until storage has been read, so a switch never renders in the
     wrong position and then flips itself a frame later. */
  if (!loaded) return <div className="mt-10 h-[420px]" aria-hidden />;

  const allOff = !Object.values(prefs.sections).some(Boolean);

  return (
    <div className="mt-10 space-y-10">
      <section aria-labelledby="sections-heading">
        <h2 id="sections-heading" className="type-label mb-4 text-subtle">
          Dashboard preference
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          {SECTIONS.map((s, i) => (
            <Row
              key={s.key}
              first={i === 0}
              label={s.label}
              note={prefs.sections[s.key] ? undefined : s.off}
              checked={prefs.sections[s.key]}
              onChange={(v) => update({ sections: { ...prefs.sections, [s.key]: v } })}
            />
          ))}
        </div>
        {allOff && (
          <p className="mt-3 text-[12px] text-muted-foreground">
            Every section is off, so the home page is the header, the hero and the
            footer. Nothing is lost — the services are still in the search.
          </p>
        )}
      </section>

      <section aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="type-label mb-4 text-subtle">
          Account privacy
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          <Row
            first
            label="Use my profile to arrange the site"
            note={
              prefs.privacy.personalise
                ? "Your track, city and qualification order the home page and the jobs feed."
                : "The home page and the jobs feed show the same thing to everyone."
            }
            checked={prefs.privacy.personalise}
            onChange={(v) => update({ privacy: { ...prefs.privacy, personalise: v } })}
          />
          <Row
            label="Show my name in the header"
            note={
              prefs.privacy.showName
                ? "Your greeting and name appear at the top of every page."
                : "The header shows no name — useful on a shared screen."
            }
            checked={prefs.privacy.showName}
            onChange={(v) => update({ privacy: { ...prefs.privacy, showName: v } })}
          />
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-subtle">
          These two are kept on this device, because both only change how this
          browser behaves. Nothing here is sent anywhere, and clearing your
          browser data resets them.
        </p>
      </section>
    </div>
  );
}

function Row({
  label,
  note,
  checked,
  onChange,
  first = false,
}: {
  label: string;
  note?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  first?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2 ${
        first ? "" : "border-t border-border"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-foreground">{label}</span>
        {note && (
          <span className="mt-1 block text-[12px] leading-relaxed text-muted-foreground">
            {note}
          </span>
        )}
      </span>

      {/* A real checkbox, visually hidden and driving the track beside it. A
          div with a click handler is not focusable, not announced as a switch
          and not toggled by the space bar. */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="mt-0.5 grid h-[22px] w-[38px] shrink-0 grid-cols-[1fr] items-center rounded-full border border-border bg-surface-2 px-[3px] transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50"
      >
        <span
          className={`size-[16px] rounded-full bg-foreground/60 transition-transform ${
            checked ? "translate-x-[16px] bg-background" : ""
          }`}
        />
      </span>
    </label>
  );
}

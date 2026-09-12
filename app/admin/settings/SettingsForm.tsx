"use client";

import { useState, useTransition } from "react";
import type { Settings } from "@/lib/settings";
import { saveSetting } from "./actions";

/**
 * The settings, each one saving on its own.
 *
 * ONE SAVE BUTTON PER SETTING, NOT ONE FOR THE PAGE
 *
 * A single "Save all" means an invalid phone number blocks a change to the
 * ticker, and it means the audit log records one entry covering four unrelated
 * edits. Per-setting saves keep each change atomic, individually reversible
 * and individually attributable, which is the whole point of logging them.
 *
 * NOTHING HERE IS OPTIMISTIC
 *
 * The field shows what is saved, not what was typed. A settings page that
 * renders the new value before the write confirms is a settings page that lies
 * for a few hundred milliseconds every time the write fails — and the failure
 * mode people actually hit is a permission error, which is exactly when you
 * need the screen to be honest.
 */

export default function SettingsForm({ settings }: { settings: Settings }) {
  return (
    <div className="mt-8 grid gap-10">
      <Group title="Support details" note="Shown in the footer of every page and on the contact page.">
        <TextSetting
          settingKey="contact.support_email"
          label="Support email"
          initial={settings["contact.support_email"]}
        />
        <TextSetting
          settingKey="contact.support_phone"
          label="Support phone"
          initial={settings["contact.support_phone"]}
          hint="Leave empty to hide the line entirely."
        />
        <TextSetting
          settingKey="contact.support_hours"
          label="Support hours"
          initial={settings["contact.support_hours"]}
        />
      </Group>

      <Group
        title="Site-wide notice"
        note="One line above the header, on every page — an outage, a holiday closure, a filing deadline. Empty shows nothing."
      >
        <TextSetting
          settingKey="site.banner_notice"
          label="Notice"
          initial={settings["site.banner_notice"]}
          hint="Keep it to one sentence. It sits above the running strip."
        />
      </Group>

      <Group
        title="Home page blocks"
        note="Which sections everyone sees. A reader can still hide any of them for themselves in their own account settings — this is the site-wide default, not an override of their choice."
      >
        <SectionsSetting initial={settings["home.sections"]} />
      </Group>

      <Group
        title="Running strip"
        note="The claims scrolling above the header. Each line keeps the icon that sits at its position, so editing the words of line four keeps line four's icon — but inserting a line in the middle shifts every icon after it."
      >
        <LinesSetting initial={settings["ticker.lines"]} />
      </Group>
    </div>
  );
}

function Group({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">{note}</p>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

/** Save state, shared by every control below. */
function useSave() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const run = (key: string, value: unknown) => {
    setError("");
    setSaved(false);
    start(async () => {
      const res = await saveSetting(key, value);
      if (res.ok) setSaved(true);
      else setError(res.error);
    });
  };

  return { pending, error, saved, run };
}

function Status({ pending, error, saved }: { pending: boolean; error: string; saved: boolean }) {
  if (error)
    return (
      <span role="alert" className="text-[12px] text-destructive">
        {error}
      </span>
    );
  if (pending) return <span className="text-[12px] text-muted">Saving…</span>;
  if (saved)
    return (
      <span role="status" className="text-[12px] text-success">
        Saved — live on the site
      </span>
    );
  return null;
}

function TextSetting({
  settingKey,
  label,
  initial,
  hint,
}: {
  settingKey: string;
  label: string;
  initial: string;
  hint?: string;
}) {
  const [value, setValue] = useState(initial);
  const { pending, error, saved, run } = useSave();
  const dirty = value !== initial;

  return (
    <div>
      <label className="block">
        <span className="type-label block text-muted">{label}</span>
        <span className="mt-2 flex flex-wrap items-center gap-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border-2 bg-background px-3 py-2 text-[13.5px] text-foreground outline-none focus:border-primary/50"
          />
          <button
            type="button"
            /* Disabled until something changed, so the button cannot write an
               audit entry saying a value went from X to X. */
            disabled={!dirty || pending}
            onClick={() => run(settingKey, value)}
            className="rounded-full bg-primary px-4 py-2 text-[12.5px] font-medium text-background transition-colors hover:bg-primary-hover disabled:bg-surface-3 disabled:text-subtle"
          >
            Save
          </button>
        </span>
      </label>
      {hint && <p className="mt-1.5 text-[11.5px] text-subtle">{hint}</p>}
      <p className="mt-1.5">
        <Status pending={pending} error={error} saved={saved && !dirty} />
      </p>
    </div>
  );
}

function SectionsSetting({ initial }: { initial: Settings["home.sections"] }) {
  const [value, setValue] = useState(initial);
  const { pending, error, saved, run } = useSave();

  const ROWS: { key: keyof typeof initial; label: string }[] = [
    { key: "promotions", label: "Promotional banners" },
    { key: "why", label: "Why choose LAWFIC" },
    { key: "trending", label: "Trending in LAWFIC" },
    { key: "categories", label: "Service explore by category" },
  ];

  return (
    <div className="grid gap-3">
      {ROWS.map((row) => (
        <label key={row.key} className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={value[row.key]}
            disabled={pending}
            onChange={(e) => {
              const next = { ...value, [row.key]: e.target.checked };
              setValue(next);
              run("home.sections", next);
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="grid h-[20px] w-[34px] shrink-0 items-center rounded-full border border-border bg-surface-2 px-[3px] transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50"
          >
            <span
              className={`size-[14px] rounded-full transition-transform ${
                value[row.key] ? "translate-x-[14px] bg-background" : "bg-foreground/50"
              }`}
            />
          </span>
          <span className="text-[13px] text-foreground">{row.label}</span>
        </label>
      ))}
      <p>
        <Status pending={pending} error={error} saved={saved} />
      </p>
    </div>
  );
}

function LinesSetting({ initial }: { initial: string[] }) {
  const [text, setText] = useState(initial.join("\n"));
  const { pending, error, saved, run } = useSave();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const dirty = lines.join("\n") !== initial.join("\n");

  return (
    <div>
      {/* One line per row, rather than eleven inputs with add and remove
          buttons. Reordering a textarea is selecting a line and moving it,
          which everybody already knows how to do. */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={11}
        spellCheck={false}
        className="w-full rounded-lg border border-border-2 bg-background px-3 py-2 font-mono text-[12.5px] leading-relaxed text-foreground outline-none focus:border-primary/50"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!dirty || pending || lines.length === 0}
          onClick={() => run("ticker.lines", lines)}
          className="rounded-full bg-primary px-4 py-2 text-[12.5px] font-medium text-background transition-colors hover:bg-primary-hover disabled:bg-surface-3 disabled:text-subtle"
        >
          Save strip
        </button>
        <span className="text-[12px] text-muted">
          {lines.length} line{lines.length === 1 ? "" : "s"}
          {lines.length > 11 && " — past eleven, the extra lines show without an icon"}
        </span>
        <Status pending={pending} error={error} saved={saved && !dirty} />
      </div>
    </div>
  );
}

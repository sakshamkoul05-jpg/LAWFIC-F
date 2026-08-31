"use client";

import {
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_STYLES,
  MOUTH_STYLES,
  CLOTHES_STYLES,
  ACCESSORIES,
  type AvatarPrefs,
} from "@/lib/wallet-avatar";
import AvatarRenderer from "./AvatarRenderer";

/**
 * Avatar customization picker. Shows a live preview and option grids for each
 * part (skin, hair, eyes, mouth, clothes, accessory). No images — pure CSS
 * avatar rendered via AvatarRenderer.
 */
export default function AvatarPicker({
  avatar,
  onChange,
}: {
  avatar: AvatarPrefs;
  onChange: (a: AvatarPrefs) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Live preview */}
      <div className="flex justify-center">
        <div className="relative">
          <AvatarRenderer avatar={avatar} size={96} />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 4px 20px rgba(212,175,55,0.25), 0 0 0 2px rgba(212,175,55,0.15)",
            }}
          />
        </div>
      </div>

      {/* Skin tone */}
      <PickerGroup label="Skin tone" activeId={avatar.skinTone}>
        {SKIN_TONES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange({ ...avatar, skinTone: s.id })}
            aria-pressed={avatar.skinTone === s.id}
            title={s.label}
            className={`h-9 w-9 rounded-full border-2 transition-all ${
              avatar.skinTone === s.id
                ? "border-[#d4af37] ring-1 ring-[#d4af37]/50 scale-110"
                : "border-white/15 hover:border-[#d4af37]/40"
            }`}
            style={{ background: s.color }}
          >
            <span className="sr-only">{s.label}</span>
          </button>
        ))}
      </PickerGroup>

      {/* Hair style */}
      <PickerGroup label="Hair style" activeId={avatar.hairStyle}>
        {HAIR_STYLES.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onChange({ ...avatar, hairStyle: h.id })}
            aria-pressed={avatar.hairStyle === h.id}
            className={`rounded-xl border px-3 py-2 text-[11px] font-medium transition-all ${
              avatar.hairStyle === h.id
                ? "border-[#d4af37] bg-[#d4af37]/15 text-[#f4e3a8]"
                : "border-white/10 bg-white/5 text-[#f4f4ee]/60 hover:border-[#d4af37]/40"
            }`}
          >
            {h.label}
          </button>
        ))}
      </PickerGroup>

      {/* Hair color */}
      <PickerGroup label="Hair color" activeId={avatar.hairColor}>
        {HAIR_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange({ ...avatar, hairColor: c.id })}
            aria-pressed={avatar.hairColor === c.id}
            title={c.label}
            className={`h-8 w-8 rounded-full border-2 transition-all ${
              avatar.hairColor === c.id
                ? "border-[#d4af37] ring-1 ring-[#d4af37]/50 scale-110"
                : "border-white/15 hover:border-[#d4af37]/40"
            }`}
            style={{ background: c.color }}
          >
            <span className="sr-only">{c.label}</span>
          </button>
        ))}
      </PickerGroup>

      {/* Eyes */}
      <PickerGroup label="Eyes" activeId={avatar.eyeStyle}>
        {EYE_STYLES.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onChange({ ...avatar, eyeStyle: e.id })}
            aria-pressed={avatar.eyeStyle === e.id}
            className={`rounded-xl border px-3 py-2 text-[11px] font-medium transition-all ${
              avatar.eyeStyle === e.id
                ? "border-[#d4af37] bg-[#d4af37]/15 text-[#f4e3a8]"
                : "border-white/10 bg-white/5 text-[#f4f4ee]/60 hover:border-[#d4af37]/40"
            }`}
          >
            {e.label}
          </button>
        ))}
      </PickerGroup>

      {/* Mouth */}
      <PickerGroup label="Mouth" activeId={avatar.mouthStyle}>
        {MOUTH_STYLES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange({ ...avatar, mouthStyle: m.id })}
            aria-pressed={avatar.mouthStyle === m.id}
            className={`rounded-xl border px-3 py-2 text-[11px] font-medium transition-all ${
              avatar.mouthStyle === m.id
                ? "border-[#d4af37] bg-[#d4af37]/15 text-[#f4e3a8]"
                : "border-white/10 bg-white/5 text-[#f4f4ee]/60 hover:border-[#d4af37]/40"
            }`}
          >
            {m.label}
          </button>
        ))}
      </PickerGroup>

      {/* Clothes */}
      <PickerGroup label="Clothes" activeId={avatar.clothes}>
        {CLOTHES_STYLES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange({ ...avatar, clothes: c.id })}
            aria-pressed={avatar.clothes === c.id}
            className={`rounded-xl border px-3 py-2 text-[11px] font-medium transition-all ${
              avatar.clothes === c.id
                ? "border-[#d4af37] bg-[#d4af37]/15 text-[#f4e3a8]"
                : "border-white/10 bg-white/5 text-[#f4f4ee]/60 hover:border-[#d4af37]/40"
            }`}
          >
            {c.label}
          </button>
        ))}
      </PickerGroup>

      {/* Accessory */}
      <PickerGroup label="Accessory" activeId={avatar.accessory}>
        {ACCESSORIES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange({ ...avatar, accessory: a.id })}
            aria-pressed={avatar.accessory === a.id}
            className={`rounded-xl border px-3 py-2 text-[11px] font-medium transition-all ${
              avatar.accessory === a.id
                ? "border-[#d4af37] bg-[#d4af37]/15 text-[#f4e3a8]"
                : "border-white/10 bg-white/5 text-[#f4f4ee]/60 hover:border-[#d4af37]/40"
            }`}
          >
            {a.label}
          </button>
        ))}
      </PickerGroup>
    </div>
  );
}

function PickerGroup({
  label,
  activeId,
  children,
}: {
  label: string;
  activeId: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4af37]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

"use client";

import { type AvatarPrefs, getSkinTone, getHairColor } from "@/lib/wallet-avatar";

/**
 * A CSS-rendered avatar face — no images, no external assets.
 * Renders inside a circle. Used on the collector card and in the avatar picker.
 *
 * Each part (hair, eyes, mouth, clothes, accessory) is a simple SVG/CSS shape
 * chosen by the avatar prefs. The result is a compact, stylised character that
 * represents the user on their card.
 */
export default function AvatarRenderer({
  avatar,
  size = 64,
  className = "",
}: {
  avatar: AvatarPrefs;
  size?: number;
  className?: string;
}) {
  const skin = getSkinTone(avatar.skinTone)?.color ?? "#C68E5B";
  const hair = getHairColor(avatar.hairColor)?.color ?? "#1a1a1a";

  const r = size / 2;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
      aria-label="Your avatar"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
        {/* ─── Clothes (bottom layer) ──────────────────────────────── */}
        {avatar.clothes !== "none" && <ClothesLayer clothes={avatar.clothes} skin={skin} />}

        {/* ─── Neck ────────────────────────────────────────────────── */}
        <rect x="40" y="62" width="20" height="12" rx="4" fill={skin} />

        {/* ─── Head ────────────────────────────────────────────────── */}
        <ellipse cx="50" cy="42" rx="24" ry="27" fill={skin} />

        {/* ─── Hair ────────────────────────────────────────────────── */}
        <HairLayer style={avatar.hairStyle} color={hair} />

        {/* ─── Eyes ────────────────────────────────────────────────── */}
        <EyesLayer style={avatar.eyeStyle} />

        {/* ─── Mouth ───────────────────────────────────────────────── */}
        <MouthLayer style={avatar.mouthStyle} skin={skin} />

        {/* ─── Accessory ───────────────────────────────────────────── */}
        <AccessoryLayer type={avatar.accessory} />
      </svg>
    </div>
  );
}

// ─── Hair ───────────────────────────────────────────────────────────────────

function HairLayer({ style, color }: { style: string; color: string }) {
  switch (style) {
    case "short":
      return (
        <g>
          <ellipse cx="50" cy="28" rx="25" ry="16" fill={color} />
          <rect x="26" y="28" width="48" height="6" rx="3" fill={color} />
        </g>
      );
    case "side":
      return (
        <g>
          <ellipse cx="50" cy="27" rx="25" ry="15" fill={color} />
          <rect x="26" y="27" width="20" height="10" rx="3" fill={color} />
        </g>
      );
    case "wavy":
      return (
        <g>
          <ellipse cx="50" cy="26" rx="26" ry="16" fill={color} />
          <path d="M24 32 Q28 38 24 44 Q28 42 32 44 Q36 42 40 44" stroke={color} strokeWidth="3" fill="none" />
          <path d="M60 44 Q64 42 68 44 Q72 42 76 44 Q72 38 76 32" stroke={color} strokeWidth="3" fill="none" />
        </g>
      );
    case "curly":
      return (
        <g>
          <circle cx="36" cy="24" r="7" fill={color} />
          <circle cx="50" cy="20" r="8" fill={color} />
          <circle cx="64" cy="24" r="7" fill={color} />
          <circle cx="30" cy="32" r="6" fill={color} />
          <circle cx="70" cy="32" r="6" fill={color} />
        </g>
      );
    case "long":
      return (
        <g>
          <ellipse cx="50" cy="26" rx="26" ry="16" fill={color} />
          <rect x="26" y="30" width="8" height="30" rx="4" fill={color} />
          <rect x="66" y="30" width="8" height="30" rx="4" fill={color} />
        </g>
      );
    case "buzz":
      return (
        <ellipse cx="50" cy="26" rx="24" ry="14" fill={color} opacity="0.7" />
      );
    default:
      return null;
  }
}

// ─── Eyes ───────────────────────────────────────────────────────────────────

function EyesLayer({ style }: { style: string }) {
  const white = "#fff";
  const pupil = "#1a1a1a";

  switch (style) {
    case "round":
      return (
        <g>
          <ellipse cx="40" cy="40" rx="5" ry="5.5" fill={white} />
          <circle cx="41" cy="40" r="3" fill={pupil} />
          <circle cx="42" cy="39" r="1" fill="#fff" />
          <ellipse cx="60" cy="40" rx="5" ry="5.5" fill={white} />
          <circle cx="61" cy="40" r="3" fill={pupil} />
          <circle cx="62" cy="39" r="1" fill="#fff" />
        </g>
      );
    case "almond":
      return (
        <g>
          <ellipse cx="40" cy="40" rx="6" ry="4" fill={white} />
          <circle cx="41" cy="40" r="3" fill={pupil} />
          <circle cx="42" cy="39" r="1" fill="#fff" />
          <ellipse cx="60" cy="40" rx="6" ry="4" fill={white} />
          <circle cx="61" cy="40" r="3" fill={pupil} />
          <circle cx="62" cy="39" r="1" fill="#fff" />
        </g>
      );
    case "narrow":
      return (
        <g>
          <ellipse cx="40" cy="40" rx="5.5" ry="3" fill={white} />
          <circle cx="41" cy="40" r="2.5" fill={pupil} />
          <ellipse cx="60" cy="40" rx="5.5" ry="3" fill={white} />
          <circle cx="61" cy="40" r="2.5" fill={pupil} />
        </g>
      );
    case "wide":
      return (
        <g>
          <ellipse cx="40" cy="40" rx="6" ry="6" fill={white} />
          <circle cx="41" cy="40" r="3.5" fill={pupil} />
          <circle cx="42.5" cy="38.5" r="1.2" fill="#fff" />
          <ellipse cx="60" cy="40" rx="6" ry="6" fill={white} />
          <circle cx="61" cy="40" r="3.5" fill={pupil} />
          <circle cx="62.5" cy="38.5" r="1.2" fill="#fff" />
        </g>
      );
    default:
      return null;
  }
}

// ─── Mouth ──────────────────────────────────────────────────────────────────

function MouthLayer({ style, skin }: { style: string; skin: string }) {
  const lipColor = "#c0706a";

  switch (style) {
    case "smile":
      return (
        <path
          d="M42 50 Q50 57 58 50"
          stroke={lipColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "neutral":
      return (
        <line
          x1="43" y1="52" x2="57" y2="52"
          stroke={lipColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
      );
    case "grin":
      return (
        <g>
          <path
            d="M41 49 Q50 58 59 49"
            stroke={lipColor}
            strokeWidth="2"
            fill="#fff"
            strokeLinecap="round"
          />
        </g>
      );
    case "lips":
      return (
        <g>
          <path d="M43 50 Q50 47 57 50" stroke={lipColor} strokeWidth="1.5" fill={lipColor} />
          <path d="M43 50 Q50 55 57 50" stroke={lipColor} strokeWidth="1.5" fill={lipColor} opacity="0.8" />
        </g>
      );
    default:
      return null;
  }
}

// ─── Clothes ────────────────────────────────────────────────────────────────

function ClothesLayer({ clothes, skin }: { clothes: string; skin: string }) {
  switch (clothes) {
    case "suit":
      return (
        <g>
          <rect x="22" y="70" width="56" height="30" rx="4" fill="#2c2c3a" />
          <path d="M40 70 L50 82 L60 70" fill="#fff" />
          <rect x="48" y="74" width="4" height="14" rx="1" fill="#d4af37" />
        </g>
      );
    case "tshirt":
      return (
        <g>
          <rect x="22" y="70" width="56" height="30" rx="6" fill="#4a90d9" />
          <ellipse cx="50" cy="70" rx="10" ry="4" fill={skin} />
        </g>
      );
    case "blouse":
      return (
        <g>
          <rect x="22" y="70" width="56" height="30" rx="6" fill="#e8a0b4" />
          <ellipse cx="50" cy="70" rx="8" ry="3" fill={skin} />
          <circle cx="50" cy="78" r="1.5" fill="#d4af37" />
          <circle cx="50" cy="84" r="1.5" fill="#d4af37" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <rect x="22" y="70" width="56" height="30" rx="6" fill="#5a5a6a" />
          <ellipse cx="50" cy="70" rx="12" ry="5" fill="#4a4a5a" />
          <path d="M44 70 Q50 76 56 70" stroke="#4a4a5a" strokeWidth="2" fill="none" />
        </g>
      );
    case "kurta":
      return (
        <g>
          <rect x="22" y="70" width="56" height="30" rx="4" fill="#f5e6c8" />
          <path d="M40 70 L50 80 L60 70" fill="#d4af37" opacity="0.6" />
          <line x1="50" y1="78" x2="50" y2="95" stroke="#d4af37" strokeWidth="1" opacity="0.4" />
        </g>
      );
    default:
      return null;
  }
}

// ─── Accessories ────────────────────────────────────────────────────────────

function AccessoryLayer({ type }: { type: string }) {
  switch (type) {
    case "glasses":
      return (
        <g stroke="#333" strokeWidth="1.5" fill="none">
          <circle cx="40" cy="40" r="7" />
          <circle cx="60" cy="40" r="7" />
          <path d="M47 40 L53 40" />
          <path d="M33 40 L28 38" />
          <path d="M67 40 L72 38" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <rect x="32" y="36" width="16" height="9" rx="3" fill="#1a1a1a" />
          <rect x="52" y="36" width="16" height="9" rx="3" fill="#1a1a1a" />
          <path d="M48 40 L52 40" stroke="#1a1a1a" strokeWidth="1.5" />
          <path d="M32 40 L28 38" stroke="#1a1a1a" strokeWidth="1.5" />
          <path d="M68 40 L72 38" stroke="#1a1a1a" strokeWidth="1.5" />
        </g>
      );
    case "earrings":
      return (
        <g>
          <circle cx="26" cy="46" r="2.5" fill="#d4af37" />
          <circle cx="74" cy="46" r="2.5" fill="#d4af37" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M26 30 Q50 12 74 30" fill="#2c2c3a" />
          <rect x="24" y="28" width="52" height="5" rx="2" fill="#2c2c3a" />
          <rect x="20" y="29" width="18" height="4" rx="2" fill="#2c2c3a" />
        </g>
      );
    default:
      return null;
  }
}

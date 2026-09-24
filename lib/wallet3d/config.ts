/**
 * Validating a wallet configuration, and moving it between the database row
 * and the shape the renderer wants.
 *
 * This is the only place that decides whether a stored value still means
 * anything. Both ends go through it: the API route before it writes, and every
 * screen before it draws. An unrecognised value — a finish that shipped and was
 * withdrawn, a colour that belonged to a different material, a row written by a
 * build two versions ago — falls back to the default rather than throwing or
 * rendering a swatch that does not exist. Nobody's wallet should break because
 * the catalogue moved.
 *
 * WHY THIS IS NOT IN finishes.ts
 *
 * The note styles live in banknote.ts, which imports three. Pulling that module
 * into an API route or a server component drags the whole renderer into the
 * server bundle for the sake of six strings. The type comes across (types are
 * erased); the six ids are listed below, in a shape that makes TypeScript fail
 * this file if a seventh is ever added without being listed here.
 */

import {
  DEFAULT_CONFIG,
  EMBOSS,
  THREADS,
  getColor,
  getFinish,
  type WalletConfig,
} from "./finishes";
import type { NoteStyleId } from "./banknote";

/** Every note style there is. A new NoteStyleId will not compile until it is here. */
const NOTE_STYLES: Record<NoteStyleId, true> = {
  classic: true,
  sepia: true,
  midnight: true,
  azure: true,
  forest: true,
  rose: true,
};

/**
 * The engraving is stored in the `nameplate` column, which is the one field
 * that survived both redesigns intact. The studio's own input stops at 16;
 * this is the ceiling the column is willing to hold, not a target.
 */
export const ENGRAVING_MAX = 22;

/** The same character class the studio's input enforces, applied server-side too. */
export function normalizeEngraving(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[^\p{L}\p{N} .&'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ENGRAVING_MAX);
}

/**
 * A configuration from anything at all — a request body, a database row, a
 * value parsed out of localStorage that a previous build wrote.
 *
 * `engraving` is passed separately because it does not travel with the rest:
 * it is stored in `nameplate` and seeded from there.
 */
export function normalizeConfig(input: unknown, engraving = ""): WalletConfig {
  const obj = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  /* getFinish already falls back to the first finish, so this is always real. */
  const finish = getFinish(String(obj.finish ?? ""));

  /* A colour only means something inside its own finish. Changing material can
     orphan one — the same correction useWalletConfig makes when the studio
     switches finish — so resolve it against the finish we just settled on. */
  const color = getColor(finish, String(obj.color ?? ""));

  const emboss = String(obj.emboss ?? "");
  const thread = String(obj.thread ?? "");
  const notes = String(obj.notes ?? "");

  return {
    finish: finish.id,
    color: color.id,
    emboss: EMBOSS.some((e) => e.id === emboss) ? emboss : DEFAULT_CONFIG.emboss,
    thread: THREADS.some((t) => t.id === thread) ? thread : DEFAULT_CONFIG.thread,
    notes: notes in NOTE_STYLES ? (notes as NoteStyleId) : DEFAULT_CONFIG.notes,
    engraving: normalizeEngraving(engraving),
  };
}

/**
 * The columns 20260922080000_wallet_config.sql adds, plus the engraving's home.
 *
 * `wallet_finish`, not `finish`: the table still carries a `finish` column from
 * the retired card model, holding values like 'matte' that mean nothing here.
 * Likewise `stitch`, not `thread` — that one belongs to the retired bifold and
 * is still read by the customise screen. Both are left alone.
 */
export type WalletConfigRow = {
  wallet_finish?: unknown;
  finish_color?: unknown;
  emboss?: unknown;
  stitch?: unknown;
  note_style?: unknown;
  nameplate?: unknown;
};

/**
 * A row out of wallet_prefs, as a configuration.
 *
 * Tolerates the row being null and every column being absent, which is what a
 * project that has not run the migration yet returns. That case is the default
 * wallet — the same thing the customer saw before — not an error.
 */
export function configFromRow(row: WalletConfigRow | null | undefined): WalletConfig {
  if (!row) return { ...DEFAULT_CONFIG };
  return normalizeConfig(
    {
      finish: row.wallet_finish,
      color: row.finish_color,
      emboss: row.emboss,
      thread: row.stitch,
      notes: row.note_style,
    },
    typeof row.nameplate === "string" ? row.nameplate : "",
  );
}

/** A configuration, as the columns to write. The engraving is written separately. */
export function configToRow(config: WalletConfig) {
  return {
    wallet_finish: config.finish,
    finish_color: config.color,
    emboss: config.emboss,
    stitch: config.thread,
    note_style: config.notes,
  };
}

/**
 * The document vault's fixed lists.
 *
 * NO AADHAAR
 *
 * There is deliberately no Aadhaar type. LAWFIC does not hold Aadhaar copies
 * (see the Aadhaar service FAQ) — the Aadhaar Act and UIDAI's guidance make
 * storing them a liability the business has decided not to carry. A customer
 * who uploads one under "Other" is told not to on the page.
 */

export const VAULT_KINDS = [
  { id: "pan", label: "PAN card" },
  { id: "gst_certificate", label: "GST certificate" },
  { id: "udyam_certificate", label: "Udyam certificate" },
  { id: "incorporation", label: "Incorporation / partnership deed" },
  { id: "fssai", label: "FSSAI licence" },
  { id: "trademark", label: "Trademark certificate" },
  { id: "agreement", label: "Agreement or contract" },
  { id: "address_proof", label: "Address proof (rent agreement, utility bill)" },
  { id: "bank", label: "Bank statement / cancelled cheque" },
  { id: "photo", label: "Photograph" },
  { id: "other", label: "Other" },
] as const;

export const VAULT_MAX_BYTES = 10 * 1024 * 1024;

/** Accepted MIME types → file extension used in the storage path. */
export const VAULT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function vaultKindLabel(id: string): string {
  return VAULT_KINDS.find((k) => k.id === id)?.label ?? "Other";
}

export type Banner = {
  id: number;
  title: string;
  label: string;
  href: string;
  color: string;
};

export const promotionalBanners: Banner[] = [
  {
    id: 1,
    title: "Startup Registration",
    label: "Udyam & MSME Registration",
    href: "/services/msme-udyam",
    color: "#dc2626",
  },
  {
    id: 2,
    title: "GST Registration",
    label: "GSTIN in your name, start to finish",
    href: "/services/gst",
    color: "#2563eb",
  },
  {
    id: 3,
    title: "PAN Card Services",
    label: "New cards, corrections & linking",
    href: "/services/pan",
    color: "#059669",
  },
  {
    id: 4,
    title: "Aadhaar Services",
    label: "Corrections, updates & appointments",
    href: "/services/aadhaar",
    color: "#d97706",
  },
  {
    id: 5,
    title: "Business Registration",
    label: "Private Ltd, LLP, Partnership & more",
    href: "/services",
    color: "#7c3aed",
  },
  {
    id: 6,
    title: "Jobs for You",
    label: "Matched to your city & trade",
    href: "/jobs",
    color: "#0891b2",
  },
];

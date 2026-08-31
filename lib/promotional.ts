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
    title: "STARTUP",
    label: "Udyam & MSME Registration — Start your business today",
    href: "/services/msme-udyam",
    color: "#dc2626",
  },
  {
    id: 2,
    title: "WHAT IS EDUCATION?",
    label: "Learn about professional certifications and compliance training",
    href: "/about",
    color: "#2563eb",
  },
  {
    id: 3,
    title: "BUSINESS",
    label: "Private Ltd, LLP, Partnership & more — register your company",
    href: "/services#business",
    color: "#059669",
  },
  {
    id: 4,
    title: "PARTNERSHIP",
    label: "Collaborate and grow with LAWFIC partner programs",
    href: "/about",
    color: "#d97706",
  },
  {
    id: 5,
    title: "Highest Paying Jobs in India",
    label: "Browse curated job listings matched to your city and trade",
    href: "/jobs",
    color: "#7c3aed",
  },
  {
    id: 6,
    title: "MEMBERSHIP BENEFITS",
    label: "Save 10% on all services — become a LAWFIC member today",
    href: "/pricing",
    color: "#0891b2",
  },
];

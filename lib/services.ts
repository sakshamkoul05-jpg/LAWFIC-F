export type Fee = {
  /** What the government charges. Shown separately, always. */
  government: string;
  /** What LAWFIC charges for the work. */
  professional: string;
};

export type Service = {
  slug: string;
  name: string;
  short: string;
  category: string;
  tagline: string;
  summary: string;
  turnaround: string;
  fee: Fee;
  who: string[];
  documents: string[];
  steps: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  /** Set where LAWFIC assists with paperwork but performs no official act. */
  advisoryOnly?: boolean;
};

export const services: Service[] = [
  {
    slug: "aadhaar",
    name: "Aadhaar Services",
    short: "Aadhaar",
    category: "Identity",
    tagline: "Corrections, updates and appointments — handled properly the first time.",
    summary:
      "Most Aadhaar rejections are paperwork problems, not identity problems: a mismatched surname, a proof of address that is three months out of date, a form filled in the wrong script. We check the file before it goes in, prepare the correct form, and book you the appointment.",
    turnaround: "Appointment in 2–4 days",
    fee: { government: "₹50 per update, paid at the centre", professional: "₹199" },
    advisoryOnly: true,
    who: [
      "Anyone whose name, date of birth or address needs correcting",
      "People whose Aadhaar and PAN details do not match",
      "Families updating a child's Aadhaar after age 5 or 15",
      "Anyone who has been turned away once already",
    ],
    documents: [
      "Existing Aadhaar number (masked is fine)",
      "Proof of the detail being corrected",
      "A recent proof of address, if the address is changing",
      "A registered mobile number",
    ],
    steps: [
      { title: "Send us the details", body: "Tell us what is wrong and what it should say. No documents needed yet." },
      { title: "We check the file", body: "We confirm which proof the centre will accept for your specific correction, and flag anything that will bounce." },
      { title: "Form and appointment", body: "We prepare the update form and book your slot at an authorised enrolment centre." },
      { title: "You attend, we follow up", body: "Biometrics happen in person — that part is always you. We track the URN until it closes." },
    ],
    faq: [
      {
        q: "Can LAWFIC update my Aadhaar for me?",
        a: "No, and nobody outside an authorised enrolment centre can. Aadhaar updates require your biometrics, in person. What we do is make sure the paperwork you walk in with is correct, so the visit works the first time.",
      },
      {
        q: "Do you need a copy of my Aadhaar card?",
        a: "No. A masked Aadhaar number is enough for us to prepare your file, and we do not store Aadhaar photocopies.",
      },
      {
        q: "How many times can I change my name?",
        a: "Twice in a lifetime for name, once for date of birth, and gender once. Address can be updated as often as needed. We will tell you if you have already used yours.",
      },
    ],
  },

  {
    slug: "msme-udyam",
    name: "MSME Udyam Registration",
    short: "MSME / Udyam",
    category: "Business",
    tagline: "The certificate that unlocks collateral-free loans and tender access.",
    summary:
      "Udyam is the government's register of micro, small and medium enterprises. The certificate is what banks ask for before a collateral-free loan under CGTMSE, what buyers ask for on a 45-day payment claim, and what most state subsidy schemes check first.",
    turnaround: "Same day",
    fee: { government: "Free — there is no government fee", professional: "₹499" },
    who: [
      "Traders, manufacturers and service businesses under the MSME turnover limits",
      "Anyone applying for a collateral-free business loan",
      "Businesses bidding for government tenders",
      "Proprietors who want the 45-day delayed-payment protection",
    ],
    documents: [
      "Aadhaar number of the proprietor, partner or director",
      "PAN of the business",
      "GSTIN, if the business is registered",
      "Bank account details and business address",
    ],
    steps: [
      { title: "Classification", body: "We work out whether you are micro, small or medium on the current investment and turnover slabs. Getting this wrong costs you scheme eligibility." },
      { title: "Filing", body: "We file on the Udyam portal against your Aadhaar and PAN, and reconcile the auto-fetched ITR and GST figures." },
      { title: "Certificate", body: "The certificate issues with a permanent Udyam Registration Number and a QR code. Usually the same day." },
    ],
    faq: [
      {
        q: "Udyam registration is free. What am I paying you for?",
        a: "The filing is free and we say so on the invoice. You are paying for correct classification, reconciling the figures the portal pulls from your ITR and GST, and someone answering the phone when a bank queries the certificate.",
      },
      {
        q: "Does my old Udyog Aadhaar still work?",
        a: "No. Udyog Aadhaar memoranda have ceased to be valid and need re-registration under Udyam.",
      },
      {
        q: "Do I need GST first?",
        a: "Only if your business is required to be GST-registered. If you are below the threshold and exempt, you can register for Udyam without a GSTIN.",
      },
    ],
  },

  {
    slug: "gst",
    name: "GST Registration",
    short: "GST",
    category: "Tax",
    tagline: "A GSTIN in your name, and someone who understands what the fifteen digits mean.",
    summary:
      "Once you cross the turnover threshold — or the moment you sell interstate, sell online, or need to claim input credit — GST registration stops being optional. The application itself is free. The rejections come from address proof, business-activity codes and the wrong constitution of business.",
    turnaround: "7–10 working days",
    fee: { government: "Free — there is no government fee", professional: "₹1,499" },
    who: [
      "Businesses over ₹40 lakh turnover for goods, or ₹20 lakh for services",
      "Anyone selling on Amazon, Flipkart or their own store",
      "Businesses supplying interstate, at any turnover",
      "Anyone whose buyers are asking for a tax invoice with input credit",
    ],
    documents: [
      "PAN and Aadhaar of the proprietor, partners or directors",
      "Proof of business address — electricity bill, rent agreement or NOC",
      "Bank statement or a cancelled cheque",
      "Photographs, and the incorporation certificate for companies and LLPs",
    ],
    steps: [
      { title: "Eligibility and scheme", body: "Regular or composition. Composition is cheaper to run but blocks input credit and interstate supply — we go through what it actually costs you." },
      { title: "Application and ARN", body: "We file REG-01, complete Aadhaar authentication and hand you the ARN to track." },
      { title: "Clarifications", body: "Most rejections are an address-proof query. If one comes, we answer it within the window — that is the part people miss." },
      { title: "GSTIN issued", body: "Your certificate arrives with a 15-digit GSTIN. We explain how to read it and set up your first return calendar." },
    ],
    faq: [
      {
        q: "Is LAWFIC a GST Suvidha Provider?",
        a: "No. We are a private consultancy that prepares and files your application on the government portal in your name. We are not a GSP and are not affiliated with GSTN.",
      },
      {
        q: "How long does it really take?",
        a: "Seven to ten working days when the address proof is clean. If an officer raises a query it adds a week. Physical verification, when triggered, adds two.",
      },
      {
        q: "Can I use my home address?",
        a: "Yes, with the right proof — an electricity bill in your name, or a consent letter plus the owner's bill if the property is not yours.",
      },
    ],
  },

  {
    slug: "pan",
    name: "PAN Services",
    short: "PAN",
    category: "Identity",
    tagline: "New cards, corrections, and the Aadhaar link that stops your PAN going inoperative.",
    summary:
      "A PAN is ten characters, and every one of them means something. We issue new PANs, fix the mismatches that block bank accounts and refunds, and handle the Aadhaar linking that keeps a PAN operative.",
    turnaround: "e-PAN in 48 hours",
    fee: { government: "₹107 for a new PAN, ₹1,000 for late Aadhaar linking", professional: "₹299" },
    who: [
      "Anyone opening a bank or demat account, or filing a first return",
      "People whose PAN name does not match their bank or Aadhaar records",
      "Businesses needing a PAN in the entity's name",
      "Anyone whose PAN has gone inoperative for want of an Aadhaar link",
    ],
    documents: [
      "Aadhaar number for identity and address",
      "Date-of-birth proof",
      "A photograph and signature in the accepted format",
      "The existing PAN, for corrections and reprints",
    ],
    steps: [
      { title: "New, correct or link", body: "Three different forms and three different fee structures. We start by working out which one you actually need." },
      { title: "Application", body: "We file Form 49A or the correction form, matching your details character for character against Aadhaar." },
      { title: "e-PAN, then the card", body: "The e-PAN is usually issued within 48 hours. The physical card follows by post." },
    ],
    faq: [
      {
        q: "My PAN has become inoperative. What now?",
        a: "It means it has not been linked to Aadhaar. Linking restores it, with a ₹1,000 government fee for late linking. Until it is restored, refunds are held and higher TDS applies.",
      },
      {
        q: "The name on my PAN is spelt wrong.",
        a: "That is a correction, not a new PAN — and applying for a second PAN is an offence. We file the correction against your existing number.",
      },
      {
        q: "Can I hold two PANs?",
        a: "No. Holding more than one carries a ₹10,000 penalty. If you have accidentally been issued two, we can help surrender the duplicate.",
      },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export const upcoming = [
  { name: "FSSAI Food Licence", note: "Basic, State and Central registration" },
  { name: "Jobs for you", note: "Openings matched to your city and trade" },
  { name: "Trademark", note: "Search, filing and objection replies" },
  { name: "ITR Filing", note: "Salaried, business and presumptive" },
];

/**
 * Legal pages.
 *
 * ⚠ THESE ARE DRAFTS AND NEED A LAWYER'S REVIEW BEFORE LAUNCH. They are
 * written to be accurate about how the system actually behaves — the wallet
 * really is closed-loop, refunds really are same-day credits, we really do not
 * store Aadhaar photocopies — so they are a sound starting point rather than
 * boilerplate. But a compliance company shipping unreviewed terms is not a good
 * look, and Razorpay's activation review reads them.
 *
 * They exist now because Razorpay will not activate a merchant account until
 * Terms, Privacy, Refunds and Contact are live on the domain. Writing them late
 * blocks go-live.
 *
 * Entity-specific details come from lib/company.ts and render as nothing while
 * they are null, rather than as invented placeholders.
 */

export type LegalDoc = {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

const UPDATED = "27 August 2026";

export const legalDocs: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "What LAWFIC does, what it does not do, and what each of us is responsible for.",
    updated: UPDATED,
    sections: [
      {
        heading: "Who we are",
        body: [
          "LAWFIC is a private consultancy that prepares and files applications for business registrations, licences and statutory returns on your behalf and in your name.",
          "We are not a government body. We are not affiliated with UIDAI, the Income Tax Department, GSTN, FSSAI, the Ministry of Corporate Affairs or any other authority, and we are not a GST Suvidha Provider. We hold no special access to any government system.",
        ],
      },
      {
        heading: "What we do and do not do",
        body: [
          "We advise on which registration or licence you need, prepare the paperwork, file it on the relevant public portal using your credentials and your authentication, respond to departmental queries within the permitted window, and track the application until it closes.",
          "We do not perform Aadhaar authentication or eKYC, and we do not access any government database on your behalf. Where a step requires your biometrics or your personal presence — an Aadhaar update at an enrolment centre, for example — that step is always yours to perform.",
          "We cannot guarantee that any authority will approve an application. What we are responsible for is that the application is correct, complete and filed on time.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You must give accurate information. Applications are rejected far more often because of a mismatched name or an out-of-date proof than for any other reason, and we can only work from what you send us.",
          "You are responsible for keeping your sign-in credentials secure. Tell us immediately if you believe someone else has access to your account.",
          "You must not use LAWFIC to file anything false, to impersonate another person, or for any purpose that is unlawful.",
        ],
      },
      {
        heading: "Quotes, fees and payment",
        body: [
          "You send a request; we review it and give you a quote. Nothing is charged before you have seen and accepted that quote.",
          "Every quote separates the government fee — the amount the department itself charges — from LAWFIC's professional fee. Government fees are passed through at cost. Where a service has no government fee, we say so rather than absorbing the difference into our own line.",
          "Payment is made from your LAWFIC wallet. See the Wallet Terms for how the wallet works.",
          "Goods and Services Tax is charged on our professional fee at the applicable rate and shown separately.",
        ],
      },
      {
        heading: "Timelines",
        body: [
          "Any turnaround we state is our estimate of the department's processing time based on ordinary experience. It is not a guarantee. Departmental queries, physical verification and portal outages extend timelines and are outside our control.",
          "Where a delay is ours, tell us and we will fix it or refund the professional fee for that filing.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "Our liability in connection with any filing is limited to the professional fee you paid us for that filing.",
          "We are not liable for penalties, interest or losses arising from information you gave us that was incorrect or incomplete, from your failure to act on a deadline we notified you of, or from a decision of an authority.",
          "Nothing in these terms limits liability that cannot be limited by law.",
        ],
      },
      {
        heading: "Ending the relationship",
        body: [
          "You may stop using LAWFIC at any time. Filings already in progress are completed.",
          "We may decline or discontinue work where we believe a filing would be false or unlawful, where you have not provided documents we have asked for, or where you have breached these terms. If we discontinue, anything you have paid for work not done is credited back to your wallet.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by the laws of India, and the courts at our registered office have exclusive jurisdiction.",
        ],
      },
    ],
  },

  {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "What we collect, why, how long we keep it, and the identity documents we deliberately do not store.",
    updated: UPDATED,
    sections: [
      {
        heading: "The short version",
        body: [
          "We collect the minimum a filing needs. We do not sell your data, we do not use it for advertising, and we do not keep Aadhaar photocopies.",
          "This policy is written with the Digital Personal Data Protection Act, 2023 in mind. You have rights over your data and they are set out below.",
        ],
      },
      {
        heading: "What we collect",
        body: [
          "Account details: your mobile number or email address, and a name if you give one. These identify you and let us tell you what is happening with your filings.",
          "Filing details: the information a particular application requires — business name, address, turnover band, the identifiers a form asks for. What we ask for varies by service and is listed on that service's page before you start.",
          "Payment records: the amount, the time, and the payment reference. Card and bank details are handled entirely by Razorpay, our payment processor. We never see or store them.",
          "Usage data: basic technical logs needed to keep the service running and secure.",
        ],
      },
      {
        heading: "Aadhaar, specifically",
        body: [
          "We do not store Aadhaar photocopies. Where a filing needs an Aadhaar reference we work from a masked number or an offline XML, held in private storage with short retention.",
          "This is deliberate. Aadhaar copies are the single most sensitive thing a business in our position could accumulate, and the safest way to hold them is not to.",
        ],
      },
      {
        heading: "Why we process it",
        body: [
          "To prepare and file the applications you have asked us to file — the contract between us.",
          "To meet our own legal and tax obligations, including keeping records of transactions for the periods the law requires.",
          "To keep the service secure and prevent fraud.",
          "We do not use your data to train models, and we do not sell or rent it to anyone.",
        ],
      },
      {
        heading: "Who else sees it",
        body: [
          "The relevant government portal, when we file your application — that is the point of the exercise, and it is filed in your name.",
          "Our infrastructure providers, who host the service under contract and process data only on our instructions.",
          "Razorpay, for payments.",
          "Anyone we are legally required to disclose to, on a valid order.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Filing records for as long as the relevant tax and corporate law requires us to hold them, then deletion.",
          "Uploaded documents for as long as the filing is live plus a short period for departmental queries, then deletion.",
          "You can ask us to delete your account and we will, except where we are legally required to retain a record.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask what we hold about you, ask us to correct it, ask us to delete it, and withdraw consent where processing rests on consent.",
          "You can also complain to us, and if we do not resolve it, to the Data Protection Board. Our grievance contact is on the Contact page.",
        ],
      },
      {
        heading: "Security",
        body: [
          "Data is encrypted in transit and at rest. Access is restricted to the staff who need it for your filing. Documents sit in private storage reachable only through short-lived signed links, never a public URL.",
        ],
      },
    ],
  },

  {
    slug: "refunds",
    title: "Refunds & Cancellation",
    summary: "When money comes back, how quickly, and the one case where it does not.",
    updated: UPDATED,
    sections: [
      {
        heading: "Before you are quoted",
        body: [
          "Nothing has been charged, so there is nothing to refund. You can abandon a request at any point before accepting a quote and it costs you nothing.",
        ],
      },
      {
        heading: "After you have paid, before we have filed",
        body: [
          "Tell us and we will cancel and credit the full professional fee back to your wallet, usually the same day.",
          "Any government fee already paid to a department on your behalf cannot be recovered by us, because the department has it. We will tell you the exact amount before it is paid.",
        ],
      },
      {
        heading: "After we have filed",
        body: [
          "The professional fee is for the work of preparing and filing, which has been done, so it is not ordinarily refundable at this point.",
          "If the filing fails because of an error on our side, we correct it at no charge, or refund the professional fee in full if it cannot be corrected.",
          "If a department rejects the application on grounds we could not have prevented — a discretionary refusal, a change in rules mid-application — we will tell you plainly, and we will not charge again to re-file the same application.",
        ],
      },
      {
        heading: "If we cannot proceed",
        body: [
          "If we close a filing because it cannot go ahead, every rupee taken for it is credited back to your wallet in the same action that closes the order. You will see it on your statement as a credit against that order reference.",
          "You never have to ask for this and there is no processing period.",
        ],
      },
      {
        heading: "Wallet balance",
        body: [
          "Balance in your LAWFIC wallet is prepaid credit for LAWFIC services. It does not expire, we do not charge to hold it, and it cannot be transferred to another person or withdrawn to a bank account. See the Wallet Terms.",
        ],
      },
      {
        heading: "How to raise a refund",
        body: [
          "Open the filing in your account and use the contact route shown there, or write to our support address. We acknowledge within 48 hours and resolve within one month, as the Consumer Protection (E-Commerce) Rules 2020 require.",
        ],
      },
    ],
  },

  {
    slug: "wallet-terms",
    title: "Wallet Terms",
    summary:
      "The LAWFIC wallet is prepaid credit for LAWFIC services. It is not a payment instrument, and this page says exactly what that means.",
    updated: UPDATED,
    sections: [
      {
        heading: "What the wallet is",
        body: [
          "The LAWFIC wallet is a prepaid balance you can spend on LAWFIC's own services. You top it up by card, UPI or net banking through Razorpay, and the balance is debited when you pay for a filing.",
          "It exists so that you are not re-entering payment details for every filing, and so that refunds can be returned to you immediately rather than through a card reversal.",
        ],
      },
      {
        heading: "What the wallet is not",
        body: [
          "It is not a payment instrument, a bank account, or a wallet in the sense of a payments app.",
          "Balance cannot be transferred to another user. It cannot be withdrawn to a bank account. It cannot be used to pay any third party, including an employer listed on our jobs board.",
          "These are not restrictions we have chosen to be difficult about. A prepaid instrument that can pay third parties requires authorisation from the Reserve Bank of India; one that can only buy the issuer's own services does not. Keeping the wallet closed is what keeps it lawful for us to operate.",
        ],
      },
      {
        heading: "Topping up",
        body: [
          "Minimum top-up is ₹100. Payments are processed by Razorpay; we never see your card details.",
          "Your balance is credited only when we receive a verified confirmation from Razorpay that the payment succeeded. If a payment succeeds but the balance has not moved within a few minutes, contact us — do not pay again.",
        ],
      },
      {
        heading: "Spending",
        body: [
          "The wallet is debited when you accept a quote and pay for a filing. Government fee and professional fee are debited as separate entries so your statement shows both.",
          "The balance cannot go negative. If a filing costs more than you hold, you will be asked to top up rather than being allowed to overdraw.",
        ],
      },
      {
        heading: "Refunds into the wallet",
        body: [
          "Where a filing is cancelled or cannot proceed, the amount is credited back to your wallet as a new entry against that order.",
          "The ledger is append-only: we never edit or delete a past entry. A correction is always a new, visible entry, so your statement is a complete history rather than a current figure.",
        ],
      },
      {
        heading: "Expiry and closure",
        body: [
          "Balance does not expire and we do not levy a fee for holding it.",
          "If you close your account with a balance remaining, contact us and we will discuss the options available at that time, subject to the restriction that the wallet cannot pay out to a bank account.",
        ],
      },
      {
        heading: "Statements",
        body: [
          "Every credit and debit is listed in your account with its date, its reason and the order reference it relates to. Top-ups carry the payment reference from Razorpay so they can be matched against your card or bank statement.",
        ],
      },
    ],
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return legalDocs.find((d) => d.slug === slug);
}

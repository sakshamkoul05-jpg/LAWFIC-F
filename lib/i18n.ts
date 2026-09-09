/**
 * Language for the site chrome.
 *
 * WHAT IS TRANSLATED HERE, AND WHAT DELIBERATELY IS NOT
 *
 * Navigation, controls and the account menu — the furniture someone uses to get
 * around. Body copy is NOT translated and must not be machine-translated into
 * this file. The site explains statutory obligations: which registration a
 * business needs, what a licence costs, when a return is due. A mistranslation
 * there is not a cosmetic bug, it is wrong advice about the law, and "Udyam"
 * and "Udyog Aadhaar" are not interchangeable words however similar a
 * translation engine finds them.
 *
 * So the chrome is translated by hand and the content is left in English until
 * a person who works in the language has written it. That is a smaller promise
 * than a language toggle usually implies, and it is the honest one.
 *
 * ADDING A LANGUAGE
 *
 * Add an entry to LOCALES and a block to DICT. Nothing else changes — the
 * switcher, the persistence and the lang attribute all read from here. Do not
 * add a locale until someone who speaks it has checked the strings; a half
 * translated navigation is worse than an untranslated one, because it looks
 * finished.
 */

export type LocaleCode = "en" | "hi" | "es";

export type Locale = {
  code: LocaleCode;
  /** In the language itself, which is how a speaker finds it in a list. */
  native: string;
  english: string;
};

export const LOCALES: Locale[] = [
  { code: "en", native: "English", english: "English" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "es", native: "Español", english: "Spanish" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";
export const LOCALE_KEY = "lawfic.locale";

/** Every string the chrome shows. Keys are the English text, lowercased ids. */
export type Dict = Record<string, string>;

const en: Dict = {
  // header
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.allSections": "All sections",
  "nav.search": "Search services and documents",
  "nav.searchIn": "Search in",
  "nav.suggestions": "Suggestions",
  "nav.language": "Language",
  "nav.filingIn": "Filing in",
  "nav.chooseState": "Choose your state",
  "nav.allIndia": "All India",
  "nav.soon": "Soon",
  "nav.service": "Service",
  "nav.document": "Document",
  "nav.section": "Section",
  // account
  "acct.signIn": "Sign in",
  "acct.signOut": "Sign out",
  "acct.account": "Account",
  "acct.profile": "Your profile",
  "acct.filings": "Your filings",
  "acct.wallet": "Wallet",
  "acct.saved": "Saved services",
  "acct.statement": "Statement",
  "acct.cart": "Your cart",
  "acct.createAccount": "Create an account",
  "acct.continueEmail": "Continue with email",
  "acct.notNow": "Not now",
  "acct.signInTitle": "Sign in to LAWFIC",
  "acct.signInBlurb":
    "Track every filing, keep your documents in one place, and pay from your wallet without re-entering a card.",
};

const hi: Dict = {
  "nav.openMenu": "मेन्यू खोलें",
  "nav.closeMenu": "मेन्यू बंद करें",
  "nav.allSections": "सभी अनुभाग",
  "nav.search": "सेवाएँ और दस्तावेज़ खोजें",
  "nav.searchIn": "इसमें खोजें",
  "nav.suggestions": "सुझाव",
  "nav.language": "भाषा",
  "nav.filingIn": "फाइलिंग राज्य",
  "nav.chooseState": "अपना राज्य चुनें",
  "nav.allIndia": "पूरे भारत",
  "nav.soon": "जल्द",
  "nav.service": "सेवा",
  "nav.document": "दस्तावेज़",
  "nav.section": "अनुभाग",
  "acct.signIn": "साइन इन करें",
  "acct.signOut": "साइन आउट करें",
  "acct.account": "खाता",
  "acct.profile": "आपकी प्रोफ़ाइल",
  "acct.filings": "आपकी फाइलिंग",
  "acct.wallet": "वॉलेट",
  "acct.saved": "सहेजी गई सेवाएँ",
  "acct.statement": "विवरण",
  "acct.cart": "आपकी कार्ट",
  "acct.createAccount": "खाता बनाएँ",
  "acct.continueEmail": "ईमेल से जारी रखें",
  "acct.notNow": "अभी नहीं",
  "acct.signInTitle": "LAWFIC में साइन इन करें",
  "acct.signInBlurb":
    "हर फाइलिंग पर नज़र रखें, अपने दस्तावेज़ एक जगह रखें, और कार्ड दोबारा डाले बिना वॉलेट से भुगतान करें।",
};

/** Section names, keyed by the tab ids in nav-tabs.ts. */
const tabsEn: Dict = {};
const tabsHi: Dict = {
  "tab.home": "होम",
  "tab.about": "हमारे बारे में",
  "tab.document": "दस्तावेज़",
  "tab.admission": "प्रवेश",
  "tab.education": "शिक्षा",
  "tab.startup": "स्टार्टअप",
  "tab.business": "व्यवसाय",
  "tab.jobs": "नौकरियाँ",
  "tab.branding": "ब्रांडिंग",
  "tab.partner": "साझेदार",
  "tab.investment": "निवेश",
  // The brand keeps its name in every language, as brands do.
  "tab.lawfic": "LAWFIC",
  "tab.new-idea": "नया विचार",
  "tab.blogs": "ब्लॉग",
  "tab.professionalism": "व्यावसायिकता",
  "tab.career": "करियर",
  "tab.entertainment": "मनोरंजन",
  "tab.gift": "उपहार",
  "tab.our-store": "हमारा स्टोर",
  "tab.instant-help": "तुरंत सहायता",
  "tab.contact": "संपर्क",
  "tab.my-money": "मेरा पैसा",
  "tab.your-ad": "आपका विज्ञापन",
  "tab.aakhri-umeed": "आख़िरी उम्मीद",
  "tab.social": "सामाजिक",
  "tab.press": "प्रेस",
  "tab.travel": "यात्रा",
  "tab.lawfic-club": "लॉफिक क्लब",
};


const es: Dict = {
  "nav.openMenu": "Abrir menú",
  "nav.closeMenu": "Cerrar menú",
  "nav.allSections": "Todas las secciones",
  "nav.search": "Buscar servicios y documentos",
  "nav.searchIn": "Buscar en",
  "nav.suggestions": "Sugerencias",
  "nav.language": "Idioma",
  "nav.filingIn": "Presentando en",
  "nav.chooseState": "Elige tu estado",
  "nav.allIndia": "Toda la India",
  "nav.soon": "Pronto",
  "nav.service": "Servicio",
  "nav.document": "Documento",
  "nav.section": "Sección",
  "acct.signIn": "Iniciar sesión",
  "acct.signOut": "Cerrar sesión",
  "acct.account": "Cuenta",
  "acct.profile": "Tu perfil",
  "acct.filings": "Tus trámites",
  "acct.wallet": "Cartera",
  "acct.saved": "Servicios guardados",
  "acct.statement": "Extracto",
  "acct.cart": "Tu carrito",
  "acct.createAccount": "Crear cuenta",
  "acct.continueEmail": "Continuar con el correo",
  "acct.notNow": "Ahora no",
  "acct.signInTitle": "Inicia sesión en LAWFIC",
  "acct.signInBlurb":
    "Sigue cada trámite, guarda tus documentos en un solo lugar y paga desde la cartera sin volver a introducir la tarjeta.",
};

const tabsEs: Dict = {
  "tab.home": "Inicio",
  "tab.about": "Quiénes somos",
  "tab.document": "Documentos",
  "tab.admission": "Admisión",
  "tab.education": "Educación",
  "tab.startup": "Startup",
  "tab.business": "Empresa",
  "tab.jobs": "Empleo",
  "tab.branding": "Marca",
  "tab.partner": "Socios",
  "tab.investment": "Inversión",
  /* The brand keeps its name in every language, as brands do. */
  "tab.lawfic": "LAWFIC",
  "tab.new-idea": "Tu idea",
  "tab.blogs": "Blog",
  "tab.professionalism": "Profesión",
  "tab.career": "Tu carrera",
  "tab.entertainment": "Entretenimiento",
  "tab.gift": "Regalos",
  "tab.our-store": "Nuestra tienda",
  "tab.instant-help": "Ayuda inmediata",
  "tab.contact": "Contacto",
  "tab.my-money": "Mi dinero",
  "tab.your-ad": "Tu anuncio",
  "tab.aakhri-umeed": "Aakhri Umeed",
  "tab.social": "Social",
  "tab.press": "Prensa",
  "tab.travel": "Viajes",
  "tab.lawfic-club": "Club LAWFIC",
};

export const DICT: Record<LocaleCode, Dict> = {
  en: { ...en, ...tabsEn },
  hi: { ...hi, ...tabsHi },
  es: { ...es, ...tabsEs },
};

/**
 * Look a string up, falling back to English and then to the key.
 *
 * Falling back rather than throwing is deliberate: a missing translation should
 * degrade to a word someone can still read, never to a blank control or a
 * crash. The key is the last resort and is obviously wrong on sight, which is
 * how you find the gap.
 */
export function translate(locale: LocaleCode, key: string, fallback?: string): string {
  return DICT[locale]?.[key] ?? DICT.en[key] ?? fallback ?? key;
}

export function isLocale(v: unknown): v is LocaleCode {
  return typeof v === "string" && LOCALES.some((l) => l.code === v);
}

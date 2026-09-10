/**
 * Hindi.
 *
 * Keyed by the English string itself rather than by an invented id. Retrofitting
 * ids onto several hundred strings already written in English means touching
 * every one of them and inventing a name for each; keying by the source text
 * means the same sentence translates the same way everywhere it appears, which
 * is what you want anyway — "GST Registration" occurs in the trending list, the
 * category grid and the catalogue, and there is no reading of it where those
 * should differ.
 *
 * A missing entry falls through to English. That is deliberate: a half
 * translated page is readable, a page full of raw keys is not.
 *
 * STATUTORY NAMES KEEP THEIR OFFICIAL FORM
 *
 * Udyam is उद्यम, GST is जीएसटी, PAN is पैन — the forms the departments
 * themselves use in Hindi. What is NOT done here is inventing a Hindi word for
 * a scheme that has none, or translating one scheme's name into another's:
 * Udyam and Udyog Aadhaar are different registrations however close a
 * translation engine puts them, and a customer who files the wrong one loses
 * both the fee and the time.
 */

export const hiPhrases: Record<string, string> = {
  /* ── Blueprint: the nine category headings ─────────────── */
  "Identification Document Service": "पहचान दस्तावेज़ सेवा",
  "Business Document Service": "व्यवसाय दस्तावेज़ सेवा",
  "Your Start Up Service": "आपकी स्टार्टअप सेवा",
  "Your Job Service Blog": "आपकी नौकरी सेवा ब्लॉग",
  "Feel Like You Are A Brand": "महसूस कीजिए कि आप एक ब्रांड हैं",
  "Best Investment Service": "सर्वश्रेष्ठ निवेश सेवा",
  "Real Social Work For Smile & Love India": "मुस्कान और प्रेम के लिए सच्ची समाजसेवा — भारत",
  "Partner With LAWFIC": "LAWFIC के साथ साझेदारी",
  "Entertainment Service": "मनोरंजन सेवा",

  /* ── Blueprint: the rows under them ────────────────────── */
  "Aadhaar Card": "आधार कार्ड",
  "Pan Card": "पैन कार्ड",
  "Voter ID Card": "मतदाता पहचान पत्र",
  "Indian Passport": "भारतीय पासपोर्ट",
  "Driving Licence": "ड्राइविंग लाइसेंस",
  "Labour Card": "श्रमिक कार्ड",
  "Birth Certificate": "जन्म प्रमाणपत्र",
  "Death Certificate": "मृत्यु प्रमाणपत्र",
  "Income Certificate": "आय प्रमाणपत्र",
  "EWS Certificate": "ईडब्ल्यूएस प्रमाणपत्र",
  "Caste Certificate": "जाति प्रमाणपत्र",
  "Request Document (Not In List)": "दस्तावेज़ का अनुरोध करें (सूची में नहीं)",
  "Income Tax Return (ITR)": "आयकर रिटर्न (ITR)",
  "Udyam Registration (MSME)": "उद्यम पंजीकरण (एमएसएमई)",
  "Free Talk To Start Up Expert": "स्टार्टअप विशेषज्ञ से नि:शुल्क बात",
  "Government Fund For Start Up": "स्टार्टअप के लिए सरकारी फंड",
  "Document Required For Start Up": "स्टार्टअप के लिए आवश्यक दस्तावेज़",
  "Online Start Up Business Guide": "ऑनलाइन स्टार्टअप व्यवसाय गाइड",
  "Top Tranding Government Job": "टॉप ट्रेंडिंग सरकारी नौकरी",
  "Top Tranding Private Job": "टॉप ट्रेंडिंग प्राइवेट नौकरी",
  "Top Local Job In Your Area": "आपके क्षेत्र की टॉप स्थानीय नौकरी",
  "Make Beautiful CV / Resume For Your Job": "अपनी नौकरी के लिए बेहतरीन सीवी / रिज़्यूमे बनवाएँ",
  "Learn Online / Offline Skill 4 Your Job": "अपनी नौकरी के लिए ऑनलाइन / ऑफ़लाइन कौशल सीखें",
  "Do Internship In Your Field": "अपने क्षेत्र में इंटर्नशिप करें",
  "Best Work From Home Job": "सर्वश्रेष्ठ वर्क फ्रॉम होम नौकरी",
  "Free Lancer / Part Time Job": "फ्रीलांस / पार्ट टाइम नौकरी",
  "Abroad / Out Of India Job": "विदेश / भारत से बाहर की नौकरी",
  "Learn AI By Expert 4 Your job": "अपनी नौकरी के लिए विशेषज्ञ से एआई सीखें",
  "Motivational Class / Video 4 Your Job": "नौकरी के लिए प्रेरक क्लास / वीडियो",
  "Request Your Own Choice Job (Not In List)": "अपनी पसंद की नौकरी का अनुरोध करें (सूची में नहीं)",
  "Make Your Personal Attractive Website": "अपनी आकर्षक निजी वेबसाइट बनवाएँ",
  "Business Static Website": "व्यवसाय की स्टैटिक वेबसाइट",
  "Business Dynamic Website": "व्यवसाय की डायनेमिक वेबसाइट",
  "Mobile Application (Android / iOS)": "मोबाइल ऐप्लिकेशन (एंड्रॉइड / iOS)",
  "Brand Advertisment Online / Local": "ब्रांड विज्ञापन — ऑनलाइन / स्थानीय",

  /* ── Trending ──────────────────────────────────────────── */
  "GST Registration": "जीएसटी पंजीकरण",
  "Aadhaar Card Services": "आधार कार्ड सेवाएँ",
  "PAN Card Application": "पैन कार्ड आवेदन",
  "Udyam / MSME Registration": "उद्यम / एमएसएमई पंजीकरण",
  "Income Tax Return": "आयकर रिटर्न",
  "Trademark Registration": "ट्रेडमार्क पंजीकरण",
  "Rent Agreement": "किरायानामा",
  "FSSAI Registration": "एफएसएसएआई पंजीकरण",

  /* Section labels used as chips on the trending cards. */
  "Tax & filings": "कर एवं फाइलिंग",
  Identity: "पहचान",
  Business: "व्यवसाय",
  Branding: "ब्रांडिंग",
  Travel: "यात्रा",
  Legal: "कानूनी",
  Certificates: "प्रमाणपत्र",

  /* ── Why choose LAWFIC ─────────────────────────────────── */
  "Why Choose LAWFIC Service?": "LAWFIC सेवा क्यों चुनें?",
  "Read more about LAWFIC": "LAWFIC के बारे में और पढ़ें",
  "The fee is itemised before you commit": "शुल्क पहले ही मदवार बता दिया जाता है",
  "Government fee and our fee, listed separately, on the page — not after a call.":
    "सरकारी शुल्क और हमारा शुल्क, अलग-अलग, पेज पर ही — किसी कॉल के बाद नहीं।",
  "A person owns your file": "आपकी फ़ाइल की ज़िम्मेदारी एक व्यक्ति की होती है",
  "One name, reachable, who knows what stage your application is at.":
    "एक नाम, जिससे संपर्क हो सके, और जिसे पता हो कि आपका आवेदन किस चरण में है।",
  "We say no when it will not work": "जब बात नहीं बनेगी, हम मना कर देते हैं",
  "If the papers do not support the application we tell you first, rather than filing it and billing you.":
    "यदि दस्तावेज़ आवेदन का समर्थन नहीं करते तो हम पहले ही बता देते हैं — फाइल करके बिल भेजने के बजाय।",
  "Everything in one place": "सब कुछ एक ही जगह",
  "Documents, filings, receipts and the balance that paid for them, in one account.":
    "दस्तावेज़, फाइलिंग, रसीदें और वह बैलेंस जिससे भुगतान हुआ — सब एक ही खाते में।",

  /* ── Trending / category section furniture ─────────────── */
  "Trending in LAWFIC": "LAWFIC में ट्रेंडिंग",
  "All services": "सभी सेवाएँ",
  "Available now": "अभी उपलब्ध",
  Enquire: "पूछताछ करें",
  "Service explore by category": "श्रेणी के अनुसार सेवाएँ देखें",
  "Nine categories. Every row goes to the page that does the work.":
    "नौ श्रेणियाँ। हर पंक्ति सीधे उसी पेज पर ले जाती है जहाँ काम होता है।",
  Category: "श्रेणी",
  "& more": "और भी",
  "The list for this category is still being written.":
    "इस श्रेणी की सूची अभी तैयार की जा रही है।",
  "See the section": "यह अनुभाग देखें",

  /* ── Hero and the rest of the home page ────────────────── */
  "Registrations, licences and compliance — handled.":
    "पंजीकरण, लाइसेंस और अनुपालन — सब संभाल लिया गया।",
  "Udyam, GST, PAN and FSSAI filings done end to end. Transparent fees, a prepaid wallet, and a jobs feed matched to your profile.":
    "उद्यम, जीएसटी, पैन और एफएसएसएआई की फाइलिंग शुरू से अंत तक। पारदर्शी शुल्क, प्रीपेड वॉलेट, और आपकी प्रोफ़ाइल से मेल खाती नौकरियों की फ़ीड।",
  services: "सेवाएँ",
  live: "लाइव",
  categories: "श्रेणियाँ",
  total: "कुल",
  "hidden fees": "छिपे शुल्क",
  "Browse services": "सेवाएँ देखें",
  "Create an account": "खाता बनाएँ",
  "Service Categories": "सेवा श्रेणियाँ",
  "View all": "सभी देखें",
  "Live Services": "लाइव सेवाएँ",
  "How It Works": "यह कैसे काम करता है",
  "Tell us what you need": "हमें बताइए आपको क्या चाहिए",
  "A short form. No documents and no payment at this stage.":
    "एक छोटा फ़ॉर्म। इस चरण में न दस्तावेज़ चाहिए, न भुगतान।",
  "We review and quote": "हम जाँचते हैं और कोटेशन देते हैं",
  "Government fee and our professional fee, itemised.":
    "सरकारी शुल्क और हमारा व्यावसायिक शुल्क, मदवार।",
  "Pay from your wallet": "अपने वॉलेट से भुगतान करें",
  "One tap. Your prepaid balance covers it.":
    "एक टैप। आपका प्रीपेड बैलेंस इसे कवर कर लेता है।",
  "Track to the certificate": "प्रमाणपत्र तक नज़र रखिए",
  "Every stage visible until the certificate is in your hands.":
    "हर चरण दिखता रहता है, जब तक प्रमाणपत्र आपके हाथ में न आ जाए।",
  "Pricing Plans": "मूल्य योजनाएँ",
  "Compare plans": "योजनाओं की तुलना करें",
  Popular: "लोकप्रिय",
  "Jobs for you": "आपके लिए नौकरियाँ",
  "Matched to your city and trade": "आपके शहर और काम के अनुसार",
  "Your wallet": "आपका वॉलेट",
  "Top up and track filings": "टॉप अप कीजिए और फाइलिंग पर नज़र रखिए",
  "Track applications": "आवेदनों पर नज़र रखिए",
  "Contact us": "हमसे संपर्क करें",
  "Get help from our team": "हमारी टीम से सहायता लीजिए",
  "Membership Benefits": "सदस्यता के लाभ",
  "Save 10% on all services with a LAWFIC membership plan":
    "LAWFIC सदस्यता योजना के साथ हर सेवा पर 10% की बचत",
  "View Plans": "योजनाएँ देखें",
  "Total Services": "कुल सेवाएँ",
  "Live Today": "आज लाइव",
  Categories: "श्रेणियाँ",
  "Hidden Fees": "छिपे शुल्क",
  "Start with the service you need today.":
    "आज जिस सेवा की ज़रूरत है, उसी से शुरुआत कीजिए।",
  "Read the page, see the fee, and send us the details. Nothing is charged until we have looked at your file and quoted you.":
    "पेज पढ़िए, शुल्क देखिए और विवरण भेज दीजिए। जब तक हम आपकी फ़ाइल देखकर कोटेशन न दे दें, कोई शुल्क नहीं लिया जाता।",

  /* ── Promotional banners ───────────────────────────────── */
  "Start a business": "व्यवसाय शुरू कीजिए",
  "Udyam registration, done properly": "उद्यम पंजीकरण, ठीक तरह से",
  "The government charges nothing for it. We charge ₹999 and make sure it is filed right the first time.":
    "सरकार इसके लिए कुछ नहीं लेती। हम ₹999 लेते हैं और यह सुनिश्चित करते हैं कि पहली ही बार में सही फाइल हो।",
  "Register your MSME": "अपना एमएसएमई पंजीकृत कराइए",
  "A GSTIN in your name in 7–10 days": "7–10 दिनों में आपके नाम पर जीएसटीआईएन",
  "We prepare the application, answer the department's queries, and explain what all fifteen digits mean.":
    "हम आवेदन तैयार करते हैं, विभाग के प्रश्नों का उत्तर देते हैं, और बताते हैं कि उन पंद्रह अंकों का मतलब क्या है।",
  "Start GST registration": "जीएसटी पंजीकरण शुरू करें",
  Membership: "सदस्यता",
  "Ten percent off every filing": "हर फाइलिंग पर दस प्रतिशत की छूट",
  "One membership covers every service on the site, for the whole year. No per-filing subscription.":
    "एक सदस्यता, साइट की हर सेवा पर, पूरे साल के लिए। हर फाइलिंग का अलग सब्सक्रिप्शन नहीं।",
  "See what it costs": "देखिए इसकी कीमत क्या है",
  "Openings matched to your city and trade": "आपके शहर और काम से मेल खाती नौकरियाँ",
  "Tell us your qualification and where you are, and the feed narrows to work you can actually take. Free, always.":
    "अपनी योग्यता और जगह बताइए, और फ़ीड सिमटकर वही काम दिखाएगी जो आप सचमुच कर सकते हैं। हमेशा नि:शुल्क।",
  "Browse jobs": "नौकरियाँ देखें",
  "PAN, TAN and DSC without the guesswork": "पैन, टैन और डीएससी — बिना अंदाज़े के",
  "Government fee and our fee, itemised separately, before you commit to anything.":
    "सरकारी शुल्क और हमारा शुल्क, अलग-अलग मदवार, किसी भी प्रतिबद्धता से पहले।",
  "See identity services": "पहचान सेवाएँ देखें",
  "Trademark & brand": "ट्रेडमार्क एवं ब्रांड",
  "Your name, protected in the right classes": "आपका नाम, सही वर्गों में सुरक्षित",
  "A search first, so you find out a mark is taken before you have printed it on anything.":
    "पहले खोज, ताकि पता चल जाए कि मार्क पहले से लिया जा चुका है — इससे पहले कि आप उसे कहीं छपवा लें।",
  "Protect your brand": "अपना ब्रांड सुरक्षित कीजिए",

  /* ── Live services and pricing ─────────────────────────── */
  "Aadhaar Services": "आधार सेवाएँ",
  "PAN Services": "पैन सेवाएँ",
  "MSME Udyam Registration": "एमएसएमई उद्यम पंजीकरण",
  "A GSTIN in your name, and someone who understands what the fifteen digits mean.":
    "आपके नाम पर एक जीएसटीआईएन, और कोई ऐसा जो समझता हो कि उन पंद्रह अंकों का मतलब क्या है।",
  "Corrections, updates and appointments — handled properly the first time.":
    "सुधार, अपडेट और अपॉइंटमेंट — पहली ही बार में ठीक से।",
  "New cards, corrections, and the Aadhaar link that stops your PAN going inoperative.":
    "नए कार्ड, सुधार, और वह आधार लिंक जो आपके पैन को निष्क्रिय होने से बचाता है।",
  "The certificate that unlocks collateral-free loans and tender access.":
    "वह प्रमाणपत्र जो बिना गारंटी के ऋण और टेंडर तक पहुँच खोल देता है।",
  Tax: "कर",
  "7–10 working days": "7–10 कार्य दिवस",
  "Appointment in 2–4 days": "2–4 दिनों में अपॉइंटमेंट",
  "Same day": "उसी दिन",
  "e-PAN in 48 hours": "48 घंटों में ई-पैन",
  Compliance: "अनुपालन",
  "Pay per filing": "प्रति फाइलिंग भुगतान",
  "Free to join": "जुड़ना नि:शुल्क",
  "per month, billed monthly": "प्रति माह, मासिक बिलिंग",
  "For a registered business with recurring filings.":
    "नियमित फाइलिंग वाले पंजीकृत व्यवसाय के लिए।",
  "For companies with payroll, statutory audits and a board.":
    "पेरोल, वैधानिक ऑडिट और बोर्ड वाली कंपनियों के लिए।",
  "No subscription. Pay only when you file something.":
    "कोई सब्सक्रिप्शन नहीं। जब कुछ फाइल करें, तभी भुगतान।",

  /* ── Catalogue: the seven groups ───────────────────────── */
  "Identity & KYC": "पहचान एवं केवाईसी",
  "Business Registration": "व्यवसाय पंजीकरण",
  "Tax & Filings": "कर एवं फाइलिंग",
  "Licences & Permits": "लाइसेंस एवं परमिट",
  "Intellectual Property": "बौद्धिक संपदा",
  "Labour & Payroll": "श्रम एवं पेरोल",
  "Legal Documents": "कानूनी दस्तावेज़",
  "The documents everything else is built on. Get these right and the rest of the paperwork stops bouncing.":
    "वे दस्तावेज़ जिन पर बाकी सब टिका है। ये सही हो जाएँ तो बाकी कागज़ लौटकर आना बंद हो जाते हैं।",
  "Choosing the wrong structure costs more to unwind than it does to set up. We start with which one you actually need.":
    "गलत ढाँचा चुनकर उसे बदलना, उसे बनाने से महँगा पड़ता है। हम इसी से शुरू करते हैं कि आपको असल में कौन-सा चाहिए।",
  "Registration is the easy half. Staying compliant month after month is where most businesses come unstuck.":
    "पंजीकरण तो आसान हिस्सा है। महीने-दर-महीने अनुपालन बनाए रखने में ही ज़्यादातर व्यवसाय उलझते हैं।",
  "Trading without the right licence is the kind of problem that arrives with an inspector rather than a letter.":
    "सही लाइसेंस के बिना कारोबार करना वह समस्या है जो चिट्ठी से नहीं, निरीक्षक के साथ आती है।",
  "A name you have not registered is a name someone else can register. Searching first costs a fraction of fighting later.":
    "जो नाम आपने पंजीकृत नहीं कराया, उसे कोई और करा सकता है। पहले खोज लेना, बाद में लड़ने के मुकाबले बहुत सस्ता है।",
  "The thresholds creep up on you. Most businesses cross into PF and ESI without noticing until a notice arrives.":
    "सीमाएँ चुपचाप पास आ जाती हैं। ज़्यादातर व्यवसाय पीएफ और ईएसआई के दायरे में तब तक पहुँच जाते हैं जब तक नोटिस नहीं आ जाता।",
  "Drafted properly, on the right stamp paper, and registered where registration is what makes it enforceable.":
    "ठीक से तैयार, सही स्टाम्प पेपर पर, और वहाँ पंजीकृत जहाँ पंजीकरण ही उसे लागू करने योग्य बनाता है।",

  /* ── Catalogue: service names ──────────────────────────── */
  "Digital Signature (DSC)": "डिजिटल हस्ताक्षर (डीएससी)",
  "Voter ID Assistance": "मतदाता पहचान पत्र सहायता",
  "Passport Assistance": "पासपोर्ट सहायता",
  "Private Limited Company": "प्राइवेट लिमिटेड कंपनी",
  "LLP Registration": "एलएलपी पंजीकरण",
  "One Person Company": "एक व्यक्ति कंपनी",
  "Partnership Firm": "साझेदारी फर्म",
  "Sole Proprietorship": "एकल स्वामित्व",
  "GST Returns": "जीएसटी रिटर्न",
  "GST Cancellation": "जीएसटी रद्दीकरण",
  "Income Tax Returns": "आयकर रिटर्न",
  "TDS Returns": "टीडीएस रिटर्न",
  "ROC Annual Filings": "आरओसी वार्षिक फाइलिंग",
  "TAN Registration": "टैन पंजीकरण",
  "FSSAI Food Licence": "एफएसएसएआई खाद्य लाइसेंस",
  "Trade Licence": "व्यापार लाइसेंस",
  "Shop & Establishment": "दुकान एवं स्थापना",
  "Drug Licence": "औषधि लाइसेंस",
  "Import Export Code": "आयात निर्यात कोड",
  "ISO Certification": "आईएसओ प्रमाणन",
  "Labour Licence": "श्रम लाइसेंस",
  "Trademark Objection Reply": "ट्रेडमार्क आपत्ति का उत्तर",
  "Copyright Registration": "कॉपीराइट पंजीकरण",
  "Design Registration": "डिज़ाइन पंजीकरण",
  "Patent Search": "पेटेंट खोज",
  "PF Registration": "पीएफ पंजीकरण",
  "ESI Registration": "ईएसआई पंजीकरण",
  "Professional Tax": "व्यवसाय कर",
  "Payroll Management": "पेरोल प्रबंधन",
  "Affidavit Drafting": "शपथपत्र तैयार करना",
  "Legal Notice": "कानूनी नोटिस",
  "Will Drafting": "वसीयत तैयार करना",
  "NOC Drafting": "एनओसी तैयार करना",

  /* ── Documents list ────────────────────────────────────── */
  "Identity & PAN": "पहचान एवं पैन",
  "Business & Tax": "व्यवसाय एवं कर",
  "Government Certificates": "सरकारी प्रमाणपत्र",
  "Legal & Agreements": "कानूनी एवं अनुबंध",
  "PAN Card Correction": "पैन कार्ड सुधार",
  "Passport Application": "पासपोर्ट आवेदन",
  "Passport Reissue": "पासपोर्ट पुनर्निर्गम",
  "Character Certificate": "चरित्र प्रमाणपत्र",
  "Domicile Certificate": "निवास प्रमाणपत्र",
  "Marriage Certificate": "विवाह प्रमाणपत्र",
  "Legal Heir Certificate": "वारिस प्रमाणपत्र",
  "OBC Non-Creamy Layer Certificate": "ओबीसी नॉन-क्रीमी लेयर प्रमाणपत्र",
  "Name Change Affidavit": "नाम परिवर्तन शपथपत्र",
  "Affidavit Preparation": "शपथपत्र तैयारी",
  "Power of Attorney": "मुख्तारनामा",
  "Leave & License Agreement": "लीव एंड लाइसेंस अनुबंध",
  "Will Preparation": "वसीयत तैयारी",
  "Udyam/MSME Registration": "उद्यम / एमएसएमई पंजीकरण",
  "Import Export (IEC)": "आयात निर्यात (आईईसी)",
  "ROC Filings": "आरओसी फाइलिंग",
  "Payroll & PF/ESI": "पेरोल एवं पीएफ/ईएसआई",

  /* ── Sub-tabs across the tab bar and the drawer ────────── */
  Overview: "अवलोकन",
  "Who we are": "हम कौन हैं",
  "How we work": "हम कैसे काम करते हैं",
  "What we are not": "हम क्या नहीं हैं",
  "Our principles": "हमारे सिद्धांत",
  "About LAWFIC": "LAWFIC के बारे में",
  "About the club": "क्लब के बारे में",
  "About": "परिचय",
  "Add money": "पैसे जोड़ें",
  "Advertise on LAWFIC": "LAWFIC पर विज्ञापन दें",
  Advisory: "परामर्श",
  "Agent network": "एजेंट नेटवर्क",
  "Ask for help": "सहायता माँगें",
  "Become a partner": "साझेदार बनें",
  Benefits: "लाभ",
  Blogs: "ब्लॉग",
  "Brand strategy": "ब्रांड रणनीति",
  "Business kits": "बिज़नेस किट",
  "Call us": "हमें कॉल करें",
  "Career paths": "करियर के रास्ते",
  Certifications: "प्रमाणन",
  "Channel partners": "चैनल पार्टनर",
  Coaching: "कोचिंग",
  "Code of conduct": "आचार संहिता",
  Content: "कंटेंट",
  Copyright: "कॉपीराइट",
  Coverage: "कवरेज",
  "Customer promise": "ग्राहक वादा",
  "Customise your wallet": "अपना वॉलेट अनुकूलित करें",
  Education: "शिक्षा",
  Engineering: "इंजीनियरिंग",
  Entertainment: "मनोरंजन",
  Events: "आयोजन",
  FAQs: "सामान्य प्रश्न",
  "Fresher openings": "फ्रेशर के लिए अवसर",
  Funding: "फंडिंग",
  "Get in touch": "संपर्क करें",
  "Gift cards": "गिफ्ट कार्ड",
  Gift: "उपहार",
  "Government jobs": "सरकारी नौकरियाँ",
  "Grievance officer": "शिकायत अधिकारी",
  Guides: "गाइड",
  Home: "होम",
  "Idea to business": "विचार से व्यवसाय तक",
  "Instant Help": "तुरंत सहायता",
  Interviews: "साक्षात्कार",
  Investment: "निवेश",
  Jobs: "नौकरियाँ",
  "Latest posts": "नवीनतम पोस्ट",
  Law: "कानून",
  "Lawfic Club": "लॉफिक क्लब",
  "Live chat": "लाइव चैट",
  "Local listings": "स्थानीय लिस्टिंग",
  "Logo creation": "लोगो निर्माण",
  "MSME / Udyam": "एमएसएमई / उद्यम",
  "Management (MBA)": "प्रबंधन (एमबीए)",
  Media: "मीडिया",
  "Media enquiries": "मीडिया पूछताछ",
  Medical: "चिकित्सा",
  Mentorship: "मार्गदर्शन",
  Merchandise: "मर्चेंडाइज़",
  "Mutual funds": "म्यूचुअल फंड",
  "My Money": "मेरा पैसा",
  News: "समाचार",
  "Our Store": "हमारा स्टोर",
  "Our standards": "हमारे मानक",
  "Our work": "हमारा काम",
  Partner: "साझेदार",
  Partnership: "साझेदारी",
  Passport: "पासपोर्ट",
  Plans: "योजनाएँ",
  "Post a vacancy": "रिक्ति प्रकाशित करें",
  Press: "प्रेस",
  Pricing: "मूल्य",
  "Private Limited": "प्राइवेट लिमिटेड",
  Profession: "व्यवसाय",
  Proprietorship: "स्वामित्व",
  Rates: "दरें",
  "Referral program": "रेफ़रल कार्यक्रम",
  "Resume help": "रिज़्यूमे सहायता",
  Skills: "कौशल",
  Social: "सामाजिक",
  "Special offers": "विशेष ऑफ़र",
  Startup: "स्टार्टअप",
  Stationery: "स्टेशनरी",
  Stocks: "शेयर",
  "Study materials": "अध्ययन सामग्री",
  "Submit an idea": "विचार भेजें",
  "Success stories": "सफलता की कहानियाँ",
  Trademark: "ट्रेडमार्क",
  Transactions: "लेन-देन",
  "Visa help": "वीज़ा सहायता",
  Volunteer: "स्वयंसेवा",
  Vouchers: "वाउचर",
  "Wallet balance": "वॉलेट बैलेंस",
  Wallet: "वॉलेट",
  "What this is": "यह क्या है",
  Workshops: "कार्यशालाएँ",
  "Your Add": "आपका विज्ञापन",
  "Your Career": "आपका करियर",
  "Your Idea": "आपका विचार",
  "Your filings": "आपकी फाइलिंग",
  Admission: "प्रवेश",
  Contact: "संपर्क",
  Document: "दस्तावेज़",
  "Aakhri Umeed": "आख़िरी उम्मीद",

  /* ── Header, ticker, footer ────────────────────────────── */
  "Pan India Service": "पूरे भारत में सेवा",
  "Easy, Fast & Reasonable Price": "आसान, तेज़ और वाजिब दाम",
  "Guranteed Money Back": "पैसे वापसी की गारंटी",
  "Your All information In One Place": "आपकी सारी जानकारी एक ही जगह",
  "Attractive Dashboard": "आकर्षक डैशबोर्ड",
  "Partner With Us & Fixed Earn": "हमारे साझेदार बनिए और नियमित कमाइए",
  "LAWFIC service highlights": "LAWFIC सेवा की मुख्य बातें",
  "Pan India Best & Quality Service.": "पूरे भारत में सर्वोत्तम और गुणवत्तापूर्ण सेवा।",
  Help: "सहायता",
  Store: "स्टोर",
  Theme: "थीम",
  "My money": "मेरा पैसा",
  "Post ad": "विज्ञापन दें",
  Suggestion: "सुझाव",
  "My bag": "मेरा बैग",
  "Very Good Morning": "सुप्रभात",
  "Very good morning": "सुप्रभात",
  "Good afternoon": "नमस्कार",
  "Good evening": "शुभ संध्या",
  "Good night": "शुभ रात्रि",
  "About us": "हमारे बारे में",
  "Registered name": "पंजीकृत नाम",
  "Registered office": "पंजीकृत कार्यालय",
  "Your account": "आपका खाता",
  "Account and sign in": "खाता और साइन इन",
  "Sign in": "साइन इन करें",
  Account: "खाता",
  /* ── Alt text and controls on the carousel ─────────────── */
  "The glass display counter of a small shop": "एक छोटी दुकान का शीशे का काउंटर",
  "A desk with a calculator, reading glasses and printed statements":
    "एक मेज़ पर कैलकुलेटर, पढ़ने का चश्मा और छपे हुए विवरण",
  "An empty meeting table in a quiet office": "शांत दफ़्तर में एक खाली बैठक की मेज़",
  "Rows of empty desks in an open-plan workplace":
    "खुले दफ़्तर में खाली मेज़ों की कतारें",
  "A stack of documents squared up on a wooden table":
    "लकड़ी की मेज़ पर करीने से रखे दस्तावेज़ों का ढेर",
  "A designer's desk with printed brand material laid out":
    "डिज़ाइनर की मेज़ पर फैली हुई छपी ब्रांड सामग्री",
  "LAWFIC highlights": "LAWFIC की मुख्य बातें",
  Show: "दिखाएँ",
  /* ── Footer ────────────────────────────────────────────── */
  "Registrations, licences and compliance for Indian businesses — prepared properly, priced in the open.":
    "भारतीय व्यवसायों के लिए पंजीकरण, लाइसेंस और अनुपालन — ठीक से तैयार, कीमत खुले तौर पर।",
  Support: "सहायता",
  "Monday to Saturday, 10:00–19:00 IST": "सोमवार से शनिवार, 10:00–19:00 IST",
  "Contact & grievances": "संपर्क एवं शिकायतें",
  more: "और",
  Company: "कंपनी",
  Important: "महत्वपूर्ण",
  "LAWFIC is a private consultancy. We are not affiliated with UIDAI, the Income Tax Department, GSTN, FSSAI, the Ministry of Corporate Affairs or any other government body, and we are not a GST Suvidha Provider. Government fees are payable to the government and are always shown to you separately from our professional fee.":
    "LAWFIC एक निजी परामर्श संस्था है। हम UIDAI, आयकर विभाग, GSTN, FSSAI, कॉर्पोरेट कार्य मंत्रालय या किसी अन्य सरकारी निकाय से संबद्ध नहीं हैं, और न ही हम GST सुविधा प्रदाता हैं। सरकारी शुल्क सरकार को देय होते हैं और आपको हमारे व्यावसायिक शुल्क से हमेशा अलग दिखाए जाते हैं।",
  "Secured by TLS": "TLS द्वारा सुरक्षित",
  "Payments by": "भुगतान द्वारा",
  "Wallet is closed-loop": "वॉलेट क्लोज़्ड-लूप है",
  "Privacy Policy": "गोपनीयता नीति",
  "Refunds & Cancellation": "वापसी एवं रद्दीकरण",
  "Terms of Service": "सेवा की शर्तें",
  "Wallet Terms": "वॉलेट की शर्तें",
  "This page is translated for convenience. Where the wording differs, the English version governs.":
    "यह पेज सुविधा के लिए अनूदित है। शब्दों में अंतर होने पर अंग्रेज़ी संस्करण मान्य होगा।",
  /* ── Dropdowns and drawer ──────────────────────────────── */
  "This section is still being written.": "यह अनुभाग अभी तैयार किया जा रहा है।",
  Hide: "छिपाएँ",
  Sections: "अनुभाग",
  More: "और",
  /* ── The last few: ticker figures, wordmark, location box ─ */
  "24*7 Customer Service": "24*7 ग्राहक सेवा",
  "21000+ Proffessional Expert*": "21000+ पेशेवर विशेषज्ञ*",
  "1000+ Conecting Store*": "1000+ जुड़े हुए स्टोर*",
  "51000+ Service*": "51000+ सेवाएँ*",
  "100 % Safe & Secure Data": "100 % सुरक्षित डेटा",
  "Quality service with love": "गुणवत्तापूर्ण सेवा, प्रेम के साथ",
  India: "भारत",
  "Any city": "कोई भी शहर",
  "Choose a state first": "पहले राज्य चुनें",
  "Avatar artwork by Micah Lanier, licensed under":
    "अवतार चित्रांकन: Micah Lanier, लाइसेंस",
  /* ── Search ────────────────────────────────────────────── */
  All: "सभी",
  Service: "सेवा",
  Section: "अनुभाग",
  /* ── Two more on the action row ────────────────────────── */
  Wishlist: "इच्छा-सूची",
  Favourite: "पसंदीदा",
};

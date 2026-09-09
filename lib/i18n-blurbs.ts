/**
 * The one-line descriptions under every service and document.
 *
 * Kept apart from i18n-hi.ts and i18n-es.ts only because of where they show up.
 * Everything in those two files appears somewhere on a page a reader is looking
 * at; these appear underneath a search result and inside the catalogue listing,
 * which is why they were missed on the first pass — a sweep of the rendered home
 * page cannot see the contents of a dropdown that is closed.
 *
 * They are merged into the phrase tables in lib/i18n.ts, which is the one place
 * that assembles them, so a caller sees a single lookup and never has to know
 * which file a string came from.
 *
 * The blurbs describe what a filing IS, so they are the strings where a loose
 * translation does the most damage: "Basic, State and Central registration"
 * names the three FSSAI tiers and is not a list of adjectives, and "AOC-4,
 * MGT-7 and director KYC" are form numbers that stay form numbers. Where a line
 * is made of statutory names it is left as the names with the grammar around
 * them translated, and nothing else.
 */

export const hiBlurbs: Record<string, string> = {
  "9001, 14001 and 22000": "9001, 14001 और 22000",
  "A GSTIN in your name, start to finish": "आपके नाम पर जीएसटीआईएन, शुरू से अंत तक",
  "A GSTIN in your name, start to finish.": "आपके नाम पर जीएसटीआईएन, शुरू से अंत तक।",
  "A company structure for a single founder": "अकेले संस्थापक के लिए कंपनी का ढाँचा",
  "A licence agreement for renting without a tenancy.":
    "किरायेदारी बनाए बिना किराये पर देने का लाइसेंस अनुबंध।",
  "A new PAN, filed and issued as an e-PAN in about two days.":
    "नया पैन, फाइल किया गया और लगभग दो दिन में ई-पैन के रूप में जारी।",
  "A simple, valid will that says what you meant.":
    "एक सरल, वैध वसीयत जो वही कहे जो आपका आशय था।",
  "AOC-4, MGT-7 and director KYC": "AOC-4, MGT-7 और निदेशक केवाईसी",
  "Basic, State and Central registration": "बेसिक, राज्य और केंद्रीय पंजीकरण",
  "Brand name and logo protected across the correct classes.":
    "ब्रांड नाम और लोगो, सही वर्गों में सुरक्षित।",
  "Caste proof for reservations and welfare benefits.":
    "आरक्षण और कल्याणकारी लाभों के लिए जाति प्रमाण।",
  "Class 3 tokens for tenders and filings": "टेंडर और फाइलिंग के लिए क्लास 3 टोकन",
  "Closing a registration cleanly": "पंजीकरण को साफ़-सुथरे ढंग से बंद करना",
  "Collateral-free loans and tender access": "बिना गारंटी ऋण और टेंडर तक पहुँच",
  "Contract labour and migrant workers": "ठेका श्रमिक और प्रवासी कामगार",
  "Corrections, updates and appointments": "सुधार, अपडेट और अपॉइंटमेंट",
  "Corrections, updates and appointments, prepared so the visit works first time.":
    "सुधार, अपडेट और अपॉइंटमेंट — इस तरह तैयार कि पहली ही यात्रा में काम बन जाए।",
  "Court or registrar marriage certificate for official use.":
    "सरकारी उपयोग के लिए न्यायालय या रजिस्ट्रार विवाह प्रमाणपत्र।",
  "Deed drafting and registration": "विलेख तैयार करना और पंजीकरण",
  "Drafted, stamped and registered for tenancies.":
    "किरायेदारी के लिए तैयार, स्टाम्प किया और पंजीकृत।",
  "Drafted, stamped and registered": "तैयार, स्टाम्प किया और पंजीकृत",
  "EPFO registration and monthly ECR": "ईपीएफओ पंजीकरण और मासिक ईसीआर",
  "ESIC registration and contributions": "ईएसआईसी पंजीकरण और अंशदान",
  "Economically Weaker Sections certificate for 10% reservation.":
    "10% आरक्षण के लिए आर्थिक रूप से कमज़ोर वर्ग का प्रमाणपत्र।",
  "Fixing a name, date of birth or address mismatch on an existing PAN.":
    "मौजूदा पैन पर नाम, जन्मतिथि या पते की गड़बड़ी ठीक करना।",
  "Food business licence — Basic, State and Central.":
    "खाद्य व्यवसाय लाइसेंस — बेसिक, राज्य और केंद्रीय।",
  "For anyone required to deduct TDS": "उन सबके लिए जिन्हें टीडीएस काटना आवश्यक है",
  "Form filling, appointments and police verification":
    "फ़ॉर्म भरना, अपॉइंटमेंट और पुलिस सत्यापन",
  "Fresh passport applications — form, documents and appointments.":
    "नए पासपोर्ट आवेदन — फ़ॉर्म, दस्तावेज़ और अपॉइंटमेंट।",
  "GSTR-1 and 3B, filed monthly": "GSTR-1 और 3B, हर महीने फाइल",
  "General and special authority drafted and notarised.":
    "सामान्य और विशेष अधिकार, तैयार और नोटरीकृत।",
  "Household income proof used for scholarships and welfare schemes.":
    "छात्रवृत्ति और कल्याण योजनाओं में उपयोग होने वाला पारिवारिक आय प्रमाण।",
  "Incorporation, DIN, MOA and AOA": "निगमन, डीआईएन, एमओए और एओए",
  "Landlord, society and employer consents": "मकान मालिक, सोसाइटी और नियोक्ता की सहमति",
  "Limited liability without company compliance":
    "कंपनी अनुपालन के बोझ के बिना सीमित दायित्व",
  "Municipal permission to operate": "कारोबार चलाने की नगरपालिका अनुमति",
  "Name change, income, residence and more": "नाम परिवर्तन, आय, निवास और अन्य",
  "New cards, corrections and Aadhaar linking": "नए कार्ड, सुधार और आधार लिंकिंग",
  "New enrolment, corrections and transfers": "नया नामांकन, सुधार और स्थानांतरण",
  "Non-Creamy Layer certificate for OBC reservations.":
    "ओबीसी आरक्षण के लिए नॉन-क्रीमी लेयर प्रमाणपत्र।",
  "Prior-art search before you file": "फाइल करने से पहले पूर्व-कला की खोज",
  "Protecting how a product looks": "उत्पाद की बनावट की सुरक्षा",
  "Quarterly filing and Form 16": "तिमाही फाइलिंग और फ़ॉर्म 16",
  "Recovery, breach and cease-and-desist": "वसूली, उल्लंघन और रोक-सूचना",
  "Registration and certified copies for succession and insurance claims.":
    "उत्तराधिकार और बीमा दावों के लिए पंजीकरण और प्रमाणित प्रतियाँ।",
  "Registration and copies to prove identity, age and parentage.":
    "पहचान, आयु और माता-पिता सिद्ध करने के लिए पंजीकरण और प्रतियाँ।",
  "Renewal and reissue before expiry so your travel plans stay intact.":
    "समाप्ति से पहले नवीनीकरण और पुनर्निर्गम, ताकि आपकी यात्रा की योजना बनी रहे।",
  "Required before your first shipment": "आपकी पहली खेप से पहले आवश्यक",
  "Responding to an examination report": "परीक्षा रिपोर्ट का उत्तर देना",
  "Retail and wholesale pharmacy": "खुदरा और थोक फ़ार्मेसी",
  "Salaried, business and presumptive": "वेतनभोगी, व्यवसाय और अनुमानित",
  "Salary processing, payslips and compliance": "वेतन प्रसंस्करण, पेस्लिप और अनुपालन",
  "Search, filing and class selection": "खोज, फाइलिंग और वर्ग का चयन",
  "Simple wills and registration": "सरल वसीयत और पंजीकरण",
  "Software, artistic and literary work": "सॉफ़्टवेयर, कलात्मक और साहित्यिक कृति",
  "State domicile proof for education and quota benefits.":
    "शिक्षा और कोटा लाभ के लिए राज्य निवास प्रमाण।",
  "State registration and returns": "राज्य पंजीकरण और रिटर्न",
  "Succession proof used to transfer assets after death.":
    "मृत्यु के बाद संपत्ति हस्तांतरण के लिए उत्तराधिकार प्रमाण।",
  "Sworn statements for name change, income and residence.":
    "नाम परिवर्तन, आय और निवास के लिए शपथपूर्वक कथन।",
  "The affidavit that begins a legal name-change process.":
    "वह शपथपत्र जिससे कानूनी नाम-परिवर्तन की प्रक्रिया शुरू होती है।",
  "The certificate for collateral-free loans and tenders.":
    "बिना गारंटी ऋण और टेंडर के लिए प्रमाणपत्र।",
  "The lightest way to start trading": "कारोबार शुरू करने का सबसे हल्का रास्ता",
  "The registration most landlords ask for": "वह पंजीकरण जो अधिकतर मकान मालिक माँगते हैं",
  "Verification of conduct, often needed for jobs and abroad admissions.":
    "चरित्र सत्यापन, जो अक्सर नौकरी और विदेश में प्रवेश के लिए आवश्यक होता है।",
};

export const esBlurbs: Record<string, string> = {
  "9001, 14001 and 22000": "9001, 14001 y 22000",
  "A GSTIN in your name, start to finish": "Un GSTIN a tu nombre, de principio a fin",
  "A GSTIN in your name, start to finish.": "Un GSTIN a tu nombre, de principio a fin.",
  "A company structure for a single founder": "Una forma societaria para un único fundador",
  "A licence agreement for renting without a tenancy.":
    "Un contrato de cesión de uso para alquilar sin constituir arrendamiento.",
  "A new PAN, filed and issued as an e-PAN in about two days.":
    "Un PAN nuevo, presentado y emitido como e-PAN en unos dos días.",
  "A simple, valid will that says what you meant.":
    "Un testamento sencillo y válido que dice lo que querías decir.",
  "AOC-4, MGT-7 and director KYC": "AOC-4, MGT-7 y KYC de administradores",
  "Basic, State and Central registration": "Registro Basic, State y Central",
  "Brand name and logo protected across the correct classes.":
    "Nombre de marca y logotipo protegidos en las clases correctas.",
  "Caste proof for reservations and welfare benefits.":
    "Acreditación de casta para cupos y ayudas sociales.",
  "Class 3 tokens for tenders and filings":
    "Certificados de clase 3 para licitaciones y presentaciones",
  "Closing a registration cleanly": "Dar de baja un registro sin cabos sueltos",
  "Collateral-free loans and tender access": "Créditos sin aval y acceso a licitaciones",
  "Contract labour and migrant workers": "Trabajo subcontratado y trabajadores migrantes",
  "Corrections, updates and appointments": "Correcciones, actualizaciones y citas",
  "Corrections, updates and appointments, prepared so the visit works first time.":
    "Correcciones, actualizaciones y citas, preparadas para que la visita salga bien a la primera.",
  "Court or registrar marriage certificate for official use.":
    "Certificado de matrimonio judicial o del registro, para uso oficial.",
  "Deed drafting and registration": "Redacción e inscripción de escrituras",
  "Drafted, stamped and registered for tenancies.":
    "Redactado, timbrado e inscrito para arrendamientos.",
  "Drafted, stamped and registered": "Redactado, timbrado e inscrito",
  "EPFO registration and monthly ECR": "Alta en el EPFO y ECR mensual",
  "ESIC registration and contributions": "Alta en el ESIC y cotizaciones",
  "Economically Weaker Sections certificate for 10% reservation.":
    "Certificado de Economically Weaker Sections para el cupo del 10 %.",
  "Fixing a name, date of birth or address mismatch on an existing PAN.":
    "Corregir un nombre, una fecha de nacimiento o una dirección que no cuadran en un PAN existente.",
  "Food business licence — Basic, State and Central.":
    "Licencia alimentaria — Basic, State y Central.",
  "For anyone required to deduct TDS": "Para quien esté obligado a practicar retención (TDS)",
  "Form filling, appointments and police verification":
    "Cumplimentación del formulario, citas y verificación policial",
  "Fresh passport applications — form, documents and appointments.":
    "Solicitudes de pasaporte nuevo — formulario, documentos y citas.",
  "GSTR-1 and 3B, filed monthly": "GSTR-1 y 3B, presentados cada mes",
  "General and special authority drafted and notarised.":
    "Poderes generales y especiales redactados y notariados.",
  "Household income proof used for scholarships and welfare schemes.":
    "Justificante de renta familiar para becas y programas de ayudas.",
  "Incorporation, DIN, MOA and AOA": "Constitución, DIN, MOA y AOA",
  "Landlord, society and employer consents":
    "Consentimientos del propietario, la comunidad y la empresa",
  "Limited liability without company compliance":
    "Responsabilidad limitada sin las obligaciones de una sociedad",
  "Municipal permission to operate": "Autorización municipal para operar",
  "Name change, income, residence and more": "Cambio de nombre, ingresos, residencia y más",
  "New cards, corrections and Aadhaar linking":
    "Tarjetas nuevas, correcciones y vinculación con Aadhaar",
  "New enrolment, corrections and transfers": "Alta nueva, correcciones y traslados",
  "Non-Creamy Layer certificate for OBC reservations.":
    "Certificado Non-Creamy Layer para los cupos OBC.",
  "Prior-art search before you file": "Búsqueda de estado de la técnica antes de presentar",
  "Protecting how a product looks": "Proteger el aspecto de un producto",
  "Quarterly filing and Form 16": "Presentación trimestral y Formulario 16",
  "Recovery, breach and cease-and-desist":
    "Reclamación de deudas, incumplimiento y requerimiento de cese",
  "Registration and certified copies for succession and insurance claims.":
    "Inscripción y copias certificadas para sucesiones y reclamaciones de seguros.",
  "Registration and copies to prove identity, age and parentage.":
    "Inscripción y copias para acreditar identidad, edad y filiación.",
  "Renewal and reissue before expiry so your travel plans stay intact.":
    "Renovación y reexpedición antes de que caduque, para que tus planes de viaje sigan en pie.",
  "Required before your first shipment": "Obligatorio antes de tu primer envío",
  "Responding to an examination report": "Responder a un informe de examen",
  "Retail and wholesale pharmacy": "Farmacia minorista y mayorista",
  "Salaried, business and presumptive":
    "Rendimientos del trabajo, de actividad y en estimación objetiva",
  "Salary processing, payslips and compliance":
    "Cálculo de nóminas, recibos y obligaciones legales",
  "Search, filing and class selection": "Búsqueda, presentación y elección de clases",
  "Simple wills and registration": "Testamentos sencillos e inscripción",
  "Software, artistic and literary work": "Obra informática, artística y literaria",
  "State domicile proof for education and quota benefits.":
    "Acreditación de residencia en el estado para educación y cupos.",
  "State registration and returns": "Registro estatal y declaraciones",
  "Succession proof used to transfer assets after death.":
    "Acreditación de sucesión para transmitir bienes tras un fallecimiento.",
  "Sworn statements for name change, income and residence.":
    "Declaraciones juradas de cambio de nombre, ingresos y residencia.",
  "The affidavit that begins a legal name-change process.":
    "La declaración jurada con la que arranca un cambio legal de nombre.",
  "The certificate for collateral-free loans and tenders.":
    "El certificado para créditos sin aval y licitaciones.",
  "The lightest way to start trading": "La forma más ligera de empezar a operar",
  "The registration most landlords ask for": "El registro que piden casi todos los propietarios",
  "Verification of conduct, often needed for jobs and abroad admissions.":
    "Certificado de conducta, habitual para empleos y admisiones en el extranjero.",
};

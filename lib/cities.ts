/**
 * Cities, by state, for the location control in the header.
 *
 * WHY A LIST AND NOT A FREE-TEXT BOX
 *
 * The city is the second half of "where am I filing", and the first half —
 * the state — already changes what a customer needs and what it costs (see
 * `states.ts`). The city narrows it again: trade licences and shops-and-
 * establishment registration are issued by the municipal body, so Pune and
 * Nagpur are different desks inside one state.
 *
 * A typed box would collect "Bengaluru", "Bangalore", "banglore" and
 * "Bengaluru " as four different places, and nothing downstream could group
 * them. A list of the places that actually generate filings is worth more than
 * completeness here: this is a preference for tailoring what is shown, not an
 * address, so a customer in a town that is not listed picks the nearest city
 * and loses nothing.
 *
 * Held on the device with the state, and sent nowhere. A city is a weak
 * identifier but an identifier nonetheless.
 */

export const CITIES: Record<string, string[]> = {
  AN: ["Port Blair"],
  AP: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool"],
  AR: ["Itanagar", "Naharlagun", "Pasighat"],
  AS: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
  BR: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia"],
  CH: ["Chandigarh"],
  CT: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  DH: ["Daman", "Silvassa", "Diu"],
  DL: ["New Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh", "Pitampura"],
  GA: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  GJ: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar", "Jamnagar"],
  HP: ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Baddi", "Una"],
  HR: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar", "Karnal", "Rohtak"],
  JH: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
  JK: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"],
  KA: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Davangere", "Ballari"],
  KL: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur"],
  LA: ["Leh", "Kargil"],
  LD: ["Kavaratti"],
  MH: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Navi Mumbai", "Kolhapur"],
  ML: ["Shillong", "Tura"],
  MN: ["Imphal", "Thoubal"],
  MP: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar"],
  MZ: ["Aizawl", "Lunglei"],
  NL: ["Kohima", "Dimapur"],
  OR: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
  PB: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
  PY: ["Puducherry", "Karaikal"],
  RJ: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar"],
  SK: ["Gangtok", "Namchi"],
  TG: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  TN: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode"],
  TR: ["Agartala", "Udaipur"],
  UP: ["Lucknow", "Kanpur", "Ghaziabad", "Noida", "Agra", "Varanasi", "Prayagraj", "Meerut"],
  UT: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh"],
  WB: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Darjeeling"],
};

export function citiesFor(regionCode: string | null): string[] {
  if (!regionCode) return [];
  return CITIES[regionCode] ?? [];
}

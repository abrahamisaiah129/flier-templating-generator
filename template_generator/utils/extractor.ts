import { PropertyData, AppSettings } from "../types/propkit";
import { EMPTY_FIELD, FIXED_CONTACT } from "./constants";

export function abbreviateNumber(num: number | null | undefined): string | null {
  if (num === null || num === undefined || isNaN(num)) return null;
  const n = Number(num);
  const abs = Math.abs(n);
  if (abs >= 1e9) {
    const v = n / 1e9;
    return (Number.isInteger(v) ? v : v.toFixed(1)) + "B";
  }
  if (abs >= 1e6) {
    const v = n / 1e6;
    return (Number.isInteger(v) ? v : v.toFixed(1)) + "M";
  }
  if (abs >= 1e3) {
    const v = Math.round(n / 1e3);
    return v + "K";
  }
  return String(Math.round(n));
}

export function formatNaira(priceNGN: number | null | undefined): string | null {
  const abbrev = abbreviateNumber(priceNGN);
  if (!abbrev) return null;
  return "N" + abbrev;
}

export function formatUsd(priceNGN: number | null | undefined, rate: number): string | null {
  if (!priceNGN || !rate) return null;
  const usd = priceNGN / rate;
  const abbrev = abbreviateNumber(usd);
  if (!abbrev) return null;
  return abbrev + " USD";
}

export function formatNairaFull(priceNGN: number | null | undefined): string {
  if (priceNGN === null || priceNGN === undefined) return EMPTY_FIELD;
  return "₦" + Number(priceNGN).toLocaleString("en-NG");
}

export function buildDescriptionLines(data: PropertyData): string[] {
  const lines: string[] = [];
  if (data.bedrooms) lines.push(`${data.bedrooms} BEDROOM`);
  if (data.propertyType && data.propertyType !== EMPTY_FIELD) {
    lines.push(data.propertyType.toUpperCase());
  }
  const featureText = (data.features || []).join(" ").toLowerCase();
  if (featureText.includes("bq") || featureText.includes("boys quarter")) {
    lines.push("WITH BQ");
  }
  return lines.slice(0, 3);
}

export function formatPropertyTypeLines(
  propertyType: string,
  features: string[] = []
): { titleLines: string[]; highlightLines: string[] } {
  const type =
    propertyType && propertyType !== EMPTY_FIELD
      ? propertyType.toUpperCase().trim()
      : "EXCLUSIVE PROPERTY";

  // Clean split for duplex types so text never overflows width
  let titleLines: string[] = [];
  if (type.includes("SEMI-DETACHED")) {
    titleLines = ["SEMI-DETACHED", type.replace(/SEMI-DETACHED/gi, "").trim() || "DUPLEX"];
  } else if (type.includes("FULLY DETACHED")) {
    titleLines = ["FULLY DETACHED", type.replace(/FULLY DETACHED/gi, "").trim() || "DUPLEX"];
  } else if (type.includes("TERRACE")) {
    titleLines = ["TERRACE", type.replace(/TERRACE/gi, "").trim() || "DUPLEX"];
  } else if (type.includes("PENTHOUSE")) {
    titleLines = ["PENTHOUSE", type.replace(/PENTHOUSE/gi, "").trim() || "APARTMENT"];
  } else if (type.includes("MAISONETTE")) {
    titleLines = ["MAISONETTE", type.replace(/MAISONETTE/gi, "").trim() || "APARTMENT"];
  } else if (type.length > 18) {
    const words = type.split(" ");
    const mid = Math.ceil(words.length / 2);
    titleLines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  } else {
    titleLines = [type];
  }

  // Clean, punchy highlight feature bullets
  const highlightLines: string[] = [];
  const featureStr = (features || []).join(" ").toLowerCase();
  if (featureStr.includes("bq") || featureStr.includes("boys quarter")) {
    highlightLines.push("• WITH PRIVATE BQ");
  }
  if (featureStr.includes("pool") || featureStr.includes("swimming")) {
    highlightLines.push("• SWIMMING POOL");
  } else if (featureStr.includes("gym")) {
    highlightLines.push("• FULLY EQUIPPED GYM");
  } else if (featureStr.includes("cinema")) {
    highlightLines.push("• PRIVATE CINEMA");
  } else if (featureStr.includes("waterfront")) {
    highlightLines.push("• WATERFRONT VIEW");
  } else if (featureStr.includes("elevator") || featureStr.includes("lift")) {
    highlightLines.push("• WITH ELEVATOR");
  } else if (featureStr.includes("24hr") || featureStr.includes("power")) {
    highlightLines.push("• 24HR POWER");
  }

  return {
    titleLines: titleLines.slice(0, 2),
    highlightLines: highlightLines.slice(0, 2),
  };
}

// Deterministic heuristic extractor for property briefs
export function extractDetailsLocally(briefText: string): PropertyData {
  const text = briefText.trim();
  const lower = text.toLowerCase();
  const reviewFlags: string[] = [];

  // 1. Bedrooms
  let bedrooms: number | null = null;
  const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom|bdr|bdrm|br)\b/i);
  if (bedMatch) {
    bedrooms = parseInt(bedMatch[1], 10);
  } else {
    reviewFlags.push("bedrooms");
  }

  // 2. Bathrooms
  let bathrooms: number | null = null;
  const bathMatch = text.match(/(\d+)\s*(?:bath|bathroom|bthr)\b/i);
  if (bathMatch) {
    bathrooms = parseInt(bathMatch[1], 10);
  }

  // 3. Price (NGN)
  let priceNGN: number | null = null;
  // Patterns like 250M, 250 million, 1.4B, 85m, N250,000,000, ₦120M
  const billionMatch = text.match(/(?:(?:naira|ngn|₦|n)?\s*)(\d+(?:\.\d+)?)\s*(?:b|billion)\b/i);
  const millionMatch = text.match(/(?:(?:naira|ngn|₦|n)?\s*)(\d+(?:\.\d+)?)\s*(?:m|million)\b/i);
  const exactPriceMatch = text.match(/(?:(?:naira|ngn|₦|n)\s*)(\d{1,3}(?:,\d{3})+)/i);

  if (billionMatch) {
    priceNGN = Math.round(parseFloat(billionMatch[1]) * 1e9);
  } else if (millionMatch) {
    priceNGN = Math.round(parseFloat(millionMatch[1]) * 1e6);
  } else if (exactPriceMatch) {
    priceNGN = parseInt(exactPriceMatch[1].replace(/,/g, ""), 10);
  } else {
    const rawNumMatch = text.match(/(?:price|asking|amount|cost)[:\s]+(?:naira|ngn|₦|n)?\s*(\d[\d,.]*)/i);
    if (rawNumMatch) {
      const val = parseFloat(rawNumMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) priceNGN = val < 10000 ? Math.round(val * 1e6) : Math.round(val);
    }
  }

  if (!priceNGN) {
    reviewFlags.push("priceNGN");
  }

  // 4. Property Type
  let propertyType = EMPTY_FIELD;
  if (/semi[\s-]?detached/i.test(text)) {
    propertyType = "Semi-Detached Duplex";
  } else if (/fully[\s-]?detached|detached\s*duplex|mansion/i.test(text)) {
    propertyType = "Fully Detached Duplex";
  } else if (/terrace/i.test(text)) {
    propertyType = "Terrace Duplex";
  } else if (/penthouse/i.test(text)) {
    propertyType = "Penthouse";
  } else if (/maisonette/i.test(text)) {
    propertyType = "Maisonette";
  } else if (/apartment|flat/i.test(text)) {
    propertyType = "Apartment";
  } else if (/bungalow/i.test(text)) {
    propertyType = "Bungalow";
  } else if (/duplex/i.test(text)) {
    propertyType = "Duplex";
  }

  // 5. Location
  let location = EMPTY_FIELD;
  const knownLocations = [
    "Banana Island",
    "Ikoyi",
    "Victoria Island",
    "VI",
    "Lekki Phase 1",
    "Lekki 1",
    "Ikate",
    "Chevron",
    "Osapa London",
    "Osapa",
    "Agungi",
    "Oral",
    "VGC",
    "Victoria Garden City",
    "Ajah",
    "Sangotedo",
    "Ibeju Lekki",
    "Epe",
    "Ikeja GRA",
    "Ikeja",
    "Magodo",
    "Surulere",
    "Yaba",
    "Maitama",
    "Asokoro",
    "Guzape",
    "Wuse",
    "Gwarinpa",
    "Abuja",
  ];

  for (const loc of knownLocations) {
    const re = new RegExp(`\\b${loc}\\b`, "i");
    if (re.test(text)) {
      location = loc;
      if (lower.includes("lekki") && !loc.toLowerCase().includes("lekki") && loc !== "Banana Island" && loc !== "Ikoyi") {
        location = `${loc}, Lekki`;
      }
      break;
    }
  }

  if (location === EMPTY_FIELD) {
    const locInMatch = text.match(/(?:in|at|loc|location)[:\s]+([A-Za-z0-9\s,]{3,30})/i);
    if (locInMatch) {
      location = locInMatch[1].split(/[\n,.]/)[0].trim();
    } else {
      reviewFlags.push("location");
    }
  }

  // 6. Documentation
  let documentation = EMPTY_FIELD;
  if (/governor'?s\s*consent|gov\s*consent/i.test(text)) {
    documentation = "Governor's Consent";
  } else if (/federal\s*c\s*of\s*o/i.test(text)) {
    documentation = "Federal C of O";
  } else if (/c\s*of\s*o|certificate\s*of\s*occupancy/i.test(text)) {
    documentation = "Certificate of Occupancy (C of O)";
  } else if (/deed\s*of\s*assignment/i.test(text)) {
    documentation = "Deed of Assignment";
  } else if (/gazette/i.test(text)) {
    documentation = "Gazette";
  } else if (/r\s*of\s*o|right\s*of\s*occupancy/i.test(text)) {
    documentation = "Right of Occupancy";
  } else {
    reviewFlags.push("documentation");
  }

  // 7. Furnished
  let furnished: boolean | null = null;
  if (/fully\s*furnished/i.test(text)) {
    furnished = true;
  } else if (/unfurnished/i.test(text)) {
    furnished = false;
  } else if (/furnished/i.test(text)) {
    furnished = true;
  }

  // 8. Features
  const featureKeywords = [
    { key: "BQ", label: "BQ" },
    { key: "swimming pool|pool", label: "Swimming Pool" },
    { key: "gym", label: "Gym" },
    { key: "elevator|lift", label: "Elevator" },
    { key: "fitted kitchen", label: "Fitted Kitchen" },
    { key: "cinema", label: "Private Cinema" },
    { key: "cctv", label: "CCTV" },
    { key: "24hr power|24\/7 power|constant power", label: "24hr Power" },
    { key: "water treatment", label: "Water Treatment" },
    { key: "waterfront", label: "Waterfront" },
    { key: "security", label: "24hr Security" },
  ];

  const features: string[] = [];
  for (const { key, label } of featureKeywords) {
    if (new RegExp(key, "i").test(text)) {
      features.push(label);
    }
  }

  // Title synthesis
  const titleBed = bedrooms ? `${bedrooms} Bedroom ` : "";
  const titleType = propertyType !== EMPTY_FIELD ? propertyType : "Property";
  const titleLoc = location !== EMPTY_FIELD ? ` in ${location}` : "";
  const propertyTitle = `${titleBed}${titleType}${titleLoc}`.trim() || "Modern Property";

  return {
    propertyTitle,
    propertyType,
    location,
    bedrooms,
    bathrooms,
    priceNGN,
    furnished,
    documentation,
    description: text.slice(0, 300),
    features,
    reviewFlags,
  };
}

export function generateCaption(
  data: PropertyData,
  template: string,
  settings: AppSettings
): string {
  const opening = `New listing from Buy 'n' Move In!`;
  const bedrooms = data.bedrooms ? String(data.bedrooms) : EMPTY_FIELD;
  const propertyType = data.propertyType || EMPTY_FIELD;
  const location = data.location || EMPTY_FIELD;
  const description = data.description && data.description !== EMPTY_FIELD ? data.description : "";
  const priceNaira = formatNairaFull(data.priceNGN);
  const priceUsd = formatUsd(data.priceNGN, settings.usdRate) || EMPTY_FIELD;
  const documentation = data.documentation || EMPTY_FIELD;

  return template
    .replaceAll("{{opening}}", opening)
    .replaceAll("{{bedrooms}}", bedrooms)
    .replaceAll("{{property_type}}", propertyType)
    .replaceAll("{{location}}", location)
    .replaceAll("{{description}}", description)
    .replaceAll("{{price_naira}}", priceNaira)
    .replaceAll("{{price_usd}}", priceUsd)
    .replaceAll("{{documentation}}", documentation)
    .replaceAll("{{phone}}", FIXED_CONTACT.phone)
    .replaceAll("{{website}}", FIXED_CONTACT.website)
    .replaceAll("{{email}}", FIXED_CONTACT.email)
    .replaceAll("{{instagram}}", FIXED_CONTACT.instagram);
}

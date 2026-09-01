import { AppSettings, PropertyItem, TemplateMetadata } from "../types/propkit";

export const NAVY = "#0B2A4A";
export const TEAL = "#1B494E";
export const TEAL_DARK = "#14373B";
export const ORANGE = "#F26522";
export const ORANGE_HOVER = "#D95315";
export const BG_ICE = "#F4F9F9";
export const BG_CARD = "#E6EEEE";
export const BORDER_COLOR = "#DDE5E5";

export interface FlierTheme {
  id: string;
  name: string;
  primary: string;
  darkAccent: string;
  accent: string;
  accentHover: string;
  locationBg: string;
  docBg: string;
  badgeBg: string;
}

export const FLIER_THEMES: Record<string, FlierTheme> = {
  signature: {
    id: "signature",
    name: "Signature Navy & Orange",
    primary: "#0B2A4A",
    darkAccent: "#071B30",
    accent: "#F26522",
    accentHover: "#D95315",
    locationBg: "#051321",
    docBg: "#ECEFF2",
    badgeBg: "#F26522",
  },
  emerald: {
    id: "emerald",
    name: "Luxury Emerald & Gold",
    primary: "#0A352C",
    darkAccent: "#05201A",
    accent: "#E5A93C",
    accentHover: "#C88E28",
    locationBg: "#031511",
    docBg: "#EAF2EF",
    badgeBg: "#E5A93C",
  },
  onyx: {
    id: "onyx",
    name: "Midnight Onyx & Crimson",
    primary: "#181A20",
    darkAccent: "#101216",
    accent: "#FF4757",
    accentHover: "#E03646",
    locationBg: "#0B0C0E",
    docBg: "#F0F2F5",
    badgeBg: "#FF4757",
  },
  royal: {
    id: "royal",
    name: "Royal Indigo & Amber",
    primary: "#1E1B4B",
    darkAccent: "#131131",
    accent: "#F59E0B",
    accentHover: "#D97706",
    locationBg: "#0C0A20",
    docBg: "#EDE9FE",
    badgeBg: "#F59E0B",
  },
};

export const FIXED_CONTACT = {
  instagram: "@buyandmovein",
  phone: "0814-690-7088",
  website: "www.buyandmovein.com",
  email: "info@majoritydevelopers.com",
};

export const DEFAULT_CAPTION_TEMPLATE = `{{opening}}

Discover this {{bedrooms}}-bedroom {{property_type}} in {{location}}.

{{description}}

Price: {{price_naira}} ({{price_usd}})
Documentation: {{documentation}}

Interested in this property? Send us a DM or reach out below.

📞 {{phone}}
🌐 {{website}}
📧 {{email}}
📸 {{instagram}}`;

export const DEFAULT_SETTINGS: AppSettings = {
  usdRate: 1450,
  captionTemplate: DEFAULT_CAPTION_TEMPLATE,
  logoUrl: null,
};

export const STATUS_COLORS = {
  Draft: "#9CA3AF",
  Processing: "#3B82F6",
  "Needs Review": "#F59E0B",
  Ready: "#10B981",
  Published: "#1B494E",
};

export const EMPTY_FIELD = "Not found";

export const SAMPLE_PROPERTIES: PropertyItem[] = [
  {
    id: "sample-prop-1",
    data: {
      propertyTitle: "Luxury 4 Bedroom Semi-Detached Duplex",
      propertyType: "Semi-Detached Duplex",
      location: "Ikate, Lekki",
      bedrooms: 4,
      bathrooms: 4,
      priceNGN: 220000000,
      furnished: true,
      documentation: "Governor's Consent",
      description: "Contemporary 4 bedroom semi-detached duplex with private bq, swimming pool, and fully fitted kitchen.",
      features: ["BQ", "Swimming Pool", "Fitted Kitchen", "24hr Power", "CCTV"],
      reviewFlags: [],
    },
    images: [
      {
        id: "img-1",
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        name: "exterior-front.jpg",
      },
      {
        id: "img-2",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        name: "living-room.jpg",
      },
    ],
    primaryId: "img-1",
    caption: `New listing from Buy 'n' Move In!\n\nDiscover this 4-bedroom Semi-Detached Duplex in Ikate, Lekki.\n\nContemporary 4 bedroom semi-detached duplex with private bq, swimming pool, and fully fitted kitchen.\n\nPrice: ₦220,000,000 (151.7K USD)\nDocumentation: Governor's Consent\n\nInterested in this property? Send us a DM or reach out below.\n\n📞 0814-690-7088\n🌐 www.buyandmovein.com\n📧 info@majoritydevelopers.com\n📸 @buyandmovein`,
    status: "Published",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    briefText: "4 bedroom semi detached duplex with bq in ikate lekki. 220m. Gov consent. Fully furnished with swimming pool.",
  },
  {
    id: "sample-prop-2",
    data: {
      propertyTitle: "Contemporary 2 Bedroom Apartment",
      propertyType: "Apartment",
      location: "VGC, Lekki",
      bedrooms: 2,
      bathrooms: 2,
      priceNGN: 85000000,
      furnished: false,
      documentation: "C of O",
      description: "Modern serviced 2 bedroom apartment in a serene gated estate in Victoria Garden City.",
      features: ["Elevator", "Gym", "Treated Water", "Ample Parking"],
      reviewFlags: [],
    },
    images: [
      {
        id: "img-3",
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
        name: "building-facade.jpg",
      },
    ],
    primaryId: "img-3",
    caption: `Exclusive listing in Victoria Garden City!\n\nDiscover this 2-bedroom Apartment in VGC, Lekki.\n\nPrice: ₦85,000,000 (58.6K USD)\nDocumentation: C of O\n\n📞 0814-690-7088\n🌐 www.buyandmovein.com`,
    status: "Ready",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    briefText: "2 bed serviced apartment in VGC lekki. 85M C of O. Brand new with elevator and gym.",
  },
  {
    id: "sample-prop-3",
    data: {
      propertyTitle: "Magnificent 5 Bedroom Fully Detached Mansion",
      propertyType: "Detached Duplex",
      location: "Banana Island, Ikoyi",
      bedrooms: 5,
      bathrooms: 6,
      priceNGN: 1400000000,
      furnished: true,
      documentation: "Federal C of O",
      description: "Ultra-luxury waterfront mansion with private cinema, infinity pool, elevator, and smart home automation.",
      features: ["Waterfront", "Cinema", "Infinity Pool", "Elevator", "Smart Automation", "2 Room BQ"],
      reviewFlags: [],
    },
    images: [
      {
        id: "img-4",
        url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        name: "mansion-pool.jpg",
      },
    ],
    primaryId: "img-4",
    caption: `Ultra-luxury waterfront living!\n\nDiscover this 5-bedroom Detached Duplex in Banana Island, Ikoyi.\n\nPrice: ₦1,400,000,000 (965.5K USD)\nDocumentation: Federal C of O\n\n📞 0814-690-7088\n🌐 www.buyandmovein.com`,
    status: "Published",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    briefText: "5 bed fully detached mansion banana island ikoyi with elevator cinema and pool. 1.4B naira fed c of o.",
  },
];

export const REAL_ESTATE_TEMPLATES: TemplateMetadata[] = [
  {
    id: "signature",
    name: "Signature Brand",
    subtitle: "High-impact Buy 'n' Move In agency template",
    category: "brand",
    tag: "Popular",
    tagColor: "#F26522",
    description: "Classic high-conversion layout with prominent bedroom block, dark location bar, white price box, and USD exchange strip.",
    recommendedImages: 1,
    features: ["Hero 980px photo", "Bold numeric bedroom block", "USD conversion strip", "Fixed footer contact"],
  },
  {
    id: "editorial",
    name: "Luxury Editorial",
    subtitle: "Architectural magazine frosted card style",
    category: "luxury",
    tag: "Luxury",
    tagColor: "#D97706",
    description: "Full-bleed photography with a floating frosted glass card, elegant serif typography, gold accents, and refined specs.",
    recommendedImages: 1,
    features: ["Full-bleed photo", "Frosted glass card", "Editorial serif typography", "Subtle gold badges"],
  },
  {
    id: "grid",
    name: "Multi-Photo Showcase",
    subtitle: "3-photo layout for exterior + interiors",
    category: "multi-photo",
    tag: "Multi-Image",
    tagColor: "#3B82F6",
    description: "Features 1 hero exterior photo plus 2 interior feature insets (living room & pool/kitchen) with feature pill badges.",
    recommendedImages: 3,
    features: ["1 Hero + 2 Inset photos", "Feature pill checklist", "Punchy price callout", "Balanced layout"],
  },
  {
    id: "minimalist",
    name: "Minimalist Studio",
    subtitle: "Clean Nordic architectural gallery layout",
    category: "minimalist",
    tag: "Clean",
    tagColor: "#10B981",
    description: "Framed photo with generous white margins, modern minimalist typography, and 4 clean specification columns.",
    recommendedImages: 1,
    features: ["Gallery white border", "Monochrome minimalism", "Structured spec grid", "High aesthetic appeal"],
  },
  {
    id: "urgent",
    name: "Just Listed / Hot Deal",
    subtitle: "High-energy commercial urgency layout",
    category: "impact",
    tag: "High Impact",
    tagColor: "#EF4444",
    description: "Features a bold diagonal 'JUST LISTED' banner, bright orange price badge, and direct WhatsApp contact ribbon.",
    recommendedImages: 1,
    features: ["Diagonal 'JUST LISTED' ribbon", "Instant WhatsApp action", "High contrast price badge", "Urgency callouts"],
  },
  {
    id: "waterfront",
    name: "Waterfront & Penthouse",
    subtitle: "Deep oceanic panoramic luxury theme",
    category: "luxury",
    tag: "Exclusive",
    tagColor: "#0EA5E9",
    description: "Deep oceanic gradient framing with metallic cyan accents, floor level indicator, and luxury amenities checklist.",
    recommendedImages: 1,
    features: ["Oceanic gradient", "Metallic cyan accents", "Floor & view callout", "Waterfront amenities"],
  },
];

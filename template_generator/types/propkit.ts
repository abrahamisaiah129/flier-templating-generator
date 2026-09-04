export interface PropertyData {
  propertyTitle: string;
  propertyType: string;
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  priceNGN: number | null;
  furnished: boolean | null;
  documentation: string;
  description: string;
  features: string[];
  reviewFlags?: string[];
}

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

export type TemplateId = "bmi" | "eko" | "enose";

export interface PropertyItem {
  id: string;
  data: PropertyData;
  images: UploadedImage[];
  primaryId: string | null;
  caption: string;
  status: "Draft" | "Processing" | "Needs Review" | "Ready" | "Published";
  createdAt: string;
  briefText: string;
  briefUrl?: string;
  templateId?: TemplateId;
}

export interface AppSettings {
  usdRate: number;
  captionTemplate: string;
  logoUrl: string | null;
  anthropicApiKey?: string;
}

export type ActiveView = "dashboard" | "new" | "history" | "review" | "kit";

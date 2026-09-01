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

export type ActiveView = "dashboard" | "new" | "templates" | "history" | "review" | "kit";

export type TemplateId =
  | "signature"
  | "editorial"
  | "grid"
  | "minimalist"
  | "urgent"
  | "waterfront";

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  subtitle: string;
  category: "all" | "brand" | "luxury" | "multi-photo" | "minimalist" | "impact";
  tag: string;
  tagColor: string;
  description: string;
  recommendedImages: number;
  features: string[];
}

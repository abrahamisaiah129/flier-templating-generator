import { PropertyData, AppSettings } from "../types/propkit";
import { FIXED_CONTACT } from "./constants";

export interface SvgInjectionHelpers {
  rawPriceNaira: string;
  priceUsd: string;
  bedroomNum: string;
  locationText: string;
  docText: string;
}

/**
 * Injects dynamic property data, contact information, and image URLs into raw SVG templates.
 */
export function injectPropertyDataIntoSvg(
  rawSvg: string,
  data: PropertyData,
  primaryImage: string | null,
  secondaryImages: string[] = [],
  settings: AppSettings,
  helpers: SvgInjectionHelpers
): string {
  let res = rawSvg;

  const tokenMap: Record<string, string> = {
    "{{title}}": data.propertyTitle || "Luxury Property",
    "{{property_title}}": data.propertyTitle || "Luxury Property",
    "{{property_type}}": data.propertyType || "Apartment",
    "{{bedrooms}}": helpers.bedroomNum,
    "{{bathrooms}}": String(data.bathrooms || 4),
    "{{location}}": helpers.locationText,
    "{{price}}": helpers.rawPriceNaira,
    "{{price_naira}}": helpers.rawPriceNaira,
    "{{price_usd}}": helpers.priceUsd,
    "{{documentation}}": helpers.docText,
    "{{phone}}": FIXED_CONTACT.phone,
    "{{instagram}}": FIXED_CONTACT.instagram,
    "{{website}}": FIXED_CONTACT.website,
    "{{email}}": FIXED_CONTACT.email,
  };

  for (const [token, value] of Object.entries(tokenMap)) {
    res = res.split(token).join(value);
  }

  // Primary image tokens (Image 1)
  const pImg = primaryImage || "";
  res = res.split("{{image}}").join(pImg);
  res = res.split("{{image_1}}").join(pImg);
  res = res.split("{{image_0}}").join(pImg);
  res = res.split("{{image_url}}").join(pImg);
  res = res.split("{{primary_image}}").join(pImg);
  res = res.split("{{background_image}}").join(pImg);
  res = res.split("{{hero_image}}").join(pImg);

  // Secondary image tokens
  const sImg1 = secondaryImages[0] || pImg;
  const sImg2 = secondaryImages[1] || sImg1 || pImg;
  const sImg3 = secondaryImages[2] || sImg2 || pImg;
  res = res.split("{{image_2}}").join(sImg1);
  res = res.split("{{secondary_image}}").join(sImg1);
  res = res.split("{{secondary_image_1}}").join(sImg1);
  res = res.split("{{thumbnail_1}}").join(sImg1);
  res = res.split("{{image_3}}").join(sImg2);
  res = res.split("{{secondary_image_2}}").join(sImg2);
  res = res.split("{{thumbnail_2}}").join(sImg2);
  res = res.split("{{image_4}}").join(sImg3);

  // Ensure all <image> tags have crossOrigin="anonymous" and both href/xlink:href
  let imgIndex = 0;
  res = res.replace(/<image\b([\s\S]*?)(\/?>)/gi, (match, attrs, close) => {
    let cleanAttrs = attrs;
    const targetUrl = imgIndex === 0 ? pImg : secondaryImages[imgIndex - 1] || pImg;
    imgIndex++;

    if (!cleanAttrs.includes("crossOrigin") && !cleanAttrs.includes("crossorigin")) {
      cleanAttrs += ' crossOrigin="anonymous"';
    }

    if (targetUrl) {
      if (/(?:href|xlink:href)=/i.test(cleanAttrs)) {
        cleanAttrs = cleanAttrs.replace(
          /(?:href|xlink:href)=["'][^"']*["']/gi,
          `href="${targetUrl}" xlink:href="${targetUrl}"`
        );
      } else {
        cleanAttrs += ` href="${targetUrl}" xlink:href="${targetUrl}"`;
      }
    }

    return `<image${cleanAttrs}${close}`;
  });

  return res;
}

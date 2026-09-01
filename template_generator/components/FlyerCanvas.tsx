"use client";

import React, { RefObject } from "react";
import { PropertyData, AppSettings, TemplateId, UploadedImage } from "../types/propkit";
import { FIXED_CONTACT, EMPTY_FIELD, FLIER_THEMES } from "../utils/constants";
import { formatNaira, formatUsd, formatPropertyTypeLines } from "../utils/extractor";

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;

interface FlyerCanvasProps {
  data: PropertyData;
  settings: AppSettings;
  svgRef: RefObject<SVGSVGElement | null>;
  primaryImage: string | null;
  secondaryImages?: UploadedImage[];
  templateId?: TemplateId;
  themeId?: string;
  className?: string;
}

export function FlyerCanvas({
  data,
  settings,
  svgRef,
  primaryImage,
  secondaryImages = [],
  templateId = "signature",
  themeId = "signature",
  className = "",
}: FlyerCanvasProps) {
  const theme = FLIER_THEMES[themeId] || FLIER_THEMES.signature;

  // Formatted data helpers
  const priceNaira = formatNaira(data.priceNGN) || "PRICE ON REQUEST";
  const priceUsd = formatUsd(data.priceNGN, settings.usdRate) || "USD ESTIMATE";
  const bedroomNum = data.bedrooms ? String(data.bedrooms) : null;
  const bathroomNum = data.bathrooms ? String(data.bathrooms) : null;
  const locationText = (data.location || EMPTY_FIELD).toUpperCase().trim();
  const docText = (data.documentation || EMPTY_FIELD).toUpperCase().trim();
  const titleText = (data.propertyTitle || "Luxury Property").toUpperCase().trim();

  // Multi-image references for grid template
  const img1 = primaryImage;
  const img2 = secondaryImages[1]?.url || secondaryImages[0]?.url || primaryImage;
  const img3 = secondaryImages[2]?.url || secondaryImages[1]?.url || primaryImage;

  const { titleLines, highlightLines } = formatPropertyTypeLines(
    data.propertyType,
    data.features
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl border border-slate-200/80 bg-white ${className}`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-auto select-none"
        style={{ background: "#0a0a0a" }}
      >
        <defs>
          <style>{`
            .flier-font {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .flier-serif {
              font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
            }
          `}</style>

          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.35" />
          </filter>

          <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25" />
          </filter>

          {/* Gradients */}
          <linearGradient id="topVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
            <stop offset="35%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="bottomVignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E5A93C" />
            <stop offset="50%" stopColor="#F5D061" />
            <stop offset="100%" stopColor="#C88E28" />
          </linearGradient>

          <linearGradient id="oceanGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#041E34" />
            <stop offset="100%" stopColor="#020B14" />
          </linearGradient>
        </defs>

        {/* ----------------------------------------------------------------- */}
        {/* TEMPLATE 1: SIGNATURE BRAND (Buy 'n' Move In Classic)             */}
        {/* ----------------------------------------------------------------- */}
        {templateId === "signature" && (
          <g>
            {/* Hero Photo (top 980px) */}
            {img1 ? (
              <image
                href={img1}
                x="0"
                y="0"
                width={CANVAS_W}
                height="980"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <rect x="0" y="0" width={CANVAS_W} height="980" fill="#CBD5E1" />
            )}
            <rect x="0" y="0" width={CANVAS_W} height="240" fill="url(#topVignette)" />
            <rect x="0" y="740" width={CANVAS_W} height="240" fill="url(#bottomVignette)" />

            {/* Top-Left Logo */}
            {settings.logoUrl ? (
              <g filter="url(#badgeShadow)">
                <rect x="40" y="40" width="310" height="96" rx="20" fill="#ffffff" fillOpacity="0.96" />
                <image href={settings.logoUrl} x="55" y="48" width="280" height="80" preserveAspectRatio="xMidYMid meet" />
              </g>
            ) : (
              <g filter="url(#badgeShadow)">
                <rect x="40" y="40" width="310" height="96" rx="20" fill="#ffffff" fillOpacity="0.96" />
                <text x="62" y="86" fontSize="28" fontWeight="900" fill={theme.primary} className="flier-font">
                  buy'n'move
                </text>
                <circle cx="275" cy="77" r="18" fill={theme.accent} />
                <text x="266" y="84" fontSize="18" fontWeight="900" fill="#ffffff" className="flier-font">
                  in
                </text>
                <text x="63" y="110" fontSize="13" fontWeight="600" fontStyle="italic" fill="#64748B" className="flier-font">
                  ...live anywhere
                </text>
              </g>
            )}

            {/* Top-Right Badge */}
            <g filter="url(#badgeShadow)">
              <rect x="760" y="40" width="280" height="64" rx="32" fill={data.furnished ? theme.accent : "#000000"} fillOpacity={data.furnished ? 1 : 0.75} />
              <text x="900" y="81" textAnchor="middle" fontSize="24" fontWeight="900" fill="#ffffff" letterSpacing="2" className="flier-font">
                {data.furnished ? "★ FURNISHED" : "FOR SALE"}
              </text>
            </g>

            {/* Bedroom block (x: 0 -> 190) */}
            <rect x="0" y="980" width="190" height="270" fill={theme.darkAccent} />
            <text x="95" y="1120" textAnchor="middle" fontSize="125" fontWeight="900" fill={theme.accent} className="flier-font">
              {bedroomNum || "★"}
            </text>
            <text x="95" y="1170" textAnchor="middle" fontSize="19" fontWeight="800" fill="#ffffff" letterSpacing="3" className="flier-font">
              {bedroomNum ? (bedroomNum === "1" ? "BEDROOM" : "BEDROOMS") : "LUXURY"}
            </text>

            <line x1="190" y1="1010" x2="190" y2="1220" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="2" />

            {/* Property Title / Highlights (x: 190 -> 560) */}
            <rect x="190" y="980" width="370" height="270" fill={theme.primary} />
            {titleLines.map((line, idx) => (
              <text key={idx} x="225" y={1045 + idx * 42} fontSize="31" fontWeight="900" fill="#ffffff" className="flier-font">
                {line}
              </text>
            ))}
            {highlightLines.map((hl, idx) => (
              <text key={idx} x="225" y={1145 + idx * 30} fontSize="21" fontWeight="800" fill={theme.accent} className="flier-font">
                {hl}
              </text>
            ))}

            {/* Location bar (x: 560 -> 1080, y: 980 -> 1070) */}
            <rect x="560" y="980" width="520" height="90" fill={theme.locationBg} />
            <circle cx="597" cy="1025" r="10" fill={theme.accent} />
            <text x="625" y="1014" fontSize="12" fontWeight="800" fill={theme.accent} letterSpacing="2.5" className="flier-font">
              LOCATION
            </text>
            <text x="625" y="1046" fontSize={locationText.length > 24 ? 21 : 26} fontWeight="800" fill="#ffffff" className="flier-font">
              {locationText}
            </text>

            {/* Price block (x: 560 -> 1080, y: 1070 -> 1180) */}
            <rect x="560" y="1070" width="520" height="110" fill="#ffffff" />
            <text x="585" y="1102" fontSize="15" fontWeight="800" fill={theme.primary} fillOpacity="0.65" letterSpacing="2" className="flier-font">
              PRICE:
            </text>
            <text x="585" y="1158" fontSize={priceNaira.length > 8 ? 44 : 56} fontWeight="900" fill={theme.primary} className="flier-font">
              {priceNaira}
            </text>

            {/* USD Strip (x: 560 -> 1080, y: 1180 -> 1250) */}
            <rect x="560" y="1180" width="520" height="70" fill={theme.accent} />
            <text x="585" y="1226" fontSize="28" fontWeight="800" fill="#ffffff" letterSpacing="1.5" className="flier-font">
              {priceUsd}
            </text>

            {/* Documentation (y: 1250 -> 1300) */}
            <rect x="0" y="1250" width={CANVAS_W} height="50" fill={theme.docBg} />
            <text x="540" y="1275" textAnchor="middle" dominantBaseline="central" fontSize={docText.length > 30 ? 17 : 21} fontWeight="800" fill={theme.primary} letterSpacing="2" className="flier-font">
              TITLE: {docText}
            </text>

            {/* Footer Contact (y: 1300 -> 1350) */}
            <FooterBar theme={theme} />
          </g>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TEMPLATE 2: LUXURY EDITORIAL (Architectural Frosted Glass)         */}
        {/* ----------------------------------------------------------------- */}
        {templateId === "editorial" && (
          <g>
            {/* Full-bleed Photo */}
            {img1 && (
              <image href={img1} x="0" y="0" width={CANVAS_W} height="1100" preserveAspectRatio="xMidYMid slice" />
            )}
            <rect x="0" y="0" width={CANVAS_W} height="280" fill="url(#topVignette)" />
            <rect x="0" y="600" width={CANVAS_W} height="750" fill="url(#bottomVignette)" />

            {/* Editorial Top Brand Header */}
            <g transform="translate(60, 60)">
              <text x="0" y="30" fontSize="20" fontWeight="700" fill="#ffffff" letterSpacing="6" className="flier-font">
                BUY 'N' MOVE IN
              </text>
              <text x="0" y="52" fontSize="12" fontWeight="400" fill="#E5A93C" letterSpacing="4" className="flier-font">
                PRIVATE RESIDENCES & ESTATES
              </text>
            </g>

            {/* Editorial Badge */}
            <g transform="translate(790, 60)" filter="url(#badgeShadow)">
              <rect x="0" y="0" width="230" height="50" rx="25" fill="#0A0F1D" fillOpacity="0.8" stroke="#E5A93C" strokeWidth="1.5" />
              <text x="115" y="31" textAnchor="middle" fontSize="16" fontWeight="700" fill="#E5A93C" letterSpacing="3" className="flier-font">
                {data.furnished ? "FURNISHED" : "EXCLUSIVE"}
              </text>
            </g>

            {/* Floating Glassmorphic Editorial Card */}
            <g transform="translate(50, 780)" filter="url(#cardShadow)">
              <rect x="0" y="0" width="980" height="470" rx="24" fill="#0A0F1D" fillOpacity="0.94" stroke="#E5A93C" strokeWidth="1.5" />

              {/* Tag & Location */}
              <text x="50" y="60" fontSize="15" fontWeight="800" fill="#E5A93C" letterSpacing="4" className="flier-font">
                {data.propertyType?.toUpperCase() || "CONTEMPORARY VILLA"}
              </text>
              <text x="50" y="95" fontSize="34" fontWeight="800" fill="#ffffff" className="flier-serif">
                {titleText}
              </text>

              {/* Location pin & text */}
              <circle cx="58" cy="135" r="6" fill="#E5A93C" />
              <text x="75" y="140" fontSize="20" fontWeight="600" fill="#CBD5E1" className="flier-font">
                {locationText}
              </text>

              {/* Price Callout in Card */}
              <text x="50" y="225" fontSize="58" fontWeight="900" fill="url(#goldGradient)" className="flier-font">
                {priceNaira}
              </text>
              <text x="50" y="260" fontSize="22" fontWeight="600" fill="#94A3B8" className="flier-font">
                Equivalent: {priceUsd} • Title: {docText}
              </text>

              <line x1="50" y1="290" x2="930" y2="290" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" />

              {/* 3 Spec Badges */}
              <g transform="translate(50, 320)">
                <SpecBox x={0} label="BEDROOMS" val={bedroomNum ? `${bedroomNum} BEDS` : "LUXURY"} />
                <SpecBox x={225} label="BATHROOMS" val={bathroomNum ? `${bathroomNum} BATHS` : "EN-SUITE"} />
                <SpecBox x={450} label="DOCUMENT" val={docText.slice(0, 16)} />
                <SpecBox x={675} label="FURNISHED" val={data.furnished ? "YES" : "OPTIONAL"} />
              </g>

              {/* Features line */}
              <text x="50" y="435" fontSize="16" fontWeight="700" fill="#CBD5E1" letterSpacing="1.5" className="flier-font">
                HIGHLIGHTS: {(data.features || []).slice(0, 4).join("  •  ") || "PRIME LOCATION  •  24HR POWER"}
              </text>
            </g>

            {/* Refined Bottom Footer */}
            <rect x="0" y="1290" width={CANVAS_W} height="60" fill="#0A0F1D" />
            <text x="60" y="1326" fontSize="17" fontWeight="600" fill="#CBD5E1" className="flier-font">
              📞 {FIXED_CONTACT.phone}  •  📸 {FIXED_CONTACT.instagram}  •  🌐 {FIXED_CONTACT.website}
            </text>
          </g>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TEMPLATE 3: MULTI-PHOTO SHOWCASE (Exterior + 2 Inset Photos)       */}
        {/* ----------------------------------------------------------------- */}
        {templateId === "grid" && (
          <g>
            {/* 1. Hero Exterior Photo (Top 650px) */}
            {img1 && (
              <image href={img1} x="0" y="0" width={CANVAS_W} height="650" preserveAspectRatio="xMidYMid slice" />
            )}
            <rect x="0" y="0" width={CANVAS_W} height="180" fill="url(#topVignette)" />

            {/* Badge on Hero */}
            <g transform="translate(40, 40)" filter="url(#badgeShadow)">
              <rect x="0" y="0" width="220" height="48" rx="24" fill={theme.primary} />
              <text x="110" y="30" textAnchor="middle" fontSize="16" fontWeight="800" fill="#ffffff" letterSpacing="2" className="flier-font">
                MULTI-VIEW
              </text>
            </g>

            {/* 2. Middle Dual Insets (y: 670 -> 930) */}
            <g transform="translate(40, 670)">
              {/* Inset Left */}
              <rect x="0" y="0" width="485" height="260" rx="16" fill="#1E293B" />
              {img2 && (
                <g clipPath="url(#insetClip1)">
                  <clipPath id="insetClip1"><rect x="0" y="0" width="485" height="260" rx="16" /></clipPath>
                  <image href={img2} x="0" y="0" width="485" height="260" preserveAspectRatio="xMidYMid slice" />
                </g>
              )}
              <rect x="15" y="215" width="130" height="30" rx="15" fill="#000000" fillOpacity="0.75" />
              <text x="80" y="235" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff" letterSpacing="1" className="flier-font">
                INTERIOR
              </text>

              {/* Inset Right */}
              <g transform="translate(515, 0)">
                <rect x="0" y="0" width="485" height="260" rx="16" fill="#1E293B" />
                {img3 && (
                  <g clipPath="url(#insetClip2)">
                    <clipPath id="insetClip2"><rect x="0" y="0" width="485" height="260" rx="16" /></clipPath>
                    <image href={img3} x="0" y="0" width="485" height="260" preserveAspectRatio="xMidYMid slice" />
                  </g>
                )}
                <rect x="15" y="215" width="130" height="30" rx="15" fill="#000000" fillOpacity="0.75" />
                <text x="80" y="235" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff" letterSpacing="1" className="flier-font">
                  AMENITIES
                </text>
              </g>
            </g>

            {/* 3. Bottom Specs Card (y: 950 -> 1300) */}
            <rect x="0" y="950" width={CANVAS_W} height="350" fill={theme.darkAccent} />
            <g transform="translate(50, 990)">
              <text x="0" y="40" fontSize="56" fontWeight="900" fill={theme.accent} className="flier-font">
                {priceNaira}
              </text>
              <text x="0" y="75" fontSize="22" fontWeight="800" fill="#ffffff" className="flier-font">
                {titleText}
              </text>
              <text x="0" y="110" fontSize="18" fontWeight="600" fill="#94A3B8" className="flier-font">
                📍 {locationText}  •  {bedroomNum ? `${bedroomNum} Bed` : ""}  •  {docText}
              </text>

              {/* Features pills */}
              <g transform="translate(0, 140)">
                {(data.features || ["BQ", "Pool", "Fitted Kitchen"]).slice(0, 4).map((f, i) => (
                  <g key={i} transform={`translate(${i * 240}, 0)`}>
                    <rect x="0" y="0" width="220" height="42" rx="21" fill="#ffffff" fillOpacity="0.1" />
                    <text x="110" y="26" textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffffff" className="flier-font">
                      ✔ {f}
                    </text>
                  </g>
                ))}
              </g>
            </g>

            {/* Footer */}
            <FooterBar theme={theme} />
          </g>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TEMPLATE 4: MINIMALIST STUDIO (Gallery Framed Architecture)       */}
        {/* ----------------------------------------------------------------- */}
        {templateId === "minimalist" && (
          <g>
            {/* White/Cream Gallery Frame Background */}
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#F9FAFB" />

            {/* Minimalist Top Header */}
            <text x="60" y="70" fontSize="16" fontWeight="800" fill="#111827" letterSpacing="5" className="flier-font">
              BUY 'N' MOVE IN ARCHITECTURE
            </text>
            <text x="1020" y="70" textAnchor="end" fontSize="14" fontWeight="600" fill="#6B7280" letterSpacing="2" className="flier-font">
              SERIES 2026
            </text>

            {/* Framed Photo with Elegant Inset Border */}
            <g transform="translate(60, 100)">
              <rect x="0" y="0" width="960" height="760" rx="16" fill="#E5E7EB" />
              {img1 && (
                <g clipPath="url(#minimalClip)">
                  <clipPath id="minimalClip"><rect x="0" y="0" width="960" height="760" rx="16" /></clipPath>
                  <image href={img1} x="0" y="0" width="960" height="760" preserveAspectRatio="xMidYMid slice" />
                </g>
              )}
            </g>

            {/* Structured Specifications Row */}
            <g transform="translate(60, 910)">
              <MinimalCol x={0} label="BEDROOMS" value={bedroomNum ? `${bedroomNum} BEDS` : "N/A"} />
              <MinimalCol x={240} label="LOCATION" value={locationText.slice(0, 16)} />
              <MinimalCol x={480} label="DOCUMENT" value={docText.slice(0, 16)} />
              <MinimalCol x={720} label="PRICING" value={priceNaira} isAccent />
            </g>

            <line x1="60" y1="990" x2="1020" y2="990" stroke="#E5E7EB" strokeWidth="1.5" />

            {/* Title & Description */}
            <g transform="translate(60, 1040)">
              <text x="0" y="30" fontSize="36" fontWeight="900" fill="#111827" className="flier-font">
                {titleText}
              </text>
              <text x="0" y="70" fontSize="19" fontWeight="500" fill="#4B5563" className="flier-font">
                {data.description?.slice(0, 110) || "Exceptional modern architecture built with uncompromising precision."}
              </text>
            </g>

            {/* Minimalist Monochrome Footer */}
            <rect x="60" y="1240" width="960" height="50" rx="12" fill="#111827" />
            <text x="100" y="1272" fontSize="16" fontWeight="600" fill="#F9FAFB" className="flier-font">
              📞 {FIXED_CONTACT.phone}   |   ✉ {FIXED_CONTACT.email}   |   🌐 {FIXED_CONTACT.website}
            </text>
          </g>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TEMPLATE 5: JUST LISTED / HOT DEAL (High Energy Urgency)           */}
        {/* ----------------------------------------------------------------- */}
        {templateId === "urgent" && (
          <g>
            {/* Top Photo */}
            {img1 && (
              <image href={img1} x="0" y="0" width={CANVAS_W} height="900" preserveAspectRatio="xMidYMid slice" />
            )}
            <rect x="0" y="0" width={CANVAS_W} height="260" fill="url(#topVignette)" />
            <rect x="0" y="650" width={CANVAS_W} height="300" fill="url(#bottomVignette)" />

            {/* High-Energy Diagonal Banner at Top Left */}
            <g transform="translate(50, 50)" filter="url(#badgeShadow)">
              <rect x="0" y="0" width="320" height="60" rx="12" fill="#EF4444" />
              <text x="160" y="39" textAnchor="middle" fontSize="24" fontWeight="900" fill="#ffffff" letterSpacing="3" className="flier-font">
                ⚡ JUST LISTED ⚡
              </text>
            </g>

            {/* Floating High-Contrast Price Badge on Photo */}
            <g transform="translate(50, 770)" filter="url(#cardShadow)">
              <rect x="0" y="0" width="460" height="90" rx="18" fill="#F26522" />
              <text x="25" y="40" fontSize="16" fontWeight="800" fill="#ffffff" letterSpacing="2" className="flier-font">
                ASKING PRICE:
              </text>
              <text x="25" y="74" fontSize="42" fontWeight="900" fill="#ffffff" className="flier-font">
                {priceNaira}
              </text>
            </g>

            {/* Bottom Urgency Action Card (y: 900 -> 1300) */}
            <rect x="0" y="900" width={CANVAS_W} height="400" fill="#0F172A" />

            <g transform="translate(50, 950)">
              <text x="0" y="36" fontSize="38" fontWeight="900" fill="#ffffff" className="flier-font">
                {titleText}
              </text>
              <text x="0" y="75" fontSize="22" fontWeight="700" fill="#EF4444" className="flier-font">
                📍 {locationText}  •  {bedroomNum ? `${bedroomNum} Bedrooms` : ""}  •  Title: {docText}
              </text>

              {/* Direct WhatsApp Callout Banner */}
              <g transform="translate(0, 115)" filter="url(#badgeShadow)">
                <rect x="0" y="0" width="980" height="84" rx="20" fill="#22C55E" />
                <text x="490" y="52" textAnchor="middle" fontSize="26" fontWeight="900" fill="#ffffff" letterSpacing="1" className="flier-font">
                  💬 CHAT DIRECTLY ON WHATSAPP: {FIXED_CONTACT.phone}
                </text>
              </g>

              {/* Feature Checklist */}
              <text x="0" y="250" fontSize="20" fontWeight="800" fill="#CBD5E1" className="flier-font">
                ✔ 100% VERIFIED TITLE  •  ✔ INSPECTIONS AVAILABLE DAILY  •  ✔ OFFERS WELCOME
              </text>
            </g>

            {/* Footer */}
            <FooterBar theme={theme} />
          </g>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TEMPLATE 6: WATERFRONT & PENTHOUSE (Panoramic Deep Ocean Theme)    */}
        {/* ----------------------------------------------------------------- */}
        {templateId === "waterfront" && (
          <g>
            {/* Top Panoramic Photo */}
            {img1 && (
              <image href={img1} x="0" y="0" width={CANVAS_W} height="920" preserveAspectRatio="xMidYMid slice" />
            )}
            <rect x="0" y="0" width={CANVAS_W} height="260" fill="url(#topVignette)" />
            <rect x="0" y="660" width={CANVAS_W} height="300" fill="url(#bottomVignette)" />

            {/* Penthouse Luxury Badge */}
            <g transform="translate(50, 50)" filter="url(#badgeShadow)">
              <rect x="0" y="0" width="340" height="54" rx="27" fill="#0284C7" />
              <text x="170" y="35" textAnchor="middle" fontSize="18" fontWeight="900" fill="#ffffff" letterSpacing="3" className="flier-font">
                ★ PENTHOUSE COLLECTION ★
              </text>
            </g>

            {/* Bottom Oceanic Card (y: 920 -> 1300) */}
            <rect x="0" y="920" width={CANVAS_W} height="380" fill="url(#oceanGradient)" />
            <line x1="0" y1="920" x2={CANVAS_W} y2="920" stroke="#0EA5E9" strokeWidth="3" />

            <g transform="translate(60, 980)">
              {/* Title & Location */}
              <text x="0" y="40" fontSize="18" fontWeight="800" fill="#38BDF8" letterSpacing="4" className="flier-font">
                WATERFRONT & HIGHRISE RESIDENCES
              </text>
              <text x="0" y="90" fontSize="44" fontWeight="900" fill="#ffffff" className="flier-font">
                {titleText}
              </text>
              <text x="0" y="130" fontSize="24" fontWeight="700" fill="#94A3B8" className="flier-font">
                {locationText} • {bedroomNum ? `${bedroomNum} BEDS` : ""} • {docText}
              </text>

              {/* Cyan Price Display */}
              <text x="0" y="210" fontSize="62" fontWeight="900" fill="#38BDF8" className="flier-font">
                {priceNaira}
              </text>
              <text x="0" y="245" fontSize="22" fontWeight="700" fill="#94A3B8" className="flier-font">
                ({priceUsd})
              </text>
            </g>

            {/* Footer */}
            <FooterBar theme={theme} />
          </g>
        )}
      </svg>
    </div>
  );
}

function SpecBox({ x, label, val }: { x: number; label: string; val: string }) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <rect x="0" y="0" width="200" height="60" rx="10" fill="#ffffff" fillOpacity="0.06" stroke="#E5A93C" strokeOpacity="0.4" strokeWidth="1" />
      <text x="100" y="22" textAnchor="middle" fontSize="11" fontWeight="800" fill="#E5A93C" letterSpacing="1.5" className="flier-font">
        {label}
      </text>
      <text x="100" y="46" textAnchor="middle" fontSize="15" fontWeight="900" fill="#ffffff" className="flier-font">
        {val}
      </text>
    </g>
  );
}

function MinimalCol({ x, label, value, isAccent = false }: { x: number; label: string; value: string; isAccent?: boolean }) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <text x="0" y="20" fontSize="12" fontWeight="800" fill="#9CA3AF" letterSpacing="2" className="flier-font">
        {label}
      </text>
      <text x="0" y="52" fontSize="22" fontWeight="900" fill={isAccent ? "#059669" : "#111827"} className="flier-font">
        {value}
      </text>
    </g>
  );
}

function FooterBar({ theme }: { theme: (typeof FLIER_THEMES)["signature"] }) {
  return (
    <g>
      <rect x="0" y="1300" width={CANVAS_W} height="50" fill="#ffffff" />
      <line x1="0" y1="1300" x2={CANVAS_W} y2="1300" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* 4 Balanced Columns */}
      <g transform="translate(25, 1315)">
        <rect x="0" y="0" width="20" height="20" rx="5" fill="none" stroke={theme.primary} strokeWidth="2" />
        <circle cx="10" cy="10" r="4.5" fill="none" stroke={theme.primary} strokeWidth="2" />
        <text x="28" y="15" fontSize="17" fontWeight="700" fill={theme.primary} className="flier-font">
          {FIXED_CONTACT.instagram}
        </text>
      </g>

      <g transform="translate(290, 1315)">
        <path
          d="M3.6 1.5C3.2 0.7 2.3 0.2 1.4 0.5L0.5 0.9C0.2 1.1 0 1.4 0 1.7C0 9.4 6.3 15.7 14 15.7C14.3 15.7 14.6 15.5 14.8 15.2L15.2 14.3C15.5 13.4 15 12.5 14.2 12.1L12.2 11.1C11.5 10.7 10.6 10.9 10.1 11.5L9.3 12.5C7.1 11.4 5.3 9.6 4.2 7.4L5.2 6.6C5.8 6.1 6 5.2 5.6 4.5L4.6 2.5L3.6 1.5Z"
          fill={theme.primary}
          transform="scale(1.2)"
        />
        <text x="26" y="15" fontSize="17" fontWeight="700" fill={theme.primary} className="flier-font">
          {FIXED_CONTACT.phone}
        </text>
      </g>

      <g transform="translate(560, 1315)">
        <circle cx="10" cy="10" r="9" fill="none" stroke={theme.primary} strokeWidth="1.8" />
        <ellipse cx="10" cy="10" rx="4.5" ry="9" fill="none" stroke={theme.primary} strokeWidth="1.8" />
        <text x="28" y="15" fontSize="17" fontWeight="700" fill={theme.primary} className="flier-font">
          {FIXED_CONTACT.website}
        </text>
      </g>

      <g transform="translate(830, 1315)">
        <rect x="0" y="1" width="20" height="15" rx="3" fill="none" stroke={theme.primary} strokeWidth="1.8" />
        <path d="M1 2L10 9L19 2" fill="none" stroke={theme.primary} strokeWidth="1.8" />
        <text x="28" y="15" fontSize="16" fontWeight="700" fill={theme.primary} className="flier-font">
          {FIXED_CONTACT.email}
        </text>
      </g>
    </g>
  );
}

/**
 * Bulletproof SVG to PNG converter with resolution scale support (1x standard or 2x Ultra HD).
 * Handles external image URLs by converting them to data URLs to prevent canvas tainting.
 */
export async function svgToPngBlob(
  svgEl: SVGSVGElement,
  scale: number = 1
): Promise<Blob | null> {
  try {
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;

    // Convert any external <image> hrefs to Data URLs so the canvas won't be tainted
    const images = Array.from(clonedSvg.querySelectorAll("image"));
    for (const imgEl of images) {
      const href = imgEl.getAttribute("href") || imgEl.getAttribute("xlink:href");
      if (href && href.startsWith("http")) {
        try {
          const res = await fetch(href, { mode: "cors" });
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          imgEl.setAttribute("href", dataUrl);
        } catch {
          // If cross-origin fetch is blocked, continue gracefully
        }
      }
    }

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clonedSvg);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });
    img.src = url;
    await loaded;

    const targetWidth = CANVAS_W * scale;
    const targetHeight = CANVAS_H * scale;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    URL.revokeObjectURL(url);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  } catch (err) {
    console.error("Failed to render SVG to PNG", err);
    return null;
  }
}

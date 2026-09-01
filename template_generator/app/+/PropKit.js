import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Settings as SettingsIcon,
  Upload,
  Trash2,
  Star,
  ArrowUp,
  ArrowDown,
  Link as LinkIcon,
  Sparkles,
  Check,
  AlertTriangle,
  Download,
  Copy,
  Share2,
  X,
  ChevronLeft,
  Loader2,
  Home,
  Image as ImageIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const NAVY = "#0B2A4A";
const ORANGE = "#F2872E";

const FIXED_CONTACT = {
  instagram: "@buyandmovein",
  phone: "0814-690-7088",
  website: "www.buyandmovein.com",
  email: "info@majoritydevelopers.com",
};

const DEFAULT_CAPTION_TEMPLATE = `{{opening}}

Discover this {{bedrooms}}-bedroom {{property_type}} in {{location}}.

{{description}}

Price: {{price_naira}} ({{price_usd}})
Documentation: {{documentation}}

Interested in this property? Send us a DM or reach out below.

📞 {{phone}}
🌐 {{website}}
📧 {{email}}
📸 {{instagram}}`;

const STATUS_COLORS = {
  Draft: "#9CA3AF",
  Processing: "#3B82F6",
  "Needs Review": "#F59E0B",
  Ready: "#10B981",
  Published: "#6366F1",
  Archived: "#6B7280",
};

const EMPTY_FIELD = "Not found";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Abbreviate a number the way the template displays it: 120,000,000 -> "120M"
function abbreviateNumber(num) {
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

function formatNaira(priceNGN) {
  const abbrev = abbreviateNumber(priceNGN);
  if (!abbrev) return null;
  return "N" + abbrev;
}

function formatUsd(priceNGN, rate) {
  if (!priceNGN || !rate) return null;
  const usd = priceNGN / rate;
  const abbrev = abbreviateNumber(usd);
  if (!abbrev) return null;
  return abbrev + " USD";
}

function formatNairaFull(priceNGN) {
  if (priceNGN === null || priceNGN === undefined) return EMPTY_FIELD;
  return "₦" + Number(priceNGN).toLocaleString("en-NG");
}

// Deterministic (non-AI) template description builder — layer 2 must never call an LLM.
function buildDescriptionLines(data) {
  const lines = [];
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

function statusForData(data) {
  const requiredOk =
    data.priceNGN &&
    data.location &&
    data.location !== EMPTY_FIELD &&
    data.bedrooms &&
    data.documentation &&
    data.documentation !== EMPTY_FIELD;
  if (data.reviewFlags && data.reviewFlags.length > 0) return "Needs Review";
  return requiredOk ? "Ready" : "Needs Review";
}

/* ------------------------------------------------------------------ */
/* Claude API calls (extraction + caption) — Layer 1 & 3 only.        */
/* Layer 2 (template render below) is 100% deterministic SVG.         */
/* ------------------------------------------------------------------ */

async function callClaude(system, userText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text;
}

async function extractPropertyData(briefText) {
  const system = `You extract structured property data from messy real-estate briefs for an internal tool. Respond with ONLY a raw JSON object, no markdown fences, no preamble.
Schema:
{
 "propertyTitle": string | "Not found",
 "propertyType": string | "Not found",
 "location": string | "Not found",
 "bedrooms": number | null,
 "bathrooms": number | null,
 "priceNGN": number | null,
 "furnished": true | false | null,
 "documentation": string | "Not found",
 "description": string | "Not found",
 "features": string[],
 "reviewFlags": string[]
}
Rules:
- NEVER invent information that is not present in the brief.
- If a field is missing entirely, use "Not found" (or null for numbers).
- If a field is present but ambiguous or conflicting, make your best-effort extraction AND add the field name to reviewFlags.
- priceNGN must be a plain integer in Naira (convert "120M" -> 120000000, strip currency symbols/commas).
- furnished must be null unless the brief explicitly states furnished status.
- features should be short factual tags only (e.g. "BQ", "Swimming pool", "24hr power") — only ones explicitly mentioned.`;
  const raw = await callClaude(system, `PROPERTY BRIEF:\n${briefText}`);
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

async function generateCaption(data, template, settings) {
  const filled = template
    .replaceAll("{{opening}}", `New listing from Buy 'n' Move In!`)
    .replaceAll("{{bedrooms}}", data.bedrooms ? String(data.bedrooms) : EMPTY_FIELD)
    .replaceAll("{{property_type}}", data.propertyType || EMPTY_FIELD)
    .replaceAll("{{location}}", data.location || EMPTY_FIELD)
    .replaceAll("{{description}}", data.description && data.description !== EMPTY_FIELD ? data.description : "")
    .replaceAll("{{price_naira}}", formatNairaFull(data.priceNGN))
    .replaceAll("{{price_usd}}", formatUsd(data.priceNGN, settings.usdRate) || EMPTY_FIELD)
    .replaceAll("{{documentation}}", data.documentation || EMPTY_FIELD)
    .replaceAll("{{phone}}", FIXED_CONTACT.phone)
    .replaceAll("{{website}}", FIXED_CONTACT.website)
    .replaceAll("{{email}}", FIXED_CONTACT.email)
    .replaceAll("{{instagram}}", FIXED_CONTACT.instagram);

  // Ask Claude only to lightly polish tone/flow of the *opening* line using verified
  // data — it must not add facts. We keep this optional and fall back to the
  // deterministic fill above if the call fails.
  try {
    const system = `You polish a single opening sentence for a real-estate Instagram caption. You are given VERIFIED facts only. Do not add any fact not listed. Respond with ONLY the one-sentence opening, no quotes, no markdown.`;
    const userText = `Facts: ${data.bedrooms || "?"} bedroom ${data.propertyType || "property"} in ${data.location || "?"}. Furnished: ${data.furnished === true ? "yes" : data.furnished === false ? "no" : "unknown"}.`;
    const opening = await callClaude(system, userText);
    if (opening && opening.length < 200) {
      return filled.replace(`New listing from Buy 'n' Move In!`, opening.trim());
    }
  } catch (e) {
    /* fall back silently to deterministic caption */
  }
  return filled;
}

/* ------------------------------------------------------------------ */
/* Persistent storage helpers                                         */
/* ------------------------------------------------------------------ */

async function savePropertyToStorage(property) {
  try {
    await window.storage.set(`property:${property.id}`, JSON.stringify(property), false);
    const listRes = await safeGet("property-index");
    const ids = listRes ? JSON.parse(listRes.value) : [];
    if (!ids.includes(property.id)) ids.unshift(property.id);
    await window.storage.set("property-index", JSON.stringify(ids), false);
  } catch (e) {
    console.error("Storage save failed", e);
  }
}

async function safeGet(key, shared = false) {
  try {
    return await window.storage.get(key, shared);
  } catch (e) {
    return null;
  }
}

async function loadAllProperties() {
  try {
    const idxRes = await safeGet("property-index");
    const ids = idxRes ? JSON.parse(idxRes.value) : [];
    const props = [];
    for (const id of ids) {
      const res = await safeGet(`property:${id}`);
      if (res) props.push(JSON.parse(res.value));
    }
    return props;
  } catch (e) {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Template render — Layer 2. Pure SVG, deterministic, no AI.         */
/* ------------------------------------------------------------------ */

const CANVAS_W = 1080;
const CANVAS_H = 1350;

function PropertyCreativeSvg({ data, settings, svgRef, primaryImage, logoUrl }) {
  const priceNaira = formatNaira(data.priceNGN) || "PRICE";
  const priceUsd = formatUsd(data.priceNGN, settings.usdRate) || "USD";
  const descLines = buildDescriptionLines(data);
  const bedroomNum = data.bedrooms || "-";
  const locationText = (data.location || EMPTY_FIELD).toUpperCase();
  const docText = (data.documentation || EMPTY_FIELD).toUpperCase();

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "#111", borderRadius: 8, display: "block" }}
    >
      <defs>
        <clipPath id="photoClip">
          <rect x="0" y="0" width={CANVAS_W} height="980" />
        </clipPath>
      </defs>

      {/* PHOTO AREA (variable: propertyImage) */}
      <g clipPath="url(#photoClip)">
        {primaryImage ? (
          <image
            href={primaryImage}
            x="0"
            y="0"
            width={CANVAS_W}
            height="980"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <rect x="0" y="0" width={CANVAS_W} height="980" fill="#D9D9D9" />
        )}
      </g>
      {!primaryImage && (
        <text x={CANVAS_W / 2} y="500" textAnchor="middle" fill="#888" fontSize="28" fontFamily="sans-serif">
          No primary image selected
        </text>
      )}

      {/* LOGO (fixed) */}
      {logoUrl ? (
        <image href={logoUrl} x="40" y="40" width="260" height="100" preserveAspectRatio="xMidYMid meet" />
      ) : (
        <g>
          <rect x="40" y="40" width="300" height="100" rx="20" fill="#fff" />
          <text x="60" y="88" fontFamily="sans-serif" fontWeight="800" fontSize="30" fill={NAVY}>
            buy'n'move
          </text>
          <circle cx="278" cy="78" r="20" fill={ORANGE} />
          <text x="268" y="86" fontFamily="sans-serif" fontWeight="800" fontSize="20" fill="#fff">
            in
          </text>
          <text x="60" y="112" fontFamily="sans-serif" fontStyle="italic" fontSize="14" fill="#555">
            ...live anywhere
          </text>
        </g>
      )}

      {/* FURNISHED BADGE (variable: visibility only) */}
      {data.furnished === true && (
        <g>
          <rect x="760" y="40" width="280" height="66" rx="33" fill={ORANGE} />
          <text
            x="900"
            y="82"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontWeight="800"
            fontSize="26"
            fill="#fff"
          >
            FURNISHED
          </text>
        </g>
      )}

      {/* BEDROOM / DESCRIPTION BLOCK (fixed shape, variable number+text) */}
      <rect x="0" y="980" width="560" height="270" fill={NAVY} />
      <text x="55" y="1225" fontFamily="sans-serif" fontWeight="900" fontSize="190" fill={ORANGE}>
        {bedroomNum}
      </text>
      {descLines.map((line, i) => (
        <text
          key={i}
          x="300"
          y={1040 + i * 48}
          fontFamily="sans-serif"
          fontWeight="800"
          fontSize="38"
          fill="#fff"
        >
          {line}
        </text>
      ))}

      {/* LOCATION BAR (fixed shape, variable text) */}
      <rect x="560" y="980" width="520" height="90" fill="#000" opacity="0.78" />
      <circle cx="605" cy="1023" r="12" fill={ORANGE} />
      <text
        x="640"
        y="1035"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="32"
        fill="#fff"
      >
        {locationText.length > 26 ? locationText.slice(0, 24) + "…" : locationText}
      </text>

      {/* PRICE BLOCK (fixed shape, variable value) */}
      <rect x="560" y="1070" width="520" height="110" fill="#fff" />
      <text x="580" y="1103" fontFamily="sans-serif" fontWeight="700" fontSize="22" fill={NAVY}>
        PRICE:
      </text>
      <text x="580" y="1165" fontFamily="sans-serif" fontWeight="900" fontSize="64" fill={NAVY}>
        {priceNaira}
      </text>

      {/* USD STRIP (fixed shape, variable value) */}
      <rect x="560" y="1180" width="520" height="70" fill={ORANGE} />
      <text x="580" y="1226" fontFamily="sans-serif" fontWeight="800" fontSize="36" fill="#fff">
        {priceUsd}
      </text>

      {/* DOCUMENTATION BAR (fixed shape, variable text) */}
      <rect x="0" y="1250" width={CANVAS_W} height="50" fill="#ECECEC" />
      <text
        x={CANVAS_W / 2}
        y="1283"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="26"
        fill={NAVY}
      >
        {docText}
      </text>

      {/* FOOTER (fixed, company constants — never overwritten by property data) */}
      <rect x="0" y="1300" width={CANVAS_W} height="50" fill="#fff" />
      <text x="30" y="1332" fontFamily="sans-serif" fontSize="20" fill={NAVY}>
        📸 {FIXED_CONTACT.instagram}
      </text>
      <text x="330" y="1332" fontFamily="sans-serif" fontSize="20" fill={NAVY}>
        📞 {FIXED_CONTACT.phone}
      </text>
      <text x="610" y="1332" fontFamily="sans-serif" fontSize="20" fill={NAVY}>
        🌐 {FIXED_CONTACT.website}
      </text>
      <text x="870" y="1332" fontFamily="sans-serif" fontSize="18" fill={NAVY}>
        ✉ {FIXED_CONTACT.email}
      </text>
    </svg>
  );
}

async function svgToPngBlob(svgEl) {
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new window.Image();
  const loaded = new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  img.src = url;
  await loaded;
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
  URL.revokeObjectURL(url);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                     */
/* ------------------------------------------------------------------ */

function Field({ label, value, onChange, warn, type = "text" }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.4,
          color: warn ? "#B45309" : "#555",
          marginBottom: 5,
          textTransform: "uppercase",
        }}
      >
        {label}
        {warn && <AlertTriangle size={13} />}
      </div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? e.target.value.replace(/[^0-9]/g, "") : e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: 8,
          border: warn ? "1.5px solid #F59E0B" : "1.5px solid #E2E2E2",
          fontSize: 14,
          background: warn ? "#FFFBEB" : "#fff",
          outline: "none",
        }}
      />
    </label>
  );
}

function Pill({ children, color }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 20,
        background: color + "22",
        color,
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, variant = "primary", disabled, style, icon: Icon }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 18px",
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "opacity .15s",
  };
  const variants = {
    primary: { background: NAVY, color: "#fff" },
    accent: { background: ORANGE, color: "#fff" },
    ghost: { background: "#F3F4F6", color: "#111" },
    outline: { background: "#fff", color: NAVY, border: `1.5px solid ${NAVY}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* New Property wizard                                                */
/* ------------------------------------------------------------------ */

function NewPropertyFlow({ settings, onComplete, onCancel }) {
  const [step, setStep] = useState("brief"); // brief -> review -> kit
  const [briefUrl, setBriefUrl] = useState("");
  const [briefText, setBriefText] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [images, setImages] = useState([]); // {id, url, name}
  const [primaryId, setPrimaryId] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [data, setData] = useState(null);
  const [generating, setGenerating] = useState("");
  const [caption, setCaption] = useState("");
  const [property, setProperty] = useState(null);
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);

  async function handleFetchBriefUrl() {
    if (!briefUrl.trim()) return;
    setUrlLoading(true);
    setUrlError("");
    try {
      const res = await fetch(briefUrl);
      const text = await res.text();
      const stripped = text
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!stripped) throw new Error("empty");
      setBriefText(stripped.slice(0, 6000));
    } catch (e) {
      setUrlError("Couldn't retrieve that URL directly (often blocked by the site). Paste the brief text below instead.");
    } finally {
      setUrlLoading(false);
    }
  }

  async function handleImageUpload(fileList) {
    const files = Array.from(fileList).filter((f) => /image\/(jpeg|jpg|png|webp)/.test(f.type));
    const newImgs = [];
    for (const f of files) {
      const url = await fileToDataUrl(f);
      newImgs.push({ id: uid(), url, name: f.name });
    }
    setImages((prev) => {
      const next = [...prev, ...newImgs];
      if (!primaryId && next.length) setPrimaryId(next[0].id);
      return next;
    });
  }

  function moveImage(id, dir) {
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  }

  function deleteImage(id) {
    setImages((prev) => prev.filter((i) => i.id !== id));
    if (primaryId === id) setPrimaryId(null);
  }

  async function handleExtract() {
    if (!briefText.trim()) {
      setExtractError("Paste a property brief first.");
      return;
    }
    setExtracting(true);
    setExtractError("");
    try {
      const result = await extractPropertyData(briefText);
      setData(result);
      setStep("review");
    } catch (e) {
      setExtractError("Extraction failed — the brief may be too unstructured. You can still fill the fields manually below.");
      setData({
        propertyTitle: EMPTY_FIELD,
        propertyType: EMPTY_FIELD,
        location: EMPTY_FIELD,
        bedrooms: null,
        bathrooms: null,
        priceNGN: null,
        furnished: null,
        documentation: EMPTY_FIELD,
        description: EMPTY_FIELD,
        features: [],
        reviewFlags: [],
      });
      setStep("review");
    } finally {
      setExtracting(false);
    }
  }

  function updateField(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const primaryImage = images.find((i) => i.id === primaryId)?.url || null;

  async function handleConfirmGenerate() {
    if (!primaryImage) {
      setExtractError("Please select a primary property image before generating.");
      return;
    }
    setExtractError("");
    setGenerating("Preparing template...");
    await new Promise((r) => setTimeout(r, 250));
    setGenerating("Generating creative...");
    await new Promise((r) => setTimeout(r, 250));
    setGenerating("Generating caption...");
    let cap = "";
    try {
      cap = await generateCaption(data, settings.captionTemplate, settings);
    } catch (e) {
      cap = "Caption generation failed — you can write one manually.";
    }
    setCaption(cap);
    setGenerating("");
    const prop = {
      id: uid(),
      data,
      images,
      primaryId,
      caption: cap,
      status: statusForData(data),
      createdAt: new Date().toISOString(),
      briefText,
      briefUrl,
    };
    setProperty(prop);
    await savePropertyToStorage(prop);
    setStep("kit");
  }

  async function handleDownload() {
    if (!svgRef.current) return;
    const blob = await svgToPngBlob(svgRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.propertyTitle || "property").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare(platformHint) {
    if (!svgRef.current) return;
    const blob = await svgToPngBlob(svgRef.current);
    const file = new File([blob], "property-creative.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: data.propertyTitle || "Property creative" });
        return;
      } catch (e) {
        /* user cancelled or share failed — fall through to download */
      }
    }
    handleDownload();
  }

  function copyCaption() {
    navigator.clipboard?.writeText(caption);
  }

  /* ---------------- Steps UI ---------------- */

  if (step === "brief") {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <BackBar onCancel={onCancel} title="New Property" />

        <SectionCard title="1. Property brief">
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              placeholder="Paste property brief URL"
              value={briefUrl}
              onChange={(e) => setBriefUrl(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1.5px solid #E2E2E2", fontSize: 14 }}
            />
            <Button variant="outline" icon={LinkIcon} onClick={handleFetchBriefUrl} disabled={urlLoading}>
              {urlLoading ? "Fetching…" : "Extract Brief"}
            </Button>
          </div>
          {urlError && <Notice tone="warn">{urlError}</Notice>}

          <div style={{ fontSize: 12, color: "#888", margin: "14px 0 8px" }}>— or paste the raw brief —</div>
          <textarea
            placeholder="Paste property brief here (bedrooms, location, price, documentation, description, features...)"
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            rows={9}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 12,
              borderRadius: 8,
              border: "1.5px solid #E2E2E2",
              fontSize: 14,
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </SectionCard>

        <SectionCard title="2. Property images">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleImageUpload(e.dataTransfer.files);
            }}
            style={{
              border: "2px dashed #D6D6D6",
              borderRadius: 10,
              padding: 26,
              textAlign: "center",
              cursor: "pointer",
              color: "#888",
              marginBottom: images.length ? 16 : 0,
            }}
          >
            <Upload size={22} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 14 }}>Drag & drop images here, or click to browse</div>
            <div style={{ fontSize: 12, marginTop: 3 }}>JPG, JPEG, PNG, WEBP</div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => handleImageUpload(e.target.files)}
            />
          </div>

          {images.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    width: 120,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: img.id === primaryId ? `2.5px solid ${ORANGE}` : "1.5px solid #E2E2E2",
                    position: "relative",
                  }}
                >
                  <img src={img.url} alt={img.name} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                  {img.id === primaryId && (
                    <div style={{ position: "absolute", top: 4, left: 4, background: ORANGE, borderRadius: 4, padding: "1px 5px" }}>
                      <Star size={11} color="#fff" fill="#fff" />
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 5px", background: "#FAFAFA" }}>
                    <button title="Set primary" onClick={() => setPrimaryId(img.id)} style={iconBtnStyle}>
                      <Star size={13} />
                    </button>
                    <button title="Up" onClick={() => moveImage(img.id, -1)} style={iconBtnStyle} disabled={idx === 0}>
                      <ArrowUp size={13} />
                    </button>
                    <button title="Down" onClick={() => moveImage(img.id, 1)} style={iconBtnStyle} disabled={idx === images.length - 1}>
                      <ArrowDown size={13} />
                    </button>
                    <button title="Delete" onClick={() => deleteImage(img.id)} style={iconBtnStyle}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {images.length > 0 && !primaryId && <Notice tone="warn">Please select a primary property image (star icon).</Notice>}
        </SectionCard>

        {extractError && <Notice tone="warn">{extractError}</Notice>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <Button icon={extracting ? Loader2 : Sparkles} onClick={handleExtract} disabled={extracting}>
            {extracting ? "Extracting…" : "Extract Property Details"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "review") {
    const flags = new Set(data.reviewFlags || []);
    const isMissing = (v) => v === null || v === undefined || v === EMPTY_FIELD || v === "";
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <BackBar onCancel={() => setStep("brief")} title="Review extracted details" backLabel="Back to brief" />
        <SectionCard title="Verify before generating">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field label="Property title" value={data.propertyTitle} onChange={(v) => updateField("propertyTitle", v)} warn={isMissing(data.propertyTitle)} />
            <Field label="Property type" value={data.propertyType} onChange={(v) => updateField("propertyType", v)} warn={isMissing(data.propertyType) || flags.has("propertyType")} />
            <Field label="Location" value={data.location} onChange={(v) => updateField("location", v)} warn={isMissing(data.location) || flags.has("location")} />
            <Field label="Bedrooms" type="number" value={data.bedrooms} onChange={(v) => updateField("bedrooms", v ? Number(v) : null)} warn={isMissing(data.bedrooms)} />
            <Field label="Price (NGN)" type="number" value={data.priceNGN} onChange={(v) => updateField("priceNGN", v ? Number(v) : null)} warn={isMissing(data.priceNGN) || flags.has("priceNGN")} />
            <Field label="Documentation" value={data.documentation} onChange={(v) => updateField("documentation", v)} warn={isMissing(data.documentation) || flags.has("documentation")} />
          </div>

          <label style={{ display: "block", margin: "6px 0 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 5, textTransform: "uppercase" }}>Furnished</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                ["Yes", true],
                ["No", false],
                ["Unknown", null],
              ].map(([label, val]) => (
                <button
                  key={label}
                  onClick={() => updateField("furnished", val)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    border: data.furnished === val ? `2px solid ${ORANGE}` : "1.5px solid #E2E2E2",
                    background: data.furnished === val ? "#FFF4E9" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>

          <Field label="Description" value={data.description} onChange={(v) => updateField("description", v)} warn={isMissing(data.description)} />
          <Field label="Features (comma separated)" value={(data.features || []).join(", ")} onChange={(v) => updateField("features", v.split(",").map((s) => s.trim()).filter(Boolean))} />

          {flags.size > 0 && (
            <Notice tone="warn">Needs review: {[...flags].join(", ")} — double-check these before generating.</Notice>
          )}
        </SectionCard>

        <SectionCard title="Live preview">
          <div style={{ maxWidth: 320 }}>
            <PropertyCreativeSvg data={data} settings={settings} svgRef={svgRef} primaryImage={primaryImage} logoUrl={settings.logoUrl} />
          </div>
        </SectionCard>

        {extractError && <Notice tone="warn">{extractError}</Notice>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          {generating ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#666", fontSize: 14 }}>
              <Loader2 size={16} className="spin" /> {generating}
            </div>
          ) : (
            <Button icon={Check} onClick={handleConfirmGenerate}>
              Confirm & Generate
            </Button>
          )}
        </div>
      </div>
    );
  }

  // step === "kit"
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <BackBar onCancel={onCancel} title="Property marketing kit" backLabel="Back to dashboard" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", maxWidth: 380 }}>
          <PropertyCreativeSvg data={data} settings={settings} svgRef={svgRef} primaryImage={primaryImage} logoUrl={settings.logoUrl} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Button icon={Download} onClick={handleDownload} variant="outline">
              Download
            </Button>
            <Button icon={Share2} onClick={() => handleShare("instagram")} variant="accent">
              Share to Instagram
            </Button>
            <Button icon={Share2} onClick={() => handleShare("whatsapp")} variant="ghost">
              Share to WhatsApp
            </Button>
          </div>
        </div>

        <div style={{ flex: "1 1 320px" }}>
          <SectionCard title="Instagram caption">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={12}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 12,
                borderRadius: 8,
                border: "1.5px solid #E2E2E2",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            <div style={{ marginTop: 10 }}>
              <Button icon={Copy} variant="outline" onClick={copyCaption}>
                Copy Caption
              </Button>
            </div>
          </SectionCard>
          <Notice tone="info">
            Instagram doesn't accept captions via automated handoff — share the image, then tap Copy Caption and paste it in before publishing.
          </Notice>
          <div style={{ marginTop: 14 }}>
            <Button variant="ghost" onClick={() => onComplete()}>
              Done — back to dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#555",
  padding: 2,
};

function BackBar({ onCancel, title, backLabel = "Cancel" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <button onClick={onCancel} style={{ ...iconBtnStyle, display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}>
        <ChevronLeft size={16} /> {backLabel}
      </button>
      <h2 style={{ margin: 0, fontSize: 19, color: NAVY }}>{title}</h2>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #ECECEC", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: NAVY, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Notice({ tone, children }) {
  const styles = {
    warn: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
    info: { bg: "#EFF6FF", border: "#BFDBFE", color: "#1E40AF" },
  }[tone];
  return (
    <div
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
        marginTop: 10,
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reopen an existing property's marketing kit                        */
/* ------------------------------------------------------------------ */

function SavedKitView({ property, settings, onBack }) {
  const [caption, setCaption] = useState(property.caption);
  const svgRef = useRef(null);
  const primaryImage = property.images?.find((i) => i.id === property.primaryId)?.url || null;

  async function handleDownload() {
    if (!svgRef.current) return;
    const blob = await svgToPngBlob(svgRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(property.data.propertyTitle || "property").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (!svgRef.current) return;
    const blob = await svgToPngBlob(svgRef.current);
    const file = new File([blob], "property-creative.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: property.data.propertyTitle || "Property creative" });
        return;
      } catch (e) {
        /* fall through to download */
      }
    }
    handleDownload();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <BackBar onCancel={onBack} title={property.data.propertyTitle || "Property marketing kit"} backLabel="Back to dashboard" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", maxWidth: 380 }}>
          <PropertyCreativeSvg data={property.data} settings={settings} svgRef={svgRef} primaryImage={primaryImage} logoUrl={settings.logoUrl} />
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Button icon={Download} onClick={handleDownload} variant="outline">
              Download
            </Button>
            <Button icon={Share2} onClick={handleShare} variant="accent">
              Share to Instagram
            </Button>
            <Button icon={Share2} onClick={handleShare} variant="ghost">
              Share to WhatsApp
            </Button>
          </div>
        </div>
        <div style={{ flex: "1 1 320px" }}>
          <SectionCard title="Instagram caption">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={12}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 12,
                borderRadius: 8,
                border: "1.5px solid #E2E2E2",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
            <div style={{ marginTop: 10 }}>
              <Button icon={Copy} variant="outline" onClick={() => navigator.clipboard?.writeText(caption)}>
                Copy Caption
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ properties, onNew, onOpen, loading }) {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: NAVY }}>Properties</h2>
          <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
            {properties.length} propert{properties.length === 1 ? "y" : "ies"} processed
          </div>
        </div>
        <Button icon={PlusCircle} onClick={onNew} variant="accent">
          New Property
        </Button>
      </div>

      {loading && <div style={{ color: "#888", fontSize: 14 }}>Loading…</div>}

      {!loading && properties.length === 0 && (
        <div
          style={{
            border: "1.5px dashed #E2E2E2",
            borderRadius: 12,
            padding: 50,
            textAlign: "center",
            color: "#999",
          }}
        >
          <Home size={28} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 15, marginBottom: 14 }}>No properties yet. Turn your first brief into a marketing kit.</div>
          <Button icon={PlusCircle} onClick={onNew}>
            New Property
          </Button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {properties.map((p) => {
          const primary = p.images?.find((i) => i.id === p.primaryId);
          return (
            <div
              key={p.id}
              onClick={() => onOpen(p)}
              style={{
                border: "1px solid #ECECEC",
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              <div style={{ height: 130, background: "#EEE" }}>
                {primary && <img src={primary.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 4 }}>
                  {p.data.propertyTitle && p.data.propertyTitle !== EMPTY_FIELD ? p.data.propertyTitle : "Untitled property"}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                  {p.data.location} · {formatNaira(p.data.priceNGN) || "—"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Pill color={STATUS_COLORS[p.status] || "#999"}>{p.status}</Pill>
                  <span style={{ fontSize: 11, color: "#AAA" }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings panel                                                      */
/* ------------------------------------------------------------------ */

function SettingsPanel({ settings, setSettings, onClose }) {
  const logoInputRef = useRef(null);
  async function handleLogoUpload(file) {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setSettings((s) => ({ ...s, logoUrl: url }));
  }
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: 400, maxWidth: "92vw", background: "#fff", height: "100%", padding: 24, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, color: NAVY }}>Settings</h3>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={20} />
          </button>
        </div>

        <SectionCard title="USD conversion">
          <Field label="Naira → USD rate" type="number" value={settings.usdRate} onChange={(v) => setSettings((s) => ({ ...s, usdRate: Number(v) || s.usdRate }))} />
          <div style={{ fontSize: 12, color: "#888" }}>USD price = Naira price ÷ this rate.</div>
        </SectionCard>

        <SectionCard title="Brand logo asset">
          <div style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
            Upload the real Buy 'n' Move In logo (transparent PNG) to replace the vector placeholder used in previews.
          </div>
          {settings.logoUrl && <img src={settings.logoUrl} alt="logo" style={{ height: 50, marginBottom: 10 }} />}
          <Button variant="outline" icon={ImageIcon} onClick={() => logoInputRef.current?.click()}>
            {settings.logoUrl ? "Replace logo" : "Upload logo"}
          </Button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png"
            style={{ display: "none" }}
            onChange={(e) => handleLogoUpload(e.target.files[0])}
          />
        </SectionCard>

        <SectionCard title="Caption template">
          <textarea
            value={settings.captionTemplate}
            onChange={(e) => setSettings((s) => ({ ...s, captionTemplate: e.target.value }))}
            rows={12}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 10,
              borderRadius: 8,
              border: "1.5px solid #E2E2E2",
              fontSize: 13,
              fontFamily: "monospace",
              resize: "vertical",
            }}
          />
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
            Placeholders: {"{{opening}} {{bedrooms}} {{property_type}} {{location}} {{description}} {{price_naira}} {{price_usd}} {{documentation}} {{phone}} {{website}} {{email}} {{instagram}}"}
          </div>
        </SectionCard>

        <SectionCard title="Fixed footer contact (company constants)">
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.9 }}>
            📸 {FIXED_CONTACT.instagram}
            <br />
            📞 {FIXED_CONTACT.phone}
            <br />
            🌐 {FIXED_CONTACT.website}
            <br />
            ✉ {FIXED_CONTACT.email}
          </div>
          <div style={{ fontSize: 11, color: "#AAA", marginTop: 8 }}>
            Company contact info is fixed by design — it's never pulled from a property brief.
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root app                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | new | kit
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    usdRate: 1400,
    captionTemplate: DEFAULT_CAPTION_TEMPLATE,
    logoUrl: null,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    const props = await loadAllProperties();
    setProperties(props);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F7F7F8", minHeight: "100vh", color: "#111" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .spin { animation: spin 1s linear infinite; }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 28px",
          borderBottom: "1px solid #ECECEC",
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home size={18} color={ORANGE} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: NAVY, lineHeight: 1.1 }}>Buy 'n' Move In</div>
            <div style={{ fontSize: 11, color: "#999" }}>Marketing automation</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <NavBtn active={view === "dashboard"} onClick={() => setView("dashboard")} icon={LayoutDashboard} label="Dashboard" />
          <NavBtn active={view === "new"} onClick={() => setView("new")} icon={PlusCircle} label="New Property" />
          <NavBtn active={false} onClick={() => setSettingsOpen(true)} icon={SettingsIcon} label="Settings" />
        </div>
      </div>

      <div style={{ padding: "28px 20px 60px" }}>
        {view === "dashboard" && (
          <Dashboard
            properties={properties}
            loading={loading}
            onNew={() => setView("new")}
            onOpen={(p) => {
              setSelectedProperty(p);
              setView("kit");
            }}
          />
        )}
        {view === "new" && (
          <NewPropertyFlow
            settings={settings}
            onCancel={() => setView("dashboard")}
            onComplete={async () => {
              await refresh();
              setView("dashboard");
            }}
          />
        )}
        {view === "kit" && selectedProperty && (
          <SavedKitView property={selectedProperty} settings={settings} onBack={() => setView("dashboard")} />
        )}
      </div>

      {settingsOpen && <SettingsPanel settings={settings} setSettings={setSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function NavBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: active ? "#EEF2FF" : "transparent",
        color: active ? NAVY : "#666",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
# PropKit - Real Estate Flyer & Marketing Automation Generator

A modern Next.js web application engineered to transform raw real estate briefs (WhatsApp messages, PDF text, or agent notes) into pixel-perfect, branded 1080×1350 Instagram marketing flyers and captions.

---

## 🚀 Features

- **Raw Brief Extraction**: Intelligent extraction of property parameters (bedrooms, bathrooms, price, property type, location, title documents, amenities).
- **Multi-Brief Intake**: Support for processing up to 3 briefs simultaneously with image dropzones and thumbnail management.
- **Templates Library**:
  - **Signature Brand**: Classic high-impact Buy 'n' Move In layout with numeric bedroom counter, location bar, price box, and USD exchange strip.
  - **Luxury Editorial**: Magazine-style layout with full-bleed photo, serif typography, floating frosted glass card, and gold accents.
  - **Multi-Photo Showcase**: 3-photo layout featuring 1 hero exterior + 2 interior feature insets (living room, pool/kitchen).
  - **Minimalist Studio**: Architectural gallery layout with a clean outer white frame, structured spec columns, and crisp monochrome typography.
  - **Just Listed / Hot Deal**: High-energy urgency layout with a diagonal red "JUST LISTED" ribbon, bold price badge, and direct WhatsApp contact ribbon.
  - **Waterfront & Penthouse**: Deep oceanic gradient theme with panoramic framing, penthouse collection badge, and luxury amenities grid.
- **Precision Typography & Vectors**: 100% SVG-based rendering with dynamic font autosizing and line-wrapping to prevent text clipping.
- **Scaled PNG Export**: Client-side canvas exporter with 1x Standard (1080×1350) and 2x Ultra HD Retina (2160×2700) resolution options.
- **One-Click Caption Generator**: Formatted Instagram real estate captions with one-click copy.
- **Responsive Navigation**: Fixed left sidebar on desktop and slide-in drawer on mobile.
- **Local Persistence**: Browser `localStorage` storage for properties, images, and settings.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) with Turbopack
- **UI Library**: React 19, Tailwind CSS v4
- **Icons**: Lucide React
- **Graphics & Export**: Pure SVG with HTML5 Canvas export engine

---

## 🏁 Getting Started

1. **Install dependencies**:
   ```bash
   cd template_generator
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

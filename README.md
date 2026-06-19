# Senate POS — Landing Page

A world-class, premium SaaS landing page for **Senate POS**, the complete
restaurant operating system. Built to sit between Toast POS, Square, Oracle
Micros, and Stripe in polish and clarity.

## ✨ Highlights

- **Dark luxury theme** (`#081120` / `#0F172A`) with a refined gold accent (`#D4AF37`)
- **Glassmorphism**, modern gradients, and smooth Framer Motion animations
- **Apple-level clean** typography (Sora display + Inter body)
- Fully **responsive** and **SEO optimized** (metadata, JSON-LD, sitemap, robots, OG image)
- Hand-built device mockups (Back Office, Windows/Mobile POS, Kitchen Display) — no image assets required

## 🧱 Sections

1. Hero with multi-device showcase
2. Trusted By (logo marquee + stats)
3. Product Ecosystem (interactive cards)
4. Screenshots Showcase (interactive device tabs)
5. Platform Features
6. Workflow (order → POS → KDS → prep → payment → reporting)
7. Animated statistics counters
8. Testimonials
9. Pricing (Starter / Business / Enterprise)
10. Final CTA
11. Footer

## 🛠 Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm run start
```

## 📁 Structure

```
app/
  layout.tsx          # SEO metadata, fonts, JSON-LD
  page.tsx            # Section composition
  globals.css         # Design system (Tailwind v4 theme + utilities)
  opengraph-image.tsx # Dynamic OG image
  sitemap.ts / robots.ts / manifest.ts
components/
  Navbar, Hero, TrustedBy, Ecosystem, Screenshots, Features,
  Workflow, Stats, Testimonials, Pricing, FinalCTA, Footer
  ui/                 # Reveal, SectionHeading, Mockups
lib/
  data.ts             # All marketing content
```

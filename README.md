# MOJATECH Electrical Enterprises — Website

Premium multipage corporate website for **MOJATECH Electrical Enterprises** (Lagos, Nigeria).
Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS**.

**Power. Safety. Control. Reliability.**

---

## 1. Quick start

```bash
npm install
npm run dev        # develop at http://localhost:3000
npm run build      # production build (verified passing)
npm start          # serve the production build
```

Requires Node.js 18.17+ (Node 20+ recommended).

## 2. What's inside

| Route | Page |
| --- | --- |
| `/` | Home — hero, scroll intro sequence, services, interactive system map, trust, projects, insights, final CTA |
| `/about` | About MOJATECH |
| `/services` | Services overview |
| `/services/electrical-engineering` | Electrical Engineering |
| `/services/solar-power` | Solar Power |
| `/services/security-safety` | Security & Safety |
| `/services/facility-management` | Facility Solutions |
| `/services/electrical-consultancy` | Electrical Consultancy |
| `/projects` + `/projects/[slug]` | Project archive + case-study pages |
| `/insights` + `/insights/[slug]` | Blog with 3 starter articles (FAQ + Article schema) |
| `/contact` | Contact page with production-ready form |
| `/sitemap.xml`, `/robots.txt` | Generated automatically |
| Custom 404 | "System not found" |

Every page has unique title, meta description, canonical URL, Open Graph/Twitter tags,
breadcrumbs and Schema.org structured data (Organization/LocalBusiness, WebSite,
Service, Article, FAQPage, BreadcrumbList, ContactPage).

## 3. Edit content in ONE place — `lib/data/`

You should not need to touch components to update the site:

- **`lib/data/company.ts`** — phone, WhatsApp, email, address, social links.
  Values still starting with `[ADD:` are treated as "not provided" and the related
  buttons/links are **hidden automatically** — nothing fake is ever shown.
- **`lib/data/services.ts`** — service names, copy, scope items, CTAs, metadata.
- **`lib/data/projects.ts`** — project records. The four entries included are
  **clearly-labelled editable templates** (`placeholder: true`). Fill in a real
  project, set `placeholder: false`, and the template banners disappear.
- **`lib/data/insights.ts`** — blog articles. Add an object → new page, metadata
  and sitemap entry appear automatically.

## 4. Replace image placeholders

Placeholders are designed frames that state exactly which photo belongs there
(e.g. `[Commercial Solar Installation Image]`). To use real photos:

1. Put images in `public/images/…`
2. Replace the relevant `<ImagePlaceholder …/>` with `next/image`:

```tsx
import Image from "next/image";
<Image src="/images/solar-project.jpg" alt="MOJATECH solar installation on a commercial roof in Lagos" width={1600} height={1200} className="border border-line object-cover" />
```

The official logo is already in place (`public/logo.jpeg`, also used as favicon) — untouched, as supplied.

## 5. Environment variables

Copy `.env.example` → `.env.local`:

- `NEXT_PUBLIC_SITE_URL` — your real domain (canonical URLs, sitemap, OG tags).
- `CONTACT_WEBHOOK_URL` — any endpoint accepting a JSON POST (Formspree, Basin,
  Make/Zapier webhook, custom mail API…). Until it's set, the form **honestly
  tells visitors it isn't connected** and shows direct contact options — it never
  fake-submits. The handler is isolated in `app/api/contact/route.ts`.

## 6. Deploy

Standard Next.js — deploys as-is to **Vercel** or **Netlify** (build command
`npm run build`). Set the two environment variables in the host dashboard.
After deploying: connect Google Search Console, submit `/sitemap.xml`, and link
your Google Business Profile.

## 7. Motion system (note)

Motion is delivered with CSS animations, SVG stroke animation and a lightweight
IntersectionObserver reveal system instead of GSAP/Lenis. Same cinematic result,
zero animation dependencies, smaller bundle, better Core Web Vitals, and
`prefers-reduced-motion` is fully respected. If you later want GSAP timelines,
`components/Reveal.tsx` is the single integration point to swap.

## 8. Honesty guarantees baked in

- No fabricated statistics, clients, awards, testimonials or certifications.
- Placeholder projects are labelled as templates on the site itself.
- Unset contact details are hidden, never invented.
- The contact form reports its real delivery status.

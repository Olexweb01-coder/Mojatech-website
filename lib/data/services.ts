/**
 * ------------------------------------------------------------------
 * MOJATECH — services
 * ------------------------------------------------------------------
 * Each entry drives the services overview, the interactive system map
 * and a dedicated SEO page at /services/[slug]. Edit copy here — no
 * component changes needed. Scope items are intentionally written as
 * editable, non-exaggerated descriptions: refine them to match the
 * exact services MOJATECH offers.
 * ------------------------------------------------------------------
 */

export type ServiceMotif =
  | "circuit"
  | "solar"
  | "scan"
  | "building"
  | "blueprint";

export interface Service {
  slug: string;
  name: string;
  navLabel: string;
  headline: string;
  short: string;
  intro: string;
  motif: ServiceMotif;
  metaTitle: string;
  metaDescription: string;
  cta: string;
  imageLabel: string;
  scope: { title: string; body: string }[];
  process?: string[];
  related: string[]; // slugs
}

export const services: Service[] = [
  {
    slug: "electrical-engineering",
    name: "Electrical Engineering",
    navLabel: "Electrical",
    headline: "Electrical systems engineered for reliability.",
    short: "Electrical installation, power distribution and building electrical systems.",
    intro:
      "From new installations to the maintenance of existing systems, MOJATECH approaches electrical work as engineering — planned, documented and built to perform safely under real conditions in Lagos.",
    motif: "circuit",
    metaTitle: "Electrical Engineering & Installation Services in Lagos | MOJATECH",
    metaDescription:
      "MOJATECH delivers electrical engineering and installation services in Lagos, Nigeria — power distribution, building electrical systems, maintenance and technical support engineered for reliability.",
    cta: "Plan your electrical project",
    imageLabel: "Electrical Distribution Panel / Installation Project Image",
    scope: [
      {
        title: "Electrical installation",
        body: "Complete electrical installations for residential, commercial and industrial spaces — wiring, fittings, protective devices and distribution built to a documented plan.",
      },
      {
        title: "Power distribution",
        body: "Distribution boards, load organisation and circuit protection arranged so power reaches every part of a building safely and predictably.",
      },
      {
        title: "Building electrical systems",
        body: "Lighting, sockets, control points and supporting electrical infrastructure coordinated with how the building is actually used.",
      },
      {
        title: "Maintenance & support",
        body: "Scheduled and on-demand maintenance that keeps installed systems dependable — identifying faults early instead of reacting to failures.",
      },
      {
        title: "Testing & inspection",
        body: "Practical checks on existing installations to confirm they are safe, correctly rated and performing as intended. (Edit this item to match the exact testing services MOJATECH offers.)",
      },
    ],
    process: ["Assess", "Design", "Install", "Test", "Support"],
    related: ["electrical-consultancy", "facility-management"],
  },
  {
    slug: "solar-power",
    name: "Solar Power",
    navLabel: "Solar",
    headline: "Smarter energy. Greater control.",
    short: "Solar energy systems and power solutions for homes and businesses.",
    intro:
      "Power supply should not decide your schedule. MOJATECH designs and installs solar power systems that give homes and businesses dependable energy and greater control over running costs.",
    motif: "solar",
    metaTitle: "Solar Power Systems & Installation in Lagos | MOJATECH",
    metaDescription:
      "Solar power solutions in Lagos, Nigeria by MOJATECH — system consultation, solar installation and energy efficiency support designed around your actual power needs.",
    cta: "Discuss your solar project",
    imageLabel: "Commercial or Residential Solar Installation Image",
    scope: [
      {
        title: "Solar solutions",
        body: "Solar power systems sized around your real consumption — not a one-size template — so the investment matches the need.",
      },
      {
        title: "System consultation",
        body: "An honest technical assessment of your load, site and options before any equipment is recommended.",
      },
      {
        title: "Installation",
        body: "Careful, safety-first installation of panels, power systems and associated electrical work by the same team that understands your building's wiring.",
      },
      {
        title: "Energy efficiency",
        body: "Practical guidance on reducing waste so the system you buy stays the right size for longer.",
      },
      {
        title: "Maintenance & support",
        body: "Periodic checks and support to keep the system producing as designed. (Edit to reflect the exact support MOJATECH provides.)",
      },
    ],
    process: ["Sun", "Solar array", "Power system", "Building", "Energy in use"],
    related: ["electrical-engineering", "electrical-consultancy"],
  },
  {
    slug: "security-safety",
    name: "Security & Safety",
    navLabel: "Security",
    headline: "Protection should be engineered.",
    short: "Security, surveillance and safety systems for buildings and facilities.",
    intro:
      "Security is not a camera on a wall — it is a system. MOJATECH plans, installs and supports security and safety systems as part of a building's overall infrastructure, so protection works together instead of in pieces.",
    motif: "scan",
    metaTitle: "Security & Safety Systems in Lagos | MOJATECH",
    metaDescription:
      "MOJATECH installs and supports security and safety systems in Lagos, Nigeria — surveillance, access control and building protection engineered as one coordinated system.",
    cta: "Protect your building",
    imageLabel: "Security Camera / Access Control Installation Image",
    scope: [
      {
        title: "CCTV & surveillance",
        body: "Camera systems positioned deliberately for coverage that matters, with clean cabling and reliable recording.",
      },
      {
        title: "Access control",
        body: "Controlling who enters what, and when — from single doors to multi-area buildings. (Edit to match MOJATECH's confirmed offering.)",
      },
      {
        title: "Safety systems",
        body: "Safety and protection systems for buildings, installed with the same electrical discipline as everything else MOJATECH does.",
      },
      {
        title: "Monitoring & building protection",
        body: "Keeping installed systems healthy and useful over time — a security system only counts if it is working the day you need it.",
      },
    ],
    related: ["facility-management", "electrical-engineering"],
  },
  {
    slug: "facility-management",
    name: "Facility Solutions",
    navLabel: "Facility",
    headline: "Keeping buildings working.",
    short: "General building management, coordination and facility support.",
    intro:
      "A building is a set of systems — power, lighting, security, safety, maintenance. MOJATECH provides general building management and facility solutions that keep those systems coordinated, maintained and dependable.",
    motif: "building",
    metaTitle: "Facility Management & Building Solutions in Lagos | MOJATECH",
    metaDescription:
      "General building management and facility solutions in Lagos, Nigeria — MOJATECH coordinates and maintains the technical systems that keep buildings working.",
    cta: "Discuss your facility",
    imageLabel: "Commercial Building / Facility Systems Image",
    scope: [
      {
        title: "Building systems coordination",
        body: "One technical partner across electrical, solar, security and safety systems — so responsibilities do not fall between vendors.",
      },
      {
        title: "Maintenance management",
        body: "Planned upkeep of building systems, catching issues before they become downtime.",
      },
      {
        title: "Facility support",
        body: "Responsive technical support for the day-to-day issues that keep a facility running.",
      },
      {
        title: "General building management",
        body: "Practical management support for building owners and managers. (Edit this item to reflect MOJATECH's exact management scope.)",
      },
    ],
    process: ["Power", "Lighting", "Security", "Safety", "Maintenance", "Control"],
    related: ["security-safety", "electrical-engineering"],
  },
  {
    slug: "electrical-consultancy",
    name: "Electrical Consultancy",
    navLabel: "Consultancy",
    headline: "Better systems start with better decisions.",
    short: "Professional electrical consultation and technical guidance.",
    intro:
      "Many expensive electrical problems are decisions made too early — the wrong capacity, the wrong layout, the wrong equipment. MOJATECH's consultancy work helps clients decide well before anything is bought or built.",
    motif: "blueprint",
    metaTitle: "Electrical Consultancy & Technical Guidance in Lagos | MOJATECH",
    metaDescription:
      "Professional electrical consultancy in Lagos, Nigeria — MOJATECH provides technical assessment, planning and guidance so electrical, solar and building-system decisions are made correctly the first time.",
    cta: "Speak with MOJATECH",
    imageLabel: "Engineering Consultation / Technical Planning Image",
    scope: [
      {
        title: "Technical assessment",
        body: "Understanding your existing systems, loads and constraints before recommending anything.",
      },
      {
        title: "Planning & guidance",
        body: "Clear, documented recommendations you can act on — with MOJATECH or independently.",
      },
      {
        title: "Project advisory",
        body: "Technical oversight during projects so what gets built matches what was planned.",
      },
    ],
    process: ["Assess", "Analyse", "Plan", "Implement", "Manage"],
    related: ["electrical-engineering", "solar-power"],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

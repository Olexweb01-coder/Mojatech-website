/**
 * ------------------------------------------------------------------
 * MOJATECH — insights (blog)
 * ------------------------------------------------------------------
 * Add a new article by adding an object to this array — no component
 * changes needed. Each article becomes a page at /insights/[slug]
 * with its own metadata, and is added to the sitemap automatically.
 *
 * `body` is an array of blocks rendered in order:
 *   { h: "Heading" }         → section heading
 *   { p: "Paragraph text" }  → paragraph
 *   { list: ["a", "b"] }     → bullet list
 * ------------------------------------------------------------------
 */

export type ArticleBlock =
  | { h: string }
  | { p: string }
  | { list: string[] };

export interface Article {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  author: string;
  date: string; // ISO date
  readingTime: string;
  excerpt: string;
  imageLabel: string;
  relatedServiceSlugs: string[];
  body: ArticleBlock[];
  faq?: { q: string; a: string }[];
}

export const articles: Article[] = [
  {
    slug: "signs-your-building-electrical-system-needs-attention",
    title: "Signs your building's electrical system needs attention",
    metaTitle: "Warning Signs of Electrical Problems in Buildings | MOJATECH Insights",
    metaDescription:
      "Flickering lights, warm sockets, tripping breakers — practical warning signs that a building's electrical system in Lagos needs professional attention, from MOJATECH.",
    category: "Electrical Engineering",
    author: "MOJATECH Editorial",
    date: "2026-01-12",
    readingTime: "4 min read",
    excerpt:
      "Electrical systems rarely fail without warning. These are the practical signs building owners and managers should never ignore.",
    imageLabel: "Electrical Distribution Board Inspection Image",
    relatedServiceSlugs: ["electrical-engineering", "electrical-consultancy"],
    body: [
      {
        p: "Electrical faults are rarely sudden. Most serious failures — and most electrical fires — are preceded by weeks or months of small warnings that get normalised because the lights still come on. Knowing what those warnings look like is the cheapest form of electrical safety available.",
      },
      { h: "Breakers that trip repeatedly" },
      {
        p: "A circuit breaker tripping once is the system doing its job. The same breaker tripping regularly is the system telling you something is wrong — an overloaded circuit, a failing appliance, or a fault developing in the wiring. Resetting it repeatedly without investigating treats the symptom and ignores the cause.",
      },
      { h: "Warm sockets, switches or panels" },
      {
        p: "Electrical accessories should not be warm to the touch. Heat at a socket or switch usually means a loose connection or an overloaded point, and loose connections get worse over time, not better.",
      },
      { h: "Flickering or dimming lights" },
      {
        p: "Occasional flicker when a heavy load starts can be normal. Persistent flickering, or lights that dim when appliances run, often points to loose wiring, undersized circuits or supply problems worth diagnosing properly.",
      },
      { h: "Burning smells and discoloured points" },
      {
        p: "A fishy or burning-plastic smell near sockets or the distribution board, or brown discolouration around outlets, is a stop-and-call-someone sign. Insulation breaking down under heat is one of the last stages before real damage.",
      },
      { h: "An undocumented system" },
      {
        p: "If nobody can say which breaker controls what, or the board is a mix of additions made over years by different hands, the system carries risk even if nothing is visibly wrong. Documentation and labelling are part of electrical safety, not paperwork.",
      },
      {
        p: "If any of these describe your building, a professional assessment is a small cost compared to what these warnings become when ignored. MOJATECH provides electrical inspection, correction and ongoing maintenance for buildings in Lagos.",
      },
    ],
    faq: [
      {
        q: "How often should a building's electrical system be inspected?",
        a: "It depends on the age, condition and use of the installation. Older buildings, buildings with heavy or changing loads, and commercial facilities benefit from more frequent checks. An initial assessment establishes a sensible schedule.",
      },
      {
        q: "Can I keep resetting a breaker that trips?",
        a: "You can, but you shouldn't make a habit of it. Repeated tripping means the circuit is being protected from something — find and fix the cause rather than overriding the warning.",
      },
    ],
  },
  {
    slug: "how-to-size-a-solar-system-for-your-actual-needs",
    title: "How to think about sizing a solar system for your actual needs",
    metaTitle: "Sizing a Solar Power System in Nigeria — A Practical Guide | MOJATECH",
    metaDescription:
      "Before buying solar in Lagos, understand your real load. A practical guide from MOJATECH on how solar systems are sized and why honest assessment saves money.",
    category: "Solar Energy",
    author: "MOJATECH Editorial",
    date: "2026-01-26",
    readingTime: "5 min read",
    excerpt:
      "The most expensive solar mistake is buying a system sized by guesswork. Here is how sizing actually works — before any equipment is mentioned.",
    imageLabel: "Rooftop Solar Panel Installation Image",
    relatedServiceSlugs: ["solar-power", "electrical-consultancy"],
    body: [
      {
        p: "Solar systems fail expectations for one main reason: they were sized by budget or by guesswork instead of by load. The panels, the batteries and the power electronics are all downstream of one question — what do you actually need to power, for how long?",
      },
      { h: "Start with the load, not the equipment" },
      {
        p: "Every appliance you want to run has a power rating and a running time. Multiplied together and added up, they describe your daily energy need. This number — not the size of your roof or your neighbour's system — is the foundation of a correct design.",
      },
      { h: "Separate essential from everything" },
      {
        p: "Powering everything all the time costs significantly more than powering what matters during outages. Deciding which loads are essential (lighting, refrigeration, work equipment) and which are optional lets a system be sized honestly and expanded later.",
      },
      { h: "Understand the difference between power and energy" },
      {
        list: [
          "Power (watts) is how much you can run at once — it sizes the inverter.",
          "Energy (watt-hours) is how long you can run it — it sizes the batteries and panels.",
        ],
      },
      {
        p: "A system can have a large inverter and still go flat by evening if storage was under-specified. Both numbers matter, separately.",
      },
      { h: "Leave room for reality" },
      {
        p: "Panels do not always see perfect sun, batteries should not be drained flat daily, and loads grow. A good design includes sensible margins rather than advertising theoretical maximums.",
      },
      {
        p: "This is exactly the assessment MOJATECH runs before recommending any solar equipment — an honest look at your load, your site and your options. If you are considering solar for a home or business in Lagos, start with the assessment, not the shopping list.",
      },
    ],
    faq: [
      {
        q: "Do I need to know my appliance ratings before a consultation?",
        a: "No — part of a proper consultation is measuring and estimating your real load with you. Bringing recent electricity usage information helps, but it isn't required.",
      },
    ],
  },
  {
    slug: "why-security-systems-fail-and-how-to-plan-one-that-doesnt",
    title: "Why security systems fail — and how to plan one that doesn't",
    metaTitle: "Planning Building Security Systems That Actually Work | MOJATECH",
    metaDescription:
      "Most security system failures are planning failures. MOJATECH on camera placement, power, maintenance and treating building security as an engineered system.",
    category: "Security Systems",
    author: "MOJATECH Editorial",
    date: "2026-02-09",
    readingTime: "4 min read",
    excerpt:
      "Cameras that recorded nothing, systems that were off when it mattered — most security failures were designed in from day one.",
    imageLabel: "CCTV Camera Installation on Commercial Building Image",
    relatedServiceSlugs: ["security-safety", "facility-management"],
    body: [
      {
        p: "When a security system fails, the failure is usually discovered at the worst possible moment — after an incident, when the footage is needed and isn't there. Almost always, the cause traces back to how the system was planned, powered or maintained, not to the equipment itself.",
      },
      { h: "Coverage is a plan, not a count" },
      {
        p: "Eight cameras pointed at convenient walls protect less than four cameras placed against a deliberate plan: entries, approaches, blind spots, and the points where identification actually matters. Placement should come from walking the site, not from the number on the box.",
      },
      { h: "Security equipment is electrical equipment" },
      {
        p: "Cameras, recorders and access systems are only as reliable as the power feeding them. Systems installed without thought for supply stability and backup are effectively designed to be off during exactly the conditions when incidents are more likely. Security planning and electrical planning belong together.",
      },
      { h: "Recording that nobody checks is a rumour" },
      {
        p: "Storage fills up, drives fail quietly, time stamps drift. A system needs someone responsible for periodically confirming it is actually recording, retaining and readable. This takes minutes — and it is the difference between having footage and believing you have footage.",
      },
      { h: "Maintenance is part of the system" },
      {
        p: "Dust on lenses, shifted brackets, corroded connectors — small physical degradation accumulates. Scheduled maintenance keeps a security installation at the capability it was bought for.",
      },
      {
        p: "MOJATECH plans and installs security and safety systems as part of a building's overall infrastructure — powered properly, placed deliberately and supported over time. If your building's protection has grown by improvisation, an assessment is the right first step.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/* The product catalogue.
 *
 * These are SAMPLES so the pages can be seen working. Every one of them will be
 * replaced from the admin page once the database is connected: the shape below is
 * exactly what the admin form saves, so nothing has to be rewritten.
 *
 * Prices are in naira. `was` draws the slashed old price, `bonus` prints the line
 * under the price, and `freeDelivery` shows the delivery badge.
 */

export type Product = {
  slug: string;
  name: string;
  category: "Solar" | "Inverters" | "Batteries" | "Security" | "Power quality" | "Lighting";
  short: string;              // one line, used in listings and in search results
  description: string;        // a paragraph, used on the product page
  price: number;
  was?: number;               // the slashed price, when there is an offer
  bonus?: string;             // e.g. "Installation included within Lagos and Ogun"
  freeDelivery?: boolean;
  inStock: boolean;
  includes: string[];         // what is in the box, or what the price covers
  specs: [string, string][];  // the table on the product page
  image: string;              // main photo (always the first of photos)
  photos?: string[];          // every photo, main first
  visible?: boolean;          // false hides it from the website, but keeps it in the admin
  sample?: boolean;           // marks the placeholder entries
};

const SAMPLE = true;

export const products: Product[] = [
  {
    slug: "5kva-hybrid-inverter", name: "5kVA hybrid inverter, 48V", category: "Inverters",
    short: "Runs a full home and charges from solar or the grid, with an instant changeover.",
    description:
      "A 5kVA, 48V hybrid inverter for a full household: lights, fans, fridge, television, and a pumping machine on a properly sized circuit. It charges from solar panels or the grid, and switches over the moment the grid drops, so nothing in the house blinks. Supplied, installed, tested and handed over by MOJATECH, with the load assessment done before anything is fitted.",
    price: 1250000, was: 1420000, bonus: "Installation and commissioning included within Lagos and Ogun",
    freeDelivery: true, inStock: true,
    includes: ["5kVA 48V hybrid inverter", "Load assessment before installation", "Installation, wiring and changeover", "Testing, commissioning and hand-over", "Support after hand-over"],
    specs: [["Capacity", "5kVA / 48V"], ["Charging", "Solar and grid (hybrid)"], ["Changeover", "Instant, no interruption"], ["Suits", "A full home or small office"], ["Warranty", "Manufacturer's warranty applies"]],
    image: "/stock/board.webp", sample: SAMPLE,
  },
  {
    slug: "200ah-lithium-battery", name: "200Ah lithium battery, 48V", category: "Batteries",
    short: "Deep discharge, fast charging and far more cycles than tubular.",
    description:
      "A 48V 200Ah lithium battery for homes and small businesses that need long backup without a room full of batteries. Lithium takes deeper discharge and charges faster than tubular, and lasts for many more cycles, which is why it costs more at the start and less over its life. MOJATECH sizes the bank around your actual load rather than selling by the unit.",
    price: 1850000, bonus: "Free load assessment before you buy",
    freeDelivery: true, inStock: true,
    includes: ["48V 200Ah lithium battery", "Battery management system", "Installation and cabling", "Testing and hand-over"],
    specs: [["Capacity", "200Ah at 48V"], ["Chemistry", "Lithium iron phosphate"], ["Depth of discharge", "Deep, as specified by the maker"], ["Suits", "Homes and small businesses"], ["Warranty", "Manufacturer's warranty applies"]],
    image: "/stock/automation.webp", sample: SAMPLE,
  },
  {
    slug: "solar-panel-550w", name: "550W monocrystalline solar panel", category: "Solar",
    short: "High-output panel for rooftop arrays, sized to your load, not by the piece.",
    description:
      "A 550W monocrystalline panel for rooftop arrays on homes, offices and small industry. How many you need comes from the load assessment: what must stay on, for how long, and what surges at start-up. We mount, cable and commission the array, then show you how it behaves on a cloudy day as well as a bright one.",
    price: 185000, was: 210000, freeDelivery: false, inStock: true,
    includes: ["550W monocrystalline panel", "Mounting advice for your roof type", "Array design as part of the system"],
    specs: [["Output", "550W"], ["Type", "Monocrystalline"], ["Use", "Rooftop arrays, homes and business"], ["Lifespan", "Panels typically serve for decades"], ["Warranty", "Manufacturer's warranty applies"]],
    image: "/stock/solar-roof.webp", sample: SAMPLE,
  },
  {
    slug: "solar-street-light-100w", name: "100W all-in-one solar street light", category: "Lighting",
    short: "Dusk-to-dawn lighting for compounds, estates and streets, with no wiring to run.",
    description:
      "An all-in-one solar street light: panel, battery, controller and lamp in a single housing, mounted on a pole. It charges through the day and lights from dusk to dawn, with motion sensing to hold brightness when nobody is around. Useful for compounds, estate roads, filling stations and church grounds, with no cable run and nothing added to your bill.",
    price: 320000, bonus: "Pole and installation quoted with the site visit",
    freeDelivery: false, inStock: true,
    includes: ["100W all-in-one solar street light", "Remote control", "Mounting bracket", "Installation, quoted per site"],
    specs: [["Output", "100W"], ["Charging", "Integrated solar panel"], ["Operation", "Dusk to dawn, with motion sensing"], ["Suits", "Compounds, estates, streets"], ["Warranty", "Manufacturer's warranty applies"]],
    image: "/stock/lagos-night.webp", sample: SAMPLE,
  },
  {
    slug: "4-camera-cctv-kit", name: "4-camera CCTV kit, installed", category: "Security",
    short: "Four cameras, recorder and storage, cabled properly and set up on your phone.",
    description:
      "A four-camera kit for a home or shop: cameras placed where they actually see faces and entries rather than rooftops, a recorder with storage sized for the days you want to keep, and the whole thing set up on your phone before we leave. MOJATECH walks the site first and marks the blind spots, because camera placement decides whether footage is useful.",
    price: 650000, was: 720000, bonus: "Phone setup and training included",
    freeDelivery: true, inStock: true,
    includes: ["4 cameras", "Recorder and hard drive", "Cabling and power", "Phone app setup", "Site walk-through before installation"],
    specs: [["Cameras", "4"], ["Recording", "Continuous, days depend on drive size"], ["Viewing", "On your phone, anywhere"], ["Suits", "Homes and shops"], ["Warranty", "Manufacturer's warranty applies"]],
    image: "/stock/cctv.webp", sample: SAMPLE,
  },
  {
    slug: "10kva-stabiliser", name: "10kVA automatic voltage stabiliser", category: "Power quality",
    short: "Holds voltage steady so appliances stop dying from the swings.",
    description:
      "A 10kVA automatic voltage stabiliser for buildings on a supply that swings high and low. It holds the output steady so air conditioners, fridges and electronics are not worn out by the fluctuation. Where the whole installation needs protecting rather than one appliance, we advise surge protection at the board instead, which the assessment settles.",
    price: 285000, freeDelivery: false, inStock: true,
    includes: ["10kVA automatic voltage stabiliser", "Connection to your board", "Testing and hand-over"],
    specs: [["Capacity", "10kVA"], ["Function", "Automatic voltage regulation"], ["Suits", "Homes and small businesses"], ["Warranty", "Manufacturer's warranty applies"]],
    image: "/stock/maintenance.webp", sample: SAMPLE,
  },
];

export const categories = ["Solar", "Inverters", "Batteries", "Security", "Power quality", "Lighting"] as const;

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");

/** How much is saved, when an old price is shown. */
export const saving = (p: Product) => (p.was && p.was > p.price ? Math.round(((p.was - p.price) / p.was) * 100) : 0);

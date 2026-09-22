export const company = {
  name: "MOJATECH Electrical Enterprises",
  short: "MOJATECH",
  tagline: "Powering your world.",
  url: "https://mojatechelectrical.com",
  registration: { authority: "Corporate Affairs Commission", number: "BN 2824770", year: "2019", date: "2019-03-14" },
  competency: "NEMSA electrical installation competency, Category C",
  contact: {
    phone: "+2348161683153",
    phoneDisplay: "0816 168 3153",
    phoneAlt: "+2349021103256",
    phoneAltDisplay: "0902 110 3256",
    email: "mojatech01@gmail.com",
    whatsapp: "https://wa.me/2348161683153",
    whatsappQuote: "https://wa.me/2348161683153?text=" + encodeURIComponent("Hello MOJATECH, I'd like a quote."),
  },
  address: { street: "21 Adeolubajo Street, off Ajegunle", region: "Ogun State", country: "NG" },
  areaServed: "Nigeria",
  social: ["https://www.instagram.com/mojatech/", "https://www.tiktok.com/@mojatechcom"],
  clients: ["Flour Mills NG", "NRS Lagos", "FIRS Lagos"],
} as const;

export const process: [string, string][] = [
  ["Load assessment", "We measure what your building actually runs."],
  ["System design", "Circuits, sizes and protection planned around that load."],
  ["Material selection", "Grade A cables and standard protection devices."],
  ["Installation", "Installed neatly, by our own team."],
  ["Testing and commissioning", "Tested and commissioned before hand-over."],
  ["Support after handover", "We stay reachable when you need us."],
];

export const why = [
  "Grade A cables and standard protection",
  "Projects delivered on schedule",
  "Technical support after handover",
  "Registered with CAC since 2019",
];

export type Project = { img: string; title: string; type: string; alt: string };
export const work: Project[] = [
  { img: "/work/ibeshe-road-solar.jpg", title: "Ibeshe Road", type: "Solar installation", alt: "MOJATECH technicians fitting solar panels on a rooftop on Ibeshe Road" },
  { img: "/work/flour-mills-electrical.jpg", title: "Flour Mills NG", type: "Full electrical project", alt: "MOJATECH team in safety gear on the Flour Mills Nigeria electrical project" },
  { img: "/work/ikorodu-inverter.jpg", title: "Ikorodu", type: "Inverter installation", alt: "MOJATECH technicians mounting and wiring inverters in Ikorodu" },
  { img: "/work/nrs-lagos-electrical.jpg", title: "NRS Lagos", type: "Full electrical installation", alt: "MOJATECH technicians on the NRS Lagos electrical installation" },
  { img: "/work/firs-lagos-electrical.jpg", title: "FIRS Lagos", type: "Full electrical installation", alt: "MOJATECH team installing wiring in the FIRS Lagos building" },
  { img: "/work/lagos-house-electrical.jpg", title: "Lagos State", type: "Full-house electrical works", alt: "MOJATECH technicians wiring the ceiling of a house in Lagos State" },
];

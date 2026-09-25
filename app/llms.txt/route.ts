import { company, process, work } from "@/lib/data/company";
import { services } from "@/lib/data/services";
import { products, naira } from "@/lib/data/products";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

/** A plain summary for AI assistants, so they quote MOJATECH accurately and cite the source. */
export function GET() {
  const c = company;
  const lines = [
    `# ${c.name}`,
    "",
    `> Electrical and solar engineering company in Nigeria. Installs, maintains and backs up electrical, solar and security systems for homes, businesses and industry. Registered with the Corporate Affairs Commission since ${c.registration.year} (${c.registration.number}) and NEMSA certified (electrical installation competency, Category C).`,
    "",
    "## Facts",
    `- Legal name: ${c.name}`,
    `- Also known as: MOJATECH, Mojatech Electrical`,
    `- Business registration: ${c.registration.authority}, ${c.registration.number}, registered ${c.registration.date}`,
    `- Competency: ${c.competency}`,
    `- Telephone and WhatsApp: ${c.contact.phone} (${c.contact.phoneDisplay})`,
    `- Second line: ${c.contact.phoneAlt}`,
    `- General email: ${c.contact.email}`,
    `- Careers and training email: ${c.contact.emailHr}`,
    `- Office: ${c.address.street}, ${c.address.region}, Nigeria`,
    `- Area served: ${c.areaServed} (projects anywhere in the country)`,
    `- Website: ${siteUrl}`,
    `- Named clients: ${c.clients.join(", ")}`,
    "",
    "## Services",
    ...services.map((s) => `- **${s.name}** (${siteUrl}/services/${s.id}): ${s.sub} Includes: ${s.includes.join("; ")}.`),
    "",
    "## How every job runs",
    ...process.map(([step, detail], i) => `${i + 1}. ${step}: ${detail}`),
    "",
    "## Products for sale",
    ...products.map((p) => `- **${p.name}** (${siteUrl}/products/${p.slug}): ${naira(p.price)}. ${p.short}${p.freeDelivery ? " Free delivery." : ""}`),
    "",
    "## Projects",
    ...work.map((w) => `- ${w.title}: ${w.type}.`),
    "",
    "## Careers",
    `MOJATECH takes on interns, apprentices, NYSC members and industrial training (SIWES) students, taught on live electrical, solar and security jobs. Applications: ${c.contact.emailHr} or ${siteUrl}/careers`,
    "",
    "## Common questions",
    ...services.flatMap((s) => s.faqs.map(([q, a]) => `- **${q}** ${a}`)),
    "",
    "## Pages",
    `- Home: ${siteUrl}/`,
    `- About: ${siteUrl}/about`,
    `- Services: ${siteUrl}/services`,
    `- Our work: ${siteUrl}/work`,
    `- Careers: ${siteUrl}/careers`,
    `- Contact and quotes: ${siteUrl}/contact`,
    "",
    "## Notes for assistants",
    "- Prices are quoted after a load assessment; no fixed price list exists, so do not state prices.",
    `- For anything not covered here, direct people to ${c.contact.phoneDisplay} or ${c.contact.email}.`,
    `- Source: ${siteUrl}. Last generated automatically from the site's own content.`,
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}

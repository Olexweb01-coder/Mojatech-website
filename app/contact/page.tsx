import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import { buildMetadata } from "@/lib/seo";
import {
  company,
  isProvided,
  phoneHref,
  whatsappHref,
  emailHref,
  siteUrl,
} from "@/lib/data/company";

export const metadata: Metadata = buildMetadata({
  title: "Contact MOJATECH — Request a Consultation in Lagos",
  description:
    "Start an electrical, solar, security, safety or facility project with MOJATECH in Lagos, Nigeria. Send a project request or reach the team directly.",
  path: "/contact",
});

export default function ContactPage() {
  const tel = phoneHref();
  const wa = whatsappHref();
  const mail = emailHref();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: `${siteUrl}/contact`,
    name: "Contact MOJATECH",
    about: { "@id": `${siteUrl}/#organization` },
  };

  const channels = [
    tel && { label: "Call", value: company.contact.phone, href: tel, external: false },
    wa && { label: "WhatsApp", value: "Chat with MOJATECH", href: wa, external: true },
    mail && { label: "Email", value: company.contact.email, href: mail, external: false },
  ].filter(Boolean) as { label: string; value: string; href: string; external: boolean }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        eyebrow="Contact"
        title="Let's build something reliable."
        lead="Describe the project — a building, a problem, an idea — and MOJATECH will come back with an honest technical view and the right next step."
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <section className="relative py-20 sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <ContactForm />
            </Reveal>
          </div>

          <aside className="lg:col-span-5">
            <div className="space-y-6 lg:sticky lg:top-28">
              {channels.length > 0 ? (
                <div className="border border-line bg-panel/50 p-7">
                  <p className="label-tech">Direct lines</p>
                  <ul className="mt-5 space-y-4">
                    {channels.map((c) => (
                      <li key={c.label}>
                        <a
                          href={c.href}
                          className="group flex items-center justify-between gap-4"
                          {...(c.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          data-cursor="Connect"
                        >
                          <span>
                            <span className="label-tech label-tech--plain block text-steel/80">
                              {c.label}
                            </span>
                            <span className="link-line mt-1 inline-block text-paper/90">
                              {c.value}
                            </span>
                          </span>
                          <span className="btn-arrow text-steel">→</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="border border-line bg-panel/50 p-7">
                  <p className="label-tech">Direct lines</p>
                  <p className="mt-4 text-sm leading-relaxed text-steel">
                    Direct phone, WhatsApp and email links appear here automatically once
                    the site owner adds real contact details in{" "}
                    <code className="text-paper/70">lib/data/company.ts</code>.
                  </p>
                </div>
              )}

              <div className="relative overflow-hidden border border-line bg-panel/50 p-7">
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-40"
                  viewBox="0 0 200 200"
                  fill="none"
                >
                  <path d="M0 60 H120 V140 H200" stroke="rgba(244,245,247,0.15)" strokeWidth="1.5" />
                  <path d="M0 60 H120 V140 H200" stroke="#C8102E" strokeWidth="1.5" className="current" />
                  <circle cx="120" cy="140" r="4" fill="#5A5FF0" className="node-pulse" />
                </svg>
                <p className="label-tech label-tech--blue">Service area</p>
                <p className="display mt-3 text-2xl">
                  {company.location.city}, {company.location.country}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-steel">
                  {isProvided(company.contact.address)
                    ? company.contact.address
                    : "Serving homes, businesses and facilities across Lagos."}
                </p>
              </div>

              <div className="border border-line bg-panel/50 p-7">
                <p className="label-tech">What happens next</p>
                <ol className="mt-5 space-y-4">
                  {[
                    "MOJATECH reviews your request.",
                    "You get a response with clarifying questions or an honest first view.",
                    "Where useful, a site visit or consultation is arranged.",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-4 text-sm leading-relaxed text-steel">
                      <span
                        aria-hidden="true"
                        className="node-pulse mt-1 block h-2 w-2 shrink-0 rounded-full bg-brand-red"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      />
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

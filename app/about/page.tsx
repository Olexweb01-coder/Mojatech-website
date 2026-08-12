import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import CTASection from "@/components/CTASection";
import { buildMetadata } from "@/lib/seo";
import { company } from "@/lib/data/company";
import { services } from "@/lib/data/services";

export const metadata: Metadata = buildMetadata({
  title: "About MOJATECH Electrical Enterprises | Engineering Company in Lagos",
  description:
    "MOJATECH Electrical Enterprises is a Lagos-based engineering company delivering electrical, solar, security, safety, consultancy and facility solutions with one standard: reliability.",
  path: "/about",
});

const commitments = [
  {
    title: "Reliability",
    body: "A system that works most of the time is a system that fails. MOJATECH designs, installs and maintains for dependable operation under real conditions.",
  },
  {
    title: "Safety",
    body: "Every installation is treated as something people will live and work beside for years. Safe practice is non-negotiable at every stage.",
  },
  {
    title: "Quality",
    body: "Correct materials, correct methods, documented work. Quality is what makes a system cheap to own, not just cheap to buy.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About MOJATECH"
        title="Engineering with purpose."
        lead="MOJATECH Electrical Enterprises is a Lagos-based engineering company working across electrical systems, solar power, security, safety, consultancy and building facility solutions."
        crumbs={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      />

      {/* Who we are */}
      <section className="relative py-24 sm:py-32">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionHeading
              eyebrow="Who we are"
              title="One technical partner for the systems buildings depend on."
            />
            <Reveal delay={120}>
              <div className="mt-8 space-y-5 text-base leading-relaxed text-steel">
                <p>
                  Most buildings collect their technical systems piece by piece — one
                  vendor for wiring, another for solar, another for cameras, nobody for
                  the way they interact. MOJATECH exists to replace that patchwork with
                  a single accountable engineering partner.
                </p>
                <p>
                  Our work spans electrical engineering and installation, solar power,
                  security and safety systems, electrical consultancy, general building
                  management and facility solutions — delivered in{" "}
                  {company.location.city}, {company.location.country}.
                </p>
                <p>
                  The approach is the same at every scale: understand the real need,
                  design the system properly, install it safely, document it, and stay
                  available to support it.
                </p>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-6">
            <Reveal variant="mask">
              <ImagePlaceholder label="MOJATECH Engineering Team On Site Photo" ratio="aspect-[4/3]" />
            </Reveal>
            <Reveal delay={140}>
              <ImagePlaceholder
                label="Electrical Panel / Workmanship Detail Photo"
                ratio="aspect-[16/7]"
                className="mt-6"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Animated statement */}
      <section className="relative overflow-hidden border-y border-line py-24 sm:py-32">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="shell relative">
          <p className="label-tech mb-10">The standard</p>
          <div className="display space-y-2 text-6xl sm:text-8xl lg:text-9xl">
            <Reveal><span className="block">Power.</span></Reveal>
            <Reveal delay={180}><span className="block text-brand-redBright">Safety.</span></Reveal>
            <Reveal delay={360}><span className="block">Reliability.</span></Reveal>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="relative py-24 sm:py-32">
        <div className="shell">
          <SectionHeading
            eyebrow="Our commitments"
            tone="blue"
            title="What every project is measured against."
          />
          <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
            {commitments.map((c, i) => (
              <Reveal key={c.title} delay={i * 110} className="bg-ink">
                <div className="h-full p-8">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-blueBright">
                    Commitment
                  </span>
                  <h3 className="display mt-4 text-2xl">{c.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-steel">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise links */}
      <section className="relative border-t border-line py-24 sm:py-32">
        <div className="shell">
          <SectionHeading eyebrow="Areas of expertise" title="Where we work." />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 70}>
                <li>
                  <Link
                    href={`/services/${s.slug}`}
                    data-cursor="Explore"
                    className="group flex items-center justify-between border border-line bg-panel/50 px-6 py-5 transition-colors hover:border-paper/25"
                  >
                    <span className="display text-lg group-hover:text-brand-redBright">
                      {s.name}
                    </span>
                    <span className="btn-arrow text-steel">→</span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <CTASection
        title={"Let's talk about\nyour building."}
        copy="Whether it's a new installation or systems that need an honest assessment, the conversation starts the same way."
      />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import Motif from "@/components/Motif";
import ServiceMap from "@/components/ServiceMap";
import CTASection from "@/components/CTASection";
import { services } from "@/lib/data/services";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Engineering Services in Lagos — Electrical, Solar, Security, Facility | MOJATECH",
  description:
    "Explore MOJATECH's services in Lagos, Nigeria: electrical engineering, solar power, security and safety systems, electrical consultancy and building facility solutions.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="What we engineer."
        lead="Six connected disciplines with one standard behind them. Every service below has a dedicated page explaining scope, approach and how to start."
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ]}
      />

      <section className="relative py-20 sm:py-28">
        <div className="shell space-y-20 sm:space-y-28">
          {services.map((s, i) => (
            <article
              key={s.slug}
              className={`grid items-center gap-10 lg:grid-cols-2 ${
                i % 2 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <Reveal>
                  <p className="label-tech">{s.navLabel} system</p>
                </Reveal>
                <Reveal delay={90}>
                  <h2 className="display mt-4 text-4xl sm:text-5xl">{s.name}</h2>
                </Reveal>
                <Reveal delay={170}>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-steel">{s.intro}</p>
                </Reveal>
                <Reveal delay={250}>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link href={`/services/${s.slug}`} className="btn-primary" data-cursor="Explore">
                      Explore service <span className="btn-arrow">→</span>
                    </Link>
                    <Link href="/contact" className="btn-ghost" data-cursor="Connect">
                      {s.cta}
                    </Link>
                  </div>
                </Reveal>
              </div>
              <Reveal variant={i % 2 ? "left" : "right"} delay={140}>
                <div className="border border-line bg-panel/40 p-6 sm:p-10">
                  <Motif kind={s.motif} />
                </div>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-line py-24 sm:py-32">
        <div className="grid-bg-fine pointer-events-none absolute inset-0 opacity-60" />
        <div className="shell relative">
          <Reveal>
            <p className="label-tech label-tech--blue">One connected system</p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display mt-4 max-w-3xl text-4xl sm:text-5xl">
              Every discipline routes back to one partner.
            </h2>
          </Reveal>
          <div className="mt-14">
            <ServiceMap />
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}

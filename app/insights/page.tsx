import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import CTASection from "@/components/CTASection";
import { articles } from "@/lib/data/insights";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Insights — Electrical, Solar & Building Systems Guidance | MOJATECH",
  description:
    "Practical technical writing from MOJATECH on electrical engineering, solar energy, building safety, security systems and facility management in Lagos, Nigeria.",
  path: "/insights",
});

export default function InsightsPage() {
  const sorted = [...articles].sort((a, b) => (a.date < b.date ? 1 : -1));
  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Technical thinking, written down."
        lead="Guidance on electrical systems, solar power, security and building management — written for the people who own and run buildings, not for other engineers."
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Insights", href: "/insights" },
        ]}
      >
        <ul className="flex flex-wrap gap-3" aria-label="Categories">
          {categories.map((c) => (
            <li
              key={c}
              className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-steel"
            >
              {c}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="relative py-20 sm:py-28">
        <div className="shell space-y-8">
          {sorted.map((a, i) => (
            <Reveal key={a.slug} delay={i * 60}>
              <article>
                <Link
                  href={`/insights/${a.slug}`}
                  data-cursor="View"
                  className="group grid gap-8 border border-line bg-panel/50 p-6 transition-colors duration-300 hover:border-paper/25 sm:p-8 lg:grid-cols-12"
                >
                  <div className="lg:col-span-8">
                    <p className="label-tech label-tech--plain text-steel/80">
                      {a.category} · {new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {a.readingTime}
                    </p>
                    <h2 className="display mt-4 text-2xl leading-tight transition-colors group-hover:text-brand-blueBright sm:text-4xl">
                      {a.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-steel sm:text-base">
                      {a.excerpt}
                    </p>
                    <span className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-paper/80">
                      Read article →
                    </span>
                  </div>
                  <div className="hidden lg:col-span-4 lg:block">
                    <ImagePlaceholder label={a.imageLabel} ratio="aspect-[4/3]" />
                  </div>
                </Link>
              </article>
            </Reveal>
          ))}

          <Reveal delay={120}>
            <p className="max-w-2xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-steel">
              Add new articles in <span className="text-paper/70">lib/data/insights.ts</span> —
              each one gets its own page, metadata and sitemap entry automatically.
            </p>
          </Reveal>
        </div>
      </section>

      <CTASection
        title={"Prefer answers about\nyour building?"}
        copy="Articles are general by nature. A consultation is specific — describe your situation and get a technical view that actually applies."
      />
    </>
  );
}

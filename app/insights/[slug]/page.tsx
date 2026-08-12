import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import CTASection from "@/components/CTASection";
import { articles, getArticle } from "@/lib/data/insights";
import { getService } from "@/lib/data/services";
import { buildMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/data/company";

interface Params {
  params: { slug: string };
}

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const article = getArticle(params.slug);
  if (!article) return {};
  return buildMetadata({
    title: article.metaTitle,
    description: article.metaDescription,
    path: `/insights/${article.slug}`,
    type: "article",
  });
}

export default function ArticlePage({ params }: Params) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  const url = `${siteUrl}/insights/${article.slug}`;
  const related = articles.filter((a) => a.slug !== article.slug).slice(0, 2);
  const relatedServices = article.relatedServiceSlugs
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.date,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@id": `${siteUrl}/#organization` },
    mainEntityOfPage: url,
    articleSection: article.category,
  };
  const faqLd = article.faq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  const share = encodeURIComponent(url);
  const shareText = encodeURIComponent(article.title);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <PageHero
        eyebrow={`${article.category} · ${article.readingTime}`}
        title={article.title}
        lead={article.excerpt}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Insights", href: "/insights" },
          { name: article.title, href: `/insights/${article.slug}` },
        ]}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-steel">
          {article.author} ·{" "}
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </p>
      </PageHero>

      <article className="relative py-20 sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal variant="mask">
              <ImagePlaceholder label={article.imageLabel} ratio="aspect-[16/9]" className="mb-12" />
            </Reveal>
            <div className="max-w-2xl space-y-6">
              {article.body.map((block, i) => {
                if ("h" in block) {
                  return (
                    <Reveal key={i}>
                      <h2 className="display pt-4 text-2xl sm:text-3xl">{block.h}</h2>
                    </Reveal>
                  );
                }
                if ("list" in block) {
                  return (
                    <Reveal key={i}>
                      <ul className="space-y-3">
                        {block.list.map((item) => (
                          <li key={item} className="flex gap-3 text-base leading-relaxed text-paper/85">
                            <span aria-hidden="true" className="mt-2.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  );
                }
                return (
                  <Reveal key={i}>
                    <p className="text-base leading-relaxed text-paper/85">{block.p}</p>
                  </Reveal>
                );
              })}
            </div>

            {article.faq && (
              <div className="mt-16 max-w-2xl">
                <Reveal>
                  <h2 className="display text-2xl sm:text-3xl">Frequently asked</h2>
                </Reveal>
                <div className="mt-6 divide-y divide-line border-y border-line">
                  {article.faq.map((f) => (
                    <Reveal key={f.q}>
                      <details className="group py-5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-paper">
                          {f.q}
                          <span aria-hidden="true" className="text-steel transition-transform duration-300 group-open:rotate-45">+</span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-steel">{f.a}</p>
                      </details>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="space-y-8 lg:sticky lg:top-28">
              <div className="border border-line bg-panel/50 p-6">
                <p className="label-tech label-tech--blue">Related services</p>
                <ul className="mt-4 space-y-3">
                  {relatedServices.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/services/${s.slug}`} className="link-line text-sm text-paper/85 hover:text-white">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/contact" className="link-line text-sm text-brand-redBright">
                      Request a consultation
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="border border-line bg-panel/50 p-6">
                <p className="label-tech">Share</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      className="link-line text-paper/85"
                      href={`https://wa.me/?text=${shareText}%20${share}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Share on WhatsApp
                    </a>
                  </li>
                  <li>
                    <a
                      className="link-line text-paper/85"
                      href={`https://x.com/intent/tweet?text=${shareText}&url=${share}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Share on X
                    </a>
                  </li>
                  <li>
                    <a
                      className="link-line text-paper/85"
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${share}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Share on LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="shell mt-20">
            <Reveal>
              <p className="label-tech">Keep reading</p>
            </Reveal>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {related.map((a, i) => (
                <Reveal key={a.slug} delay={i * 90}>
                  <Link
                    href={`/insights/${a.slug}`}
                    data-cursor="View"
                    className="group block border border-line bg-panel/50 p-7 transition-colors hover:border-paper/25"
                  >
                    <p className="label-tech label-tech--plain text-steel/80">
                      {a.category} · {a.readingTime}
                    </p>
                    <h3 className="display mt-3 text-xl leading-tight group-hover:text-brand-blueBright">
                      {a.title}
                    </h3>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </article>

      <CTASection
        title={"Questions about\nyour own system?"}
        copy="General articles end where your building begins. Get a specific technical view from MOJATECH."
      />
    </>
  );
}

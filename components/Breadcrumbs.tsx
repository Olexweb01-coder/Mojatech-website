import Link from "next/link";
import { siteUrl } from "@/lib/data/company";

export interface Crumb {
  name: string;
  href: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${siteUrl}${c.href === "/" ? "" : c.href}`,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.18em] text-steel">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-steel/50">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-paper/80">{c.name}</span>
            ) : (
              <Link href={c.href} className="link-line hover:text-white">{c.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

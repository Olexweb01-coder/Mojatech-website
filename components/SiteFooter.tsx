import Image from "next/image";
import Link from "next/link";
import {
  company,
  isProvided,
  phoneHref,
  whatsappHref,
  emailHref,
} from "@/lib/data/company";
import { services } from "@/lib/data/services";

const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/insights", label: "Insights" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const tel = phoneHref();
  const wa = whatsappHref();
  const mail = emailHref();
  const socials = Object.entries(company.social).filter(([, v]) => isProvided(v));

  return (
    <footer className="relative overflow-hidden border-t border-line bg-[#08090e]">
      {/* Circuit line completing at the bottom of the site */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 w-full"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M600 0 V34 H120 V70 H1080 V100"
          stroke="rgba(244,245,247,0.12)"
          strokeWidth="1.5"
        />
        <path
          d="M600 0 V34 H120 V70 H1080 V100"
          stroke="#C8102E"
          strokeWidth="1.5"
          className="current current--slow"
        />
        <circle cx="600" cy="34" r="3.5" fill="#C8102E" className="node-pulse" />
        <circle cx="120" cy="70" r="3.5" fill="#5A5FF0" className="node-pulse" />
      </svg>

      <div className="shell relative pb-10 pt-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-4">
              <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-white">
                <Image
                  src="/logo.jpeg"
                  alt="MOJATECH Electrical Enterprises logo"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold uppercase tracking-widest">
                  Mojatech
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-steel">
                  Electrical Enterprises
                </p>
              </div>
            </div>
            <p className="display mt-8 text-4xl sm:text-5xl">
              Power.
              <br />
              Safety.
              <br />
              Reliability.
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-steel">
              Electrical engineering, solar power, security, safety, consultancy
              and building facility solutions — engineered in {company.location.city},{" "}
              {company.location.country}.
            </p>
          </div>

          <div className="lg:col-span-3">
            <p className="label-tech mb-5">Navigate</p>
            <ul className="space-y-3">
              {nav.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-line text-sm text-paper/80 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="label-tech label-tech--blue mb-5">Services</p>
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="link-line text-sm text-paper/80 hover:text-white"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="label-tech mb-5">Connect</p>
            <ul className="space-y-3 text-sm text-paper/80">
              {tel && (
                <li>
                  <a className="link-line" href={tel}>
                    Call: {company.contact.phone}
                  </a>
                </li>
              )}
              {wa && (
                <li>
                  <a className="link-line" href={wa} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
              )}
              {mail && (
                <li>
                  <a className="link-line" href={mail}>
                    {company.contact.email}
                  </a>
                </li>
              )}
              <li className="text-steel">
                {isProvided(company.contact.address)
                  ? company.contact.address
                  : `${company.location.city}, ${company.location.country}`}
              </li>
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    className="link-line capitalize"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
            © {year} {company.legalName}. All rights reserved.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-steel">
            System complete <span className="text-brand-redBright">●</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

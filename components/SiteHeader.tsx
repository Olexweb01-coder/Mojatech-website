"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/services/solar-power", label: "Solar" },
  { href: "/services/security-safety", label: "Security" },
  { href: "/projects", label: "Projects" },
  { href: "/insights", label: "Insights" },
  { href: "/contact", label: "Contact" },
];

const menuLinks = [
  { href: "/", label: "Home", sub: "System overview" },
  { href: "/about", label: "About", sub: "Who MOJATECH is" },
  { href: "/services", label: "Services", sub: "Everything we engineer" },
  { href: "/services/solar-power", label: "Solar Power", sub: "Energy & control" },
  { href: "/services/security-safety", label: "Security & Safety", sub: "Engineered protection" },
  { href: "/services/facility-management", label: "Facility Solutions", sub: "Keeping buildings working" },
  { href: "/projects", label: "Projects", sub: "Delivered work" },
  { href: "/insights", label: "Insights", sub: "Technical writing" },
  { href: "/contact", label: "Contact", sub: "Start a conversation" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu when the route changes (React's recommended pattern:
  // adjust state during render instead of calling setState in an effect)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock page scroll while the menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "header-solid py-2.5" : "py-4"
        }`}
      >
        <div className="shell flex items-center justify-between gap-6">
          <Link
            href="/"
            aria-label="MOJATECH — home"
            data-cursor="Home"
            className="flex items-center gap-3"
          >
            <span
              className={`relative block overflow-hidden rounded-full bg-white transition-all duration-500 ${
                scrolled ? "h-9 w-9" : "h-11 w-11"
              }`}
            >
              <Image
                src="/logo.jpeg"
                alt="MOJATECH Electrical Enterprises logo"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-sm font-extrabold uppercase tracking-widest">
                Mojatech
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-steel">
                Electrical Enterprises
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 xl:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor="Open"
                className={`link-line font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  pathname === l.href ? "text-white" : "text-steel hover:text-white"
                }`}
                aria-current={pathname === l.href ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="btn-primary hidden !px-5 !py-3 md:inline-flex"
              data-cursor="Connect"
            >
              Request a consultation
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="btn-ghost !px-5 !py-3 xl:hidden"
              aria-expanded={open}
              aria-controls="site-menu"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen menu */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={`fixed inset-0 z-[70] flex flex-col bg-ink transition-opacity duration-500 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="shell relative flex items-center justify-between py-4">
          <span className="font-display text-sm font-extrabold uppercase tracking-widest">
            Mojatech
          </span>
          <button type="button" onClick={() => setOpen(false)} className="btn-ghost !px-5 !py-3">
            Close
          </button>
        </div>
        <nav
          aria-label="Full screen"
          className="shell relative flex-1 overflow-y-auto pb-10 pt-4"
        >
          <ul className="flex flex-col">
            {menuLinks.map((l, i) => (
              <li key={l.href} className="border-b border-line">
                <Link
                  href={l.href}
                  className="group flex items-baseline justify-between gap-4 py-4 sm:py-5"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  <span className="display text-3xl transition-colors group-hover:text-brand-redBright sm:text-5xl">
                    {l.label}
                  </span>
                  <span className="label-tech label-tech--plain shrink-0 text-right">
                    {l.sub}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="btn-primary">
              Request a consultation <span className="btn-arrow">→</span>
            </Link>
          </div>
          <p className="label-tech label-tech--plain mt-10">
            Power · Safety · Control · Reliability — Lagos, Nigeria
          </p>
        </nav>
      </div>
    </>
  );
}

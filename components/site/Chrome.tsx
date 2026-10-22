"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { company } from "@/lib/data/company";

const NAV = [
  { href: "/about", label: "About", sub: "Who we are, and how we work" },
  { href: "/services", label: "Services", sub: "Seven services, one team" },
  { href: "/products", label: "Products", sub: "Inverters, batteries, panels, cameras" },
  { href: "/work", label: "Our work", sub: "Real sites and installations" },
  { href: "/careers", label: "Careers", sub: "Internship, apprenticeship, NYSC, IT" },
  { href: "/contact", label: "Contact", sub: "Tell us about the job" },
];
const MENU = [{ href: "/", label: "Home", sub: "Start here" }, ...NAV];

function Badge() {
  return (
    <span className="badge">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mojatech-mark.png" alt="" width={56} height={30} />
    </span>
  );
}

export function Header() {
  const menu = useRef<HTMLDialogElement>(null);
  const path = usePathname();
  const admin = path.startsWith("/admin");
  const router = useRouter();

  useEffect(() => {
    /* Solid once scrolled, and always on pages that open on white (product and
       project pages), where the white header text would otherwise be invisible. */
    const lightTop = !document.querySelector(".phero, .film");
    const onScroll = () => document.querySelector(".hdr")?.classList.toggle("solid", lightTop || window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [path]);

  const openMenu = () => {
    menu.current?.showModal();
    window.lenisRef?.stop();
  };
  const closeMenu = () => menu.current?.close();

  /* The logo: replays the opening while you are in the hero, otherwise it brings you back to it. */
  const onLogo = (e: React.MouseEvent) => {
    e.preventDefault();
    closeMenu();
    const inHero = path === "/" && window.scrollY < window.innerHeight * 0.9;
    if (inHero) { window.mjPlayIntro?.(); return; }
    if (path !== "/") { router.push("/"); return; }
    const l = window.lenisRef;
    if (l) l.scrollTo(0, { duration: 1.2 }); else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (admin) return null;

  return (
    <>
      <header className="hdr">
        <div className="hdr-in">
          <Link className="brand" href="/" onClick={onLogo} aria-label={`${company.name}: back to the top, or replay the opening`}>
            <Badge />
            <span className="brand-txt"><b>MOJATECH</b><span>Electrical Enterprises</span></span>
          </Link>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined}>{n.label}</Link>
            ))}
          </nav>
          <div className="hdr-right">
            <Link className="btn btn-red btn-sm" href="/contact">Get a quote</Link>
            <button className="menu-btn" type="button" aria-label="Open menu" aria-haspopup="dialog" onClick={openMenu}><span /></button>
          </div>
        </div>
      </header>

      <dialog className="menu" ref={menu} aria-label="Menu"
        onClose={() => window.lenisRef?.start()}
        onClick={(e) => { if (e.target === menu.current) closeMenu(); }}>
        <div className="menu-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stock/house-on.webp" alt="" loading="lazy" />
        </div>
        <div className="menu-in">
          <div className="menu-top">
            <Link className="brand" href="/" onClick={onLogo}><Badge /><span className="brand-txt"><b>MOJATECH</b><span>Electrical Enterprises</span></span></Link>
            <button className="menu-btn" type="button" aria-label="Close menu" onClick={closeMenu}><span /></button>
          </div>
          <nav className="menu-nav" aria-label="Menu">
            {MENU.map((m, i) => (
              <Link key={m.href} href={m.href} onClick={closeMenu}
                aria-current={m.href === "/" ? (path === "/" ? "page" : undefined) : (path.startsWith(m.href) ? "page" : undefined)}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span className="ttl">{m.label}</span>
                <span className="sub">{m.sub}</span>
              </Link>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}

export function Footer() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-simple">
          <div>
            <Link className="brand" href="/" aria-label="MOJATECH, back to the top"><Badge />
              <span className="brand-txt"><b>MOJATECH</b><span>Electrical Enterprises</span></span></Link>
            <p className="tag">{company.tagline}</p>
          </div>
          <div>
            <nav className="ftr-links" aria-label="Footer">
              <Link href="/services">Services</Link><Link href="/products">Products</Link><Link href="/work">Our work</Link>
              <Link href="/about">About</Link><Link href="/careers">Careers</Link><Link href="/contact">Contact</Link>
            </nav>
            <div className="ftr-reach" style={{ marginTop: 16 }}>
              <a href={`tel:${company.contact.phone}`}>+234 816 168 3153</a>
              <a href={company.contact.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>
            </div>
            <p style={{ marginTop: 12 }}>{company.address.street}, {company.address.region} &middot; Projects anywhere in Nigeria</p>
          </div>
        </div>
        <div className="ftr-bottom">
          <p>&copy; {new Date().getFullYear()} {company.name}. CAC {company.registration.number}.</p>
          <button className="replay" type="button" onClick={() => window.mjPlayIntro?.()}>Replay the opening</button>
        </div>
      </div>
    </footer>
  );
}

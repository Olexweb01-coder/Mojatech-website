"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { NAV, titleFor, type NavIcon } from "./nav";
import type { Perm } from "@/lib/admin-auth";

/* The MOJATECH Admin frame.
 *
 * Phones and tablets: the menu lives off-screen on the left. Swipe right from
 * anywhere to pull it out, it follows your finger, and a flick is enough. Swipe
 * it back, tap outside, press Esc or pick a page to close it.
 *
 * Wide screens (1024px and up): the menu sits docked beside the page, and the
 * menu button hides or shows it. That choice is remembered on the device and
 * applied before the first paint (see app/admin/layout.tsx), so nothing jumps.
 *
 * During a drag nothing re-renders: the finger position is written straight to
 * one CSS variable (--p, 0 = closed, 1 = open) once per frame, which is what
 * keeps the motion smooth on low-end phones. */

const WIDE = "(min-width: 1024px)";
const FLICK = 0.35;          /* px per ms: a quick flick decides, whatever the distance */
const INTENT = 10;           /* px of movement before deciding the gesture is a swipe */

function Icon({ name }: { name: NavIcon | "menu" | "out" | "site" | "user" }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "menu":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M4 7h16M4 12h11M4 17h16" /></svg>;
    case "arik":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V17h5.2v-1.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /><path {...p} d="M10 20.5h4M10.5 9.5l1.5 2 1.5-2" /></svg>;
    case "inbox":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M4 13.5 6.2 6a1.5 1.5 0 0 1 1.4-1h8.8a1.5 1.5 0 0 1 1.4 1L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" /><path {...p} d="M4 13.5h4.5l1.2 2.2h4.6l1.2-2.2H20" /></svg>;
    case "work":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><rect {...p} x="3.5" y="5" width="17" height="14" rx="2" /><path {...p} d="m3.5 16 4.5-4.5 4 4 2.5-2.5 6 6" /><circle {...p} cx="15.5" cy="9.5" r="1.6" /></svg>;
    case "star":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" /></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><rect {...p} x="3.5" y="5" width="17" height="15" rx="2" /><path {...p} d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h3M8 16.5h6" /></svg>;
    case "team":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...p} cx="9" cy="8.5" r="3.2" /><path {...p} d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><circle {...p} cx="17" cy="9.5" r="2.4" /><path {...p} d="M15.8 14.4c2.3.1 4 1.6 4.7 4.1" /></svg>;
    case "user":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...p} cx="12" cy="8.5" r="3.5" /><path {...p} d="M5 19.5c.8-3.4 3.6-5.3 7-5.3s6.2 1.9 7 5.3" /></svg>;
    case "products":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path {...p} d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></svg>;
    case "out":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" /></svg>;
    case "site":
      return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...p} cx="12" cy="12" r="8.5" /><path {...p} d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5S9.6 5.8 12 3.5z" /></svg>;
  }
}

function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const HIDDEN_KEY = "mja-nav-hidden";
function readHidden() { return document.documentElement.dataset.mjaNav === "hidden"; }
function writeHidden(v: boolean) {
  try { localStorage.setItem(HIDDEN_KEY, v ? "1" : "0"); } catch {}
  if (v) document.documentElement.dataset.mjaNav = "hidden";
  else delete document.documentElement.dataset.mjaNav;
  window.dispatchEvent(new Event("mja-nav"));
}
function subscribeHidden(cb: () => void) {
  window.addEventListener("mja-nav", cb);
  return () => window.removeEventListener("mja-nav", cb);
}

/** True when the touch started somewhere that scrolls sideways on its own
 *  (a wide table, a photo strip, a slider), so the menu must not steal it. */
function ownsHorizontal(el: EventTarget | null) {
  let n = el as HTMLElement | null;
  while (n && n !== document.body) {
    if (n.dataset?.noswipe !== undefined) return true;
    if (n instanceof HTMLInputElement && n.type === "range") return true;
    if (n.scrollWidth > n.clientWidth + 2) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
    n = n.parentElement;
  }
  return false;
}

export default function Shell({ children, badges = {}, perms = [], me }:
  { children: React.ReactNode; badges?: Record<string, number>; perms?: Perm[]; me?: { name: string; role: string } }) {
  const nav = NAV.filter((n) => !n.perm || perms.includes(n.perm));
  const path = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  /* Wide screen or phone, read straight from the browser. */
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);
  /* Wide screens: has the docked menu been tucked away? Remembered on the device. */
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, () => false);

  /* The drawer is open for the page it was opened on. Moving to another page, by a
     tap or by the back button, closes it without any extra code. */
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = !wide && openOn === path;
  const pathRef = useRef(path);
  useEffect(() => { pathRef.current = path; }, [path]);
  const setOpen = useCallback((v: boolean) => setOpenOn(v ? pathRef.current : null), []);

  const setP = (v: number) => root.current?.style.setProperty("--p", String(v));

  /* Keep the position variable in step with the open state. */
  useEffect(() => { setP(open ? 1 : 0); }, [open]);

  /* While the drawer is out on a phone, the page behind it does not scroll. */
  useEffect(() => {
    if (wide) return;
    document.documentElement.classList.toggle("mja-locked", open);
    return () => document.documentElement.classList.remove("mja-locked");
  }, [open, wide]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus && drawer.current?.contains(document.activeElement)) menuBtn.current?.focus();
  }, [setOpen]);

  /* Esc closes. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* Opening from the button moves focus into the menu, for keyboards and screen readers. */
  const openFromButton = () => {
    if (wide) {
      writeHidden(!hidden);
      return;
    }
    setOpen(true);
    requestAnimationFrame(() => drawer.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true }));
  };

  /* The swipe. Touch events (not pointer events) because only they let us stop the
     page scrolling once we know the finger is moving sideways. */
  useEffect(() => {
    if (wide) return;
    const el = root.current;
    if (!el) return;

    let tracking = false, decided = false, horizontal = false;
    let startX = 0, startY = 0, lastX = 0, lastT = 0, vx = 0, startP = 0, curP = 0, width = 300, frame = 0;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const isOpen = el.dataset.open === "true";
      if (!isOpen && ownsHorizontal(e.target)) return;
      const t = e.touches[0];
      tracking = true; decided = false; horizontal = false;
      startX = lastX = t.clientX; startY = t.clientY; lastT = e.timeStamp; vx = 0;
      startP = curP = isOpen ? 1 : 0;
      width = drawer.current?.offsetWidth || 300;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (!decided) {
        if (Math.abs(dx) < INTENT && Math.abs(dy) < INTENT) return;
        decided = true;
        /* Sideways, and in a direction that makes sense for the current state. */
        horizontal = Math.abs(dx) > Math.abs(dy) * 1.2 && (startP === 0 ? dx > 0 : dx < 0);
        if (!horizontal) { tracking = false; return; }
        el.classList.add("dragging");
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lastT);
      vx = 0.8 * ((t.clientX - lastX) / dt) + 0.2 * vx;
      lastX = t.clientX; lastT = e.timeStamp;
      curP = Math.min(1, Math.max(0, startP + dx / width));
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; setP(curP); });
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (!horizontal) return;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      el.classList.remove("dragging");
      const willOpen = vx > FLICK ? true : vx < -FLICK ? false : curP > 0.5;
      setP(willOpen ? 1 : 0);
      setOpen(willOpen);
      if (willOpen !== (startP === 1)) navigator.vibrate?.(6);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [wide, setOpen]);

  const current = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));
  const docked = wide && !hidden;

  return (
    <div ref={root} className="mja-app" data-open={open}>
      <aside ref={drawer} id="mja-drawer" className="mja-drawer" aria-label="Admin menu"
        inert={!wide && !open ? true : wide && hidden ? true : undefined}>
        <div className="mja-brand">
          <span className="mja-plate">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mojatech-mark.png" alt="MOJATECH" width={480} height={253} />
          </span>
          <span className="mja-brand-name">Admin</span>
        </div>

        <nav className="mja-nav">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="mja-link" aria-current={current(n.href) ? "page" : undefined}
              onClick={() => { if (current(n.href)) close(false); }}>
              <span className="mja-ico"><Icon name={n.icon} /></span>
              <span className="mja-link-text"><b>{n.label}</b><small>{n.hint}</small></span>
              {badges[n.href] ? <span className="mja-badge" aria-label={`${badges[n.href]} new`}>{badges[n.href] > 99 ? "99+" : badges[n.href]}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="mja-drawer-foot">
          {me && (
            <Link href="/admin/account" className="mja-link quiet" aria-current={path.startsWith("/admin/account") ? "page" : undefined}>
              <span className="mja-ico"><Icon name="user" /></span>
              <span className="mja-link-text"><b>{me.name}</b><small>{me.role} · Your account</small></span>
            </Link>
          )}
          <a className="mja-link quiet" href="/" target="_blank" rel="noreferrer">
            <span className="mja-ico"><Icon name="site" /></span>
            <span className="mja-link-text"><b>Open the website</b></span>
          </a>
          <form action={signOut}>
            <button type="submit" className="mja-link quiet">
              <span className="mja-ico"><Icon name="out" /></span>
              <span className="mja-link-text"><b>Sign out</b></span>
            </button>
          </form>
        </div>
      </aside>

      <div className="mja-scrim" aria-hidden="true" onClick={() => close()} />

      <div className="mja-main" inert={!wide && open ? true : undefined}>
        <header className="mja-bar">
          <button ref={menuBtn} type="button" className="mja-menu" onClick={openFromButton}
            aria-controls="mja-drawer" aria-expanded={wide ? docked : open}
            aria-label={wide ? (docked ? "Hide menu" : "Show menu") : "Open menu"}>
            <Icon name="menu" />
            {Object.values(badges).some(Boolean) && <span className="mja-menu-dot" aria-hidden="true" />}
          </button>
          <h1 className="mja-title">{titleFor(path)}</h1>
        </header>
        <main className="mja-content" id="mja-content">{children}</main>
      </div>
    </div>
  );
}

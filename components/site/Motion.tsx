"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Smooth scrolling on mouse and trackpad; phones keep their native feel. */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis: InstanceType<typeof import('lenis').default> | undefined, off = false, started = false;
    const wake = ["wheel", "touchstart", "keydown", "scroll"] as const;
    const start = async () => {
      if (started || off) return;
      started = true;
      wake.forEach((ev) => window.removeEventListener(ev, start));
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"), import("gsap"), import("gsap/ScrollTrigger"),
      ]);
      if (off) return;
      gsap.registerPlugin(ScrollTrigger);
      lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.8 });
      window.lenisRef = lenis;
      lenis.on("scroll", () => ScrollTrigger.update());
      const engine = lenis;
      const tick = (t: number) => engine.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    };
    wake.forEach((ev) => window.addEventListener(ev, start, { passive: true }));
    return () => {
      off = true;
      wake.forEach((ev) => window.removeEventListener(ev, start));
      if (lenis) { lenis.destroy(); window.lenisRef = null; }
    };
  }, []);
  return null;
}

/** Every page starts at the top, and the header resets. */
export function RouteReset() {
  const path = usePathname();
  useEffect(() => {
    const l = window.lenisRef;
    if (l) l.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
    document.querySelector(".hdr")?.classList.remove("solid");
    (async () => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      ScrollTrigger.refresh();
    })();
  }, [path]);
  return null;
}

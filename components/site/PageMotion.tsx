"use client";
import { useEffect, useLayoutEffect } from "react";

type GsapContext = { revert: () => void };
type ScrollTriggerLike = { getAll: () => Array<{ kill: (revert?: boolean) => void }>; refresh: () => void };

/* Runs before the browser paints, so animations are released before React removes the page. */
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Kind = "about" | "services" | "service" | "work" | "careers" | "contact" | "plain";

/** The motion that makes each page feel alive. Runs after the page is on screen, cleans up on leaving. */
export default function PageMotion({ kind = "plain" }: { kind?: Kind }) {
  useIso(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: GsapContext | undefined, ST: ScrollTriggerLike | undefined;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      ST = ScrollTrigger;
      ctx = gsap.context(() => {
        const reveal = (sel: string, opts: Record<string, unknown> = {}) =>
          gsap.utils.toArray<HTMLElement>(sel).forEach((el) =>
            gsap.from(el, { autoAlpha: 0, y: 40, duration: 0.8, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 86%" }, ...opts }));

        gsap.from(".phero .wrap > *", { autoAlpha: 0, y: 44, stagger: 0.09, duration: 0.9, ease: "power3.out", delay: 0.08 });
        gsap.to(".phero-media img", { scale: 1.14, yPercent: 4, ease: "none",
          scrollTrigger: { trigger: ".phero", start: "top top", end: "bottom top", scrub: 0.5 } });
        gsap.utils.toArray<HTMLElement>(".sec-head").forEach((h) =>
          gsap.from(h.children, { autoAlpha: 0, y: 40, stagger: 0.08, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: h, start: "top 84%" } }));
        gsap.utils.toArray<HTMLElement>(".counter b[data-count]").forEach((b) => {
          const target = Number(b.dataset.count), o = { v: 0 };
          ScrollTrigger.create({ trigger: b, start: "top 88%", once: true, onEnter: () =>
            gsap.to(o, { v: target, duration: 1.4, ease: "power2.out",
              onUpdate: () => { b.textContent = String(Math.round(o.v)); } }) });
        });
        reveal(".tile, .why li, .faq details, .cinfo > *, .chips li", { y: 28, duration: 0.6 });

        if (kind === "about") {
          const items = gsap.utils.toArray<HTMLElement>(".promise-item");
          const dots = gsap.utils.toArray<HTMLElement>(".promise-dots i");
          gsap.set(items, { autoAlpha: 0, y: 40 }); gsap.set(items[0], { autoAlpha: 1, y: 0 });
          const tl = gsap.timeline({ scrollTrigger: { trigger: ".promise", start: "top top",
            end: "+=" + items.length * 90 + "%", pin: true, scrub: 0.7,
            onUpdate: (self) => {
              const i = Math.min(items.length - 1, Math.floor(self.progress * items.length * 0.999));
              dots.forEach((d, n) => d.classList.toggle("on", n === i));
            } } });
          items.forEach((it, i) => { if (!i) return;
            tl.to(items[i - 1], { autoAlpha: 0, y: -40, duration: 0.4 }, i - 0.4)
              .fromTo(it, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.4 }, i - 0.2); });
          const strip = document.querySelector<HTMLElement>(".strip");
          if (strip) gsap.to(strip, { x: () => -Math.max(0, strip.scrollWidth - window.innerWidth + 40), ease: "none",
            scrollTrigger: { trigger: ".strip", start: "top 80%", end: "bottom top", scrub: 0.8, invalidateOnRefresh: true } });
        }

        if (kind === "services") {
          const rows = gsap.utils.toArray<HTMLElement>(".srow");
          const imgs = gsap.utils.toArray<HTMLElement>(".spreview img");
          const cap = document.querySelector<HTMLElement>("[data-preview-cap]");
          rows.forEach((row, i) => {
            gsap.from(row, { autoAlpha: 0, y: 30, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 90%" } });
            const setActive = () => {
              imgs.forEach((im, n) => im.classList.toggle("on", n === i));
              if (cap) cap.textContent = row.dataset.name || "";
            };
            row.addEventListener("mouseenter", setActive);
            ScrollTrigger.create({ trigger: row, start: "top 60%", end: "bottom 45%", onToggle: (s) => { if (s.isActive) setActive(); } });
            const thumb = row.querySelector(".rowimg");
            if (thumb) gsap.from(thumb, { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 88%" } });
          });
        }

        if (kind === "service") {
          gsap.utils.toArray<HTMLElement>(".inc li").forEach((li) => {
            gsap.from(li, { autoAlpha: 0, x: -24, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: li, start: "top 88%" } });
            ScrollTrigger.create({ trigger: li, start: "top 78%", onToggle: (s) => { if (s.isActive || s.progress > 0) li.classList.add("on"); } });
          });
          const track = document.querySelector<HTMLElement>(".stagetrack");
          if (track && window.innerWidth >= 900) {
            const shift = () => Math.min(0, -(track.scrollWidth - window.innerWidth + 120));
            gsap.to(track, { x: shift, ease: "none", scrollTrigger: { trigger: ".stages-sec", start: "center center",
              end: () => "+=" + Math.max(1, -shift()), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
          } else {
            gsap.utils.toArray<HTMLElement>(".stage-card").forEach((c) =>
              gsap.from(c, { autoAlpha: 0, y: 40, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: c, start: "top 88%" } }));
          }
        }

        if (kind === "work") {
          gsap.utils.toArray<HTMLElement>(".wcard").forEach((card) => {
            gsap.from(card, { autoAlpha: 0, y: 60, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 90%" } });
            gsap.fromTo(card.querySelector("img"), { scale: 1.16, yPercent: -3 }, { scale: 1, yPercent: 3, ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 0.6 } });
          });
        }

        if (kind === "careers") {
          gsap.utils.toArray<HTMLElement>(".prog").forEach((p, i) =>
            gsap.from(p, { autoAlpha: 0, y: 50, rotate: i % 2 ? 1.2 : -1.2, duration: 0.8, ease: "power3.out",
              scrollTrigger: { trigger: p, start: "top 88%" } }));
        }

        /* Nothing may be left invisible on screen. */
        setTimeout(() => {
          document.querySelectorAll<HTMLElement>("main *").forEach((el) => {
            const cs = getComputedStyle(el);
            if (cs.opacity !== "0" && cs.visibility !== "hidden") return;
            const r = el.getBoundingClientRect();
            if (!r.height || r.top > window.innerHeight * 1.2) return;
            if (el.closest(".ch:not(:first-child)") || el.closest(".fstep:not(.on)") || el.closest(".sent:not(.on)") || el.closest(".promise-item")) return;
            gsap.set(el, { autoAlpha: 1, y: 0, x: 0, clearProps: "clipPath" });
          });
        }, 1400);
      });
      ScrollTrigger.refresh();
    })();
    return () => {
      ST?.getAll().forEach((t) => t.kill(true));
      ctx?.revert();
    };
  }, [kind]);
  return null;
}

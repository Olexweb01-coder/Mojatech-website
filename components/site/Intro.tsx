"use client";
import { useEffect, useRef } from "react";

/** The opening: first visit, or a return after 10 minutes away. Replayable from the logo and the footer. */
export default function Intro() {
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const root = document.documentElement;
    const end = (fast?: boolean) => {
      window.clearTimeout(timer.current);
      const done = () => {
        document.querySelector(".intro")?.classList.remove("leaving");
        root.setAttribute("data-intro", "off");
        window.lenisRef?.start();
      };
      if (fast) { document.querySelector(".intro")?.classList.add("leaving"); window.setTimeout(done, 300); }
      else done();
    };
    const play = () => {
      root.setAttribute("data-intro", "off");
      void root.offsetWidth;
      const l = window.lenisRef;
      if (l) { l.scrollTo(0, { immediate: true }); l.stop(); } else window.scrollTo(0, 0);
      root.setAttribute("data-intro", "on");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(end, 4950);
    };
    window.mjPlayIntro = play;
    if (root.getAttribute("data-intro") === "on") {
      window.lenisRef?.stop();
      timer.current = window.setTimeout(end, 4950);
    }
    const skip = document.querySelector(".intro-skip");
    const onSkip = () => end(true);
    skip?.addEventListener("click", onSkip);
    return () => { window.clearTimeout(timer.current); skip?.removeEventListener("click", onSkip); };
  }, []);

  return (
    <div className="intro" aria-label="Opening">
      <div className="intro-stage">
      <p className="intro-quote">Let there be light.</p>
      <svg className="intro-bulb" viewBox="0 0 64 88" aria-hidden="true">
      <defs><radialGradient id="fil" cx="50%" cy="45%" r="50%"><stop offset="0" stopColor="#fff7d6"/><stop offset=".5" stopColor="#ffc85a" stopOpacity=".8"/><stop offset="1" stopColor="#ff9a1f" stopOpacity="0"/></radialGradient></defs>
      <circle cx="32" cy="34" r="30" fill="url(#fil)"/>
      <path d="M32 6a24 24 0 0 0-14 43c3 2.4 5 5.6 5 9.4V64h18v-5.6c0-3.8 2-7 5-9.4A24 24 0 0 0 32 6z" fill="none" stroke="#6b6250" strokeWidth="2"/>
      <path d="M25 64h14M26 70h12M28 76h8" stroke="#6b6250" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 52V38l3-4 3 4 3-4 3 4v14" fill="none" stroke="#fff4c8" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
      <span className="intro-flood"></span>
      </div>
      <div className="intro-doors"><div className="intro-door intro-door--l"></div><div className="intro-door intro-door--r"></div></div>
      <div className="intro-brand">{/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/mojatech-mark.png" alt="MOJATECH Electrical Enterprises" width={180} height={95} /><p>MOJATECH. Powering your world.</p></div>
      <button className="intro-skip" type="button">Skip intro</button>
    </div>
  );
}

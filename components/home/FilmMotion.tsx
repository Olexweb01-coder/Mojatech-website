"use client";
import { useEffect, useLayoutEffect } from "react";

type GsapContext = { revert: () => void };
type ScrollTriggerLike = { getAll: () => Array<{ kill: (revert?: boolean) => void }>; refresh: () => void };

/* Runs before the browser paints, so animations are released before React removes the page. */
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** The home film: the house powers on window by window, then the services play as scenes. */
export default function FilmMotion() {
  useIso(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: GsapContext | undefined, ST: ScrollTriggerLike | undefined, started = false;
    const start = async () => {
      if (started) return;
      started = true;
      wake.forEach((ev) => window.removeEventListener(ev, start));
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      ST = ScrollTrigger;
      /* How far the building has powered on, how close the camera is, and how to redraw it. */
      type Building = { p: number; zoom: number; draw: () => void };
      const bld: Building = { p: 0, zoom: 1, draw: () => {} };

      /* --- the building: two photos and a map of when each window lights --- */
      (function setupBuilding() {
        const canvas = document.querySelector<HTMLCanvasElement>(".bld-gl");
        if (!canvas) return;
        const gl = canvas.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false });
        const offImg = document.querySelector<HTMLImageElement>(".bld-off")!;
        const onImg = document.querySelector<HTMLImageElement>(".bld-on")!;
        const fallback = () => { canvas.style.display = "none"; bld.draw = () => { onImg.style.opacity = String(Math.min(1, bld.p)); }; bld.draw(); };
        if (!gl) return fallback();
        const tImg = new Image(); tImg.src = "/stock/house-timing.png";
        const VS = "attribute vec2 a; varying vec2 v; void main(){ v = a*0.5+0.5; gl_Position = vec4(a,0.0,1.0); }";
        const FS = ["precision mediump float;",
          "uniform sampler2D u_on,u_off,u_t; uniform float u_p,u_time,u_zoom; uniform vec2 u_scale,u_offset; varying vec2 v;",
          "float h(float x){ return fract(sin(x*91.3458)*47453.5453); }",
          "void main(){ vec2 uv=(v-0.5)/u_zoom+0.5; uv=uv*u_scale+u_offset; uv.y=1.0-uv.y;",
          "vec3 on=texture2D(u_on,uv).rgb; vec3 off=texture2D(u_off,uv).rgb; float t=texture2D(u_t,uv).r;",
          "float k=smoothstep(t-0.012,t+0.012,u_p); float age=u_p-t;",
          "if(age>0.0&&age<0.05){ k*=0.35+0.65*step(0.45,h(floor(u_time*18.0)+t*131.0)); }",
          "gl_FragColor=vec4(mix(off,on,k),1.0); }"].join("\n");
        const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
        const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
        if (!vs || !fs) return fallback();
        const pr = gl.createProgram()!; gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return fallback();
        gl.useProgram(pr);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const U = (n: string) => gl.getUniformLocation(pr, n);
        const tex = (img: HTMLImageElement, unit: number, name: string) => {
          const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); gl.uniform1i(U(name), unit);
        };
        let ready = false, W = 0, H = 0, iw = 1600, ih = 1066, raf = 0, until = 0;
        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
          if (!w || !h || (w === W && h === H)) return;
          W = canvas.width = w; H = canvas.height = h; gl.viewport(0, 0, w, h);
          const ca = w / h, ia = iw / ih; let sx = 1, sy = 1;
          if (ca > ia) sy = ia / ca; else sx = ca / ia;
          gl.uniform2f(U("u_scale"), sx, sy); gl.uniform2f(U("u_offset"), (1 - sx) * 0.5, (1 - sy) * 0.5);
          if (ready) render();
        };
        const render = () => {
          if (!ready) return;
          gl.uniform1f(U("u_p"), bld.p); gl.uniform1f(U("u_zoom"), bld.zoom); gl.uniform1f(U("u_time"), performance.now() / 1000);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        const loop = () => { render(); if (performance.now() < until) raf = requestAnimationFrame(loop); else raf = 0; };
        bld.draw = () => { until = performance.now() + 400; if (!raf) raf = requestAnimationFrame(loop); };
        let pending = 3;
        const loaded = () => {
          if (--pending) return;
          iw = onImg.naturalWidth || iw; ih = onImg.naturalHeight || ih;
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          tex(onImg, 0, "u_on"); tex(offImg, 1, "u_off"); tex(tImg, 2, "u_t");
          ready = true; W = H = 0; resize(); render(); offImg.style.opacity = "0";
        };
        [onImg, offImg, tImg].forEach((im) => { if (im.complete && im.naturalWidth) loaded(); else im.addEventListener("load", loaded, { once: true }); });
        new ResizeObserver(resize).observe(canvas);
      })();

      ctx = gsap.context(() => {
        const chs = gsap.utils.toArray<HTMLElement>(".ch");
        const film = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
          trigger: "#film", start: "top top", end: "+=" + (chs.length * 190 + 170) + "%",   /* a longer road, so each scene has time to land */
          scrub: 0.8, pin: true, anticipatePin: 1,
          onUpdate: () => bld.draw(),
          onToggle: (self) => document.documentElement.classList.toggle("in-film", self.isActive) } });
        film.to(bld, { p: 1.08, duration: 2.2, onUpdate: () => bld.draw() }, 0)
          .to(bld, { zoom: 1.5, duration: 3, ease: "power1.in", onUpdate: () => bld.draw() }, 0)
          .to(".ch-hero .ch-copy", { autoAlpha: 0, y: -30, duration: 0.45 }, 2.35);
        let t = 2.6;
        chs.slice(1).forEach((ch, i) => {
          const prev = chs[i], img = ch.querySelector("img"), copy = ch.querySelectorAll(".ch-copy > *");
          film.fromTo(ch, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, t)
            .fromTo(img, { scale: i === 0 ? 1.34 : 1.16 }, { scale: 1.02, duration: 2.4 }, t)
            .fromTo(copy, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.45 }, t + 0.45);
          if (i > 0) film.to(prev.querySelectorAll(".ch-copy > *"), { autoAlpha: 0, y: -26, stagger: 0.04, duration: 0.3 }, t - 0.05);
          t += 2;
        });
        film.to(chs[chs.length - 1].querySelectorAll(".ch-copy > *"), { autoAlpha: 0, duration: 0.35 }, t - 0.2)
          .to(".stage", { clipPath: window.innerWidth >= 1040 ? "inset(9% 7% 9% 7% round 32px)" : "inset(8% 4% 8% 4% round 24px)", scale: 0.96, duration: 0.9, ease: "power2.inOut" }, t);
        gsap.set(".stage", { clipPath: "inset(0% 0% 0% 0% round 0px)" });

        const track = document.querySelector<HTMLElement>(".track");
        if (track) {
          const slide = () => Math.min(0, -(track.scrollWidth - window.innerWidth + 40));
          gsap.to(track, { x: slide, ease: "none", scrollTrigger: { trigger: ".work-strip", start: "center center",
            end: () => "+=" + Math.max(1, -slide() * 1.5), scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
        }
        gsap.utils.toArray<HTMLElement>(".sec-head").forEach((h) =>
          gsap.from(h.children, { autoAlpha: 0, y: 40, stagger: 0.08, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 82%" } }));
        const wide = window.innerWidth >= 1040;
        gsap.fromTo(".flow-line i", { scaleX: wide ? 0 : 1, scaleY: wide ? 1 : 0 }, { scaleX: 1, scaleY: 1, ease: "none",
          scrollTrigger: { trigger: ".flow", start: "top 72%", end: "bottom 60%", scrub: 0.5 } });
        gsap.utils.toArray<HTMLElement>(".flow li").forEach((li, i) => {
          ScrollTrigger.create({ trigger: ".flow", start: "top " + (74 - i * 5) + "%", onToggle: (s) => li.classList.toggle("on", s.isActive || s.progress > 0) });
          gsap.from(li, { autoAlpha: 0, y: 26, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: ".flow", start: "top " + (78 - i * 4) + "%" } });
        });
        gsap.from(".why li", { autoAlpha: 0, y: 24, stagger: 0.06, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: ".why", start: "top 85%" } });
        gsap.fromTo(".finale", { clipPath: wide ? "inset(12% 10% 0% 10% round 32px)" : "inset(8% 4% 0% 4% round 24px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: ".finale", start: "top bottom", end: "top top", scrub: 0.5 } });
        gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ".finale", start: "top top", end: "+=110%", scrub: 0.6, pin: true, anticipatePin: 1 } })
          .fromTo(".fin-dark", { opacity: 0.55 }, { opacity: 0.12, duration: 0.6 }, 0)
          .fromTo(".fin-media img", { scale: 1.15 }, { scale: 1, duration: 0.9 }, 0)
          .fromTo(".fin-copy > *", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.25 }, 0.15)
          .to({}, { duration: 0.15 });
      });
      ScrollTrigger.refresh();
    };
    const wake = ["scroll", "wheel", "touchstart", "pointermove", "keydown"] as const;
    wake.forEach((ev) => window.addEventListener(ev, start, { passive: true }));
    return () => {
      wake.forEach((ev) => window.removeEventListener(ev, start));
      document.documentElement.classList.remove("in-film");
      ST?.getAll().forEach((t) => t.kill(true));
      ctx?.revert();
    };
  }, []);

  return null;
}

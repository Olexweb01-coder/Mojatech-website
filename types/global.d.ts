export {};

declare global {
  /** What other parts of the site need from the smooth-scroll engine. */
  interface LenisLike {
    scrollTo: (target: number | string | HTMLElement, options?: { immediate?: boolean; duration?: number }) => void;
    stop: () => void;
    start: () => void;
    destroy: () => void;
    raf: (time: number) => void;
  }
  interface Window {
    lenisRef?: LenisLike | null;
    mjPlayIntro?: () => void;
  }
}

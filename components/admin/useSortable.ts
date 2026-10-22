"use client";
import { useRef } from "react";

/* Drag to reorder a list, shared by Products and Work.
 *
 * Press and hold a row's handle, move, let go. Other rows slide out of the way
 * while you move, the page scrolls when you reach the top or bottom edge, and
 * the arrow keys move a row one place for keyboard users. Transforms are
 * written straight to the rows during the drag (no re-renders), which keeps it
 * smooth on long lists and low-end phones.
 *
 * onMove(from, to) is called once, when the row is dropped in a new place. */
export function useSortable(enabled: boolean, onMove: (from: number, to: number) => void) {
  const list = useRef<HTMLUListElement>(null);
  const drag = useRef<{
    from: number; to: number; startY: number; y: number; pointer: number;
    heights: number[]; tops: number[]; rows: HTMLElement[]; scroll: number; raf: number;
  } | null>(null);

  const layout = (d: NonNullable<typeof drag.current>) => {
    const dy = d.y - d.startY + (window.scrollY - d.scroll);
    const h = d.heights[d.from];
    const center = d.tops[d.from] + h / 2 + dy;
    let to = d.from;
    for (let i = 0; i < d.rows.length; i++) {
      const mid = d.tops[i] + d.heights[i] / 2;
      if (i > d.from && center > mid) to = i;
      if (i < d.from && center < mid && to === d.from) to = i;
    }
    d.to = to;
    const gap = d.rows.length > 1 ? d.tops[1] - d.tops[0] - d.heights[0] : 10;
    d.rows.forEach((row, i) => {
      if (i === d.from) row.style.transform = `translate3d(0, ${dy}px, 0)`;
      else if (i > d.from && i <= to) row.style.transform = `translate3d(0, ${-(h + gap)}px, 0)`;
      else if (i < d.from && i >= to) row.style.transform = `translate3d(0, ${h + gap}px, 0)`;
      else row.style.transform = "";
    });
  };

  const tick = () => {
    const d = drag.current;
    if (!d) return;
    const edge = 90, speed = 14;
    if (d.y < edge) window.scrollBy(0, -speed * (1 - d.y / edge));
    else if (d.y > window.innerHeight - edge) window.scrollBy(0, speed * (1 - (window.innerHeight - d.y) / edge));
    layout(d);
    d.raf = requestAnimationFrame(tick);
  };

  const end = () => {
    const d = drag.current;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    layout(d);                /* settle on the very last finger position */
    drag.current = null;
    list.current?.classList.remove("sorting");
    d.rows.forEach((r) => { r.style.transform = ""; r.classList.remove("lifted"); });
    if (d.to !== d.from) onMove(d.from, d.to);
  };

  /** Spread onto each row's handle button. */
  const handle = (index: number, count: number) => ({
    "data-noswipe": true,
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!enabled || !list.current) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const rows = Array.from(list.current.children) as HTMLElement[];
      const rects = rows.map((r) => r.getBoundingClientRect());
      drag.current = {
        from: index, to: index, startY: e.clientY, y: e.clientY, pointer: e.pointerId,
        heights: rects.map((r) => r.height), tops: rects.map((r) => r.top), rows, scroll: window.scrollY, raf: 0,
      };
      list.current.classList.add("sorting");
      rows[index].classList.add("lifted");
      navigator.vibrate?.(8);
      drag.current.raf = requestAnimationFrame(tick);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (d && e.pointerId === d.pointer) d.y = e.clientY;
    },
    onPointerUp: end,
    onPointerCancel: end,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!enabled || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      const to = e.key === "ArrowUp" ? index - 1 : index + 1;
      if (to < 0 || to >= count) return;
      onMove(index, to);
      requestAnimationFrame(() => (list.current?.children[to]?.querySelector(".mja-handle") as HTMLElement | null)?.focus());
    },
  });

  return { list, handle };
}

export function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

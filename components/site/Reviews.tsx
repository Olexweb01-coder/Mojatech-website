import Link from "next/link";
import type { Review } from "@/lib/reviews";

/* "What clients say". Only drawn when there is at least one published review,
 * so the website never shows an empty section. */
export default function Reviews({ reviews, tint = false }: { reviews: Review[]; tint?: boolean }) {
  if (!reviews.length) return null;
  return (
    <section className={"sec" + (tint ? " tint" : "")} aria-labelledby="t-reviews">
      <div className="wrap sec-head">
        <p className="kicker">What clients say</p>
        <h2 className="h2" id="t-reviews">In their own words.</h2>
      </div>
      <div className="wrap">
        <ul className="rgrid">
          {reviews.map((r) => (
            <li key={r.id} className="rcard">
              <p className="rstars" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span>{"★".repeat(5 - r.rating)}</span></p>
              <blockquote>{r.text}</blockquote>
              <p className="rwho"><b>{r.name}</b>{[r.place, r.service].filter(Boolean).map((x) => <span key={x}> · {x}</span>)}</p>
            </li>
          ))}
        </ul>
        <p className="rleave">Worked with us? <Link className="link" href="/review">Leave a review</Link></p>
      </div>
    </section>
  );
}

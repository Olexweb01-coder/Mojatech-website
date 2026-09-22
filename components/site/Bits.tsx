import Link from "next/link";
import { company } from "@/lib/data/company";

export function Hero({ kicker, head, lead, img, pos = "50% 50%", ctas, small }:
  { kicker: string; head: string; lead: string; img: string; pos?: string; ctas?: React.ReactNode; small?: boolean }) {
  return (
    <section className="phero" style={small ? { minHeight: "min(62svh, 520px)" } : undefined}>
      <div className="phero-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" style={{ objectPosition: pos }} fetchPriority="high" />
      </div>
      <div className="wrap">
        <p className="eyebrow">{kicker}</p>
        <h1 className="h1">{head}</h1>
        <p className="lead">{lead}</p>
        {ctas}
      </div>
    </section>
  );
}

export function Ctas({ primary = "Get a quote", secondary, light }:
  { primary?: string; secondary?: [string, string]; light?: boolean }) {
  return (
    <div className="ctas">
      <Link className="btn btn-red" href="/contact">{primary}</Link>
      {secondary && (secondary[1].startsWith("http")
        ? <a className={"btn " + (light ? "btn-light" : "btn-line")} href={secondary[1]} target="_blank" rel="noopener noreferrer">{secondary[0]}</a>
        : <Link className={"btn " + (light ? "btn-light" : "btn-line")} href={secondary[1]}>{secondary[0]}</Link>)}
    </div>
  );
}

export const WA = company.contact.whatsapp;

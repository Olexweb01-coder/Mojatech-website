import { Hero } from "@/components/site/Bits";
import PageMotion from "@/components/site/PageMotion";
import { QuoteForm } from "@/components/forms/Forms";
import { company } from "@/lib/data/company";
import { meta } from "@/lib/seo";

export const metadata = meta({
  title: "Contact us and get a quote",
  description: "Tell MOJATECH about the job in three short steps, or call 0816 168 3153. Electrical, solar, inverter and CCTV work anywhere in Nigeria.",
  path: "/contact", image: "/stock/contact.webp",
});

export default function Contact() {
  return (
    <>
      <PageMotion kind="contact" />
      <Hero kicker="Contact" head="Tell us about the job." lead="Three short steps, or call and speak to someone now."
        img="/stock/contact.webp" pos="50% 60%" small />

      <section className="sec">
        <div className="wrap grid-2">
          <div><QuoteForm /></div>
          <div>
            <h2 className="h2">Or reach us directly.</h2>
            <div className="cinfo">
              <a href={"tel:" + company.contact.phone}>+234 816 168 3153<small>Call or WhatsApp</small></a>
              <a href={"tel:" + company.contact.phoneAlt}>+234 902 110 3256<small>Second line</small></a>
              <a href={"mailto:" + company.contact.email}>{company.contact.email}<small>Email</small></a>
              <p><b>Office</b><small>{company.address.street}, {company.address.region}</small></p>
              <p><b>Where we work</b><small>Projects anywhere in Nigeria</small></p>
            </div>
            <div className="ctas" style={{ marginTop: 26 }}>
              <a className="btn btn-red" href={company.contact.whatsappQuote} target="_blank" rel="noopener noreferrer">WhatsApp us now</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

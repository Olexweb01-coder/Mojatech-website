import "./globals.css";
import { Header, Footer } from "@/components/site/Chrome";
import { Hero, Ctas } from "@/components/site/Bits";

export const metadata = { title: "Page not found | MOJATECH" };

/* Sits outside the website's layout (so it can catch any address), so it brings
 * the header and footer with it. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero kicker="Page not found" head="That page is not here."
          lead="It may have moved. Try the services, or tell us what you were looking for."
          img="/stock/house-off.webp" ctas={<Ctas secondary={["All services", "/services"]} light />} />
      </main>
      <Footer />
    </>
  );
}

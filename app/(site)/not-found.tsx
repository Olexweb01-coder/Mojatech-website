import { Hero, Ctas } from "@/components/site/Bits";

export const metadata = { title: "Page not found | MOJATECH" };

export default function NotFound() {
  return (
    <Hero kicker="Page not found" head="That page is not here."
      lead="It may have moved. Try the services, or tell us what you were looking for."
      img="/stock/house-off.webp" ctas={<Ctas secondary={["All services", "/services"]} light />} />
  );
}

import { Hero } from "@/components/site/Bits";
import { meta } from "@/lib/seo";
import { services } from "@/lib/data/services";
import ReviewForm from "./ReviewForm";

export const metadata = meta({
  title: "Leave a review",
  description: "Had work done by MOJATECH? Tell others how it went. It takes a minute.",
  path: "/review", image: "/work/lagos-house-electrical.jpg",
});

export default function ReviewPage() {
  return (
    <>
      <Hero kicker="Leave a review" head="How did we do?"
        lead="Thank you for choosing MOJATECH. A few honest words help other homes and businesses decide."
        img="/work/lagos-house-electrical.jpg" />
      <section className="sec review-page">
        <div className="wrap narrow">
          <p className="kicker">About a minute</p>
          <h2 className="h2">Tell others about the job.</h2>
          <ReviewForm services={services.map((s) => s.name)} />
        </div>
      </section>
    </>
  );
}

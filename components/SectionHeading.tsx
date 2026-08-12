import Reveal from "@/components/Reveal";

interface Props {
  eyebrow: string;
  title: string;
  lead?: string;
  tone?: "red" | "blue";
  align?: "left" | "center";
}

export default function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "red",
  align = "left",
}: Props) {
  const alignCls = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`max-w-3xl ${alignCls}`}>
      <Reveal>
        <p className={`label-tech ${tone === "blue" ? "label-tech--blue" : ""}`}>{eyebrow}</p>
      </Reveal>
      <Reveal delay={90}>
        <h2 className="display mt-4 text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
      </Reveal>
      {lead && (
        <Reveal delay={180}>
          <p className="mt-6 text-base leading-relaxed text-steel sm:text-lg">{lead}</p>
        </Reveal>
      )}
    </div>
  );
}

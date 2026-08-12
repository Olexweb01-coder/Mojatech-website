interface Props {
  label: string;
  className?: string;
  ratio?: string; // e.g. "aspect-[4/3]"
}

/**
 * A designed placeholder frame that clearly states which real MOJATECH
 * photograph should replace it. Swap for <Image> once assets exist.
 */
export default function ImagePlaceholder({
  label,
  className = "",
  ratio = "aspect-[4/3]",
}: Props) {
  return (
    <figure className={`ph-frame ${ratio} ${className}`} data-cursor="View">
      <figcaption className="relative z-10 max-w-[85%] text-center">
        <span className="label-tech label-tech--plain block text-steel/80">
          Upload asset
        </span>
        <span className="mt-2 block font-mono text-xs uppercase tracking-[0.14em] text-paper/70">
          [{label}]
        </span>
      </figcaption>
      <svg
        aria-hidden="true"
        className="absolute bottom-4 left-4 h-6 w-24 opacity-70"
        viewBox="0 0 96 24"
        fill="none"
      >
        <path d="M0 12 H36 L44 4 H60 L68 12 H96" stroke="rgba(244,245,247,0.25)" strokeWidth="1.5" />
        <path
          d="M0 12 H36 L44 4 H60 L68 12 H96"
          stroke="#C8102E"
          strokeWidth="1.5"
          className="current"
        />
      </svg>
    </figure>
  );
}

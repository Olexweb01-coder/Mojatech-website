import type { ServiceMotif } from "@/lib/data/services";

/**
 * Animated technical diagrams. Every motif is a literal illustration of
 * its service: current through a distribution circuit, energy from sun
 * to building, a scanning beam, building systems connecting, and a
 * blueprint drawing itself. Wrap in <Reveal> to trigger draw-in strokes.
 */
export default function Motif({
  kind,
  className = "",
}: {
  kind: ServiceMotif;
  className?: string;
}) {
  const common = {
    className: `h-auto w-full ${className}`,
    viewBox: "0 0 400 300",
    fill: "none",
    role: "img" as const,
  };
  const ghost = "rgba(244,245,247,0.14)";

  if (kind === "circuit") {
    const path = "M20 150 H120 V70 H230 M120 150 H230 M120 150 V230 H230";
    return (
      <svg {...common} aria-label="Animated diagram of electrical power distribution">
        <path d={path} stroke={ghost} strokeWidth="2" className="draw-on-in" />
        <path d={path} stroke="#C8102E" strokeWidth="2" className="current" />
        <rect x="230" y="50" width="120" height="40" stroke={ghost} strokeWidth="1.5" />
        <rect x="230" y="130" width="120" height="40" stroke={ghost} strokeWidth="1.5" />
        <rect x="230" y="210" width="120" height="40" stroke={ghost} strokeWidth="1.5" />
        <text x="244" y="75" fill="#9AA0B4" fontFamily="monospace" fontSize="11" letterSpacing="2">LIGHTING</text>
        <text x="244" y="155" fill="#9AA0B4" fontFamily="monospace" fontSize="11" letterSpacing="2">POWER</text>
        <text x="244" y="235" fill="#9AA0B4" fontFamily="monospace" fontSize="11" letterSpacing="2">SYSTEMS</text>
        <circle cx="20" cy="150" r="7" fill="#C8102E" className="node-pulse" />
        <circle cx="120" cy="150" r="4" fill="#5A5FF0" className="node-pulse" />
        <text x="10" y="180" fill="#9AA0B4" fontFamily="monospace" fontSize="11" letterSpacing="2">SOURCE</text>
      </svg>
    );
  }

  if (kind === "solar") {
    const flow = "M70 90 L150 130 H230 V190 H310";
    return (
      <svg {...common} aria-label="Animated diagram of solar energy flowing to a building">
        <circle cx="60" cy="60" r="24" stroke="#C8102E" strokeWidth="2" className="draw-on-in" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r1 = 32;
          const r2 = 42;
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={60 + r1 * Math.cos(rad)}
              y1={60 + r1 * Math.sin(rad)}
              x2={60 + r2 * Math.cos(rad)}
              y2={60 + r2 * Math.sin(rad)}
              stroke="#C8102E"
              strokeWidth="2"
            />
          );
        })}
        <g transform="rotate(-18 175 120)">
          <rect x="130" y="105" width="90" height="34" stroke={ghost} strokeWidth="1.5" />
          <line x1="160" y1="105" x2="160" y2="139" stroke={ghost} />
          <line x1="190" y1="105" x2="190" y2="139" stroke={ghost} />
        </g>
        <rect x="230" y="165" width="52" height="48" stroke={ghost} strokeWidth="1.5" />
        <text x="236" y="230" fill="#9AA0B4" fontFamily="monospace" fontSize="10" letterSpacing="2">SYSTEM</text>
        <path d="M300 250 V190 L330 168 L360 190 V250 Z" stroke={ghost} strokeWidth="1.5" />
        <text x="300" y="270" fill="#9AA0B4" fontFamily="monospace" fontSize="10" letterSpacing="2">BUILDING</text>
        <path d={flow} stroke={ghost} strokeWidth="2" className="draw-on-in" />
        <path d={flow} stroke="#C8102E" strokeWidth="2" className="current" />
        <circle cx="310" cy="190" r="5" fill="#5A5FF0" className="node-pulse" />
      </svg>
    );
  }

  if (kind === "scan") {
    return (
      <svg {...common} aria-label="Animated diagram of a security scan across a building">
        <path d="M80 260 V80 L200 40 L320 80 V260 Z" stroke={ghost} strokeWidth="1.5" className="draw-on-in" />
        {[120, 160, 200].map((y) => (
          <line key={y} x1="100" y1={y} x2="300" y2={y} stroke={ghost} />
        ))}
        <rect x="185" y="210" width="30" height="50" stroke={ghost} strokeWidth="1.5" />
        <circle cx="80" cy="80" r="5" fill="#C8102E" className="node-pulse" />
        <circle cx="320" cy="80" r="5" fill="#C8102E" className="node-pulse" />
        <circle cx="200" cy="40" r="5" fill="#5A5FF0" className="node-pulse" />
        <g className="scan-beam">
          <rect x="70" y="60" width="260" height="3" fill="#C8102E" opacity="0.9" />
          <rect x="70" y="63" width="260" height="26" fill="url(#scanFade)" />
        </g>
        <defs>
          <linearGradient id="scanFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C8102E" stopOpacity="0.35" />
            <stop offset="1" stopColor="#C8102E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <text x="80" y="288" fill="#9AA0B4" fontFamily="monospace" fontSize="10" letterSpacing="2">PERIMETER MONITORED</text>
      </svg>
    );
  }

  if (kind === "building") {
    const systems: [number, string][] = [
      [70, "POWER"],
      [110, "LIGHTING"],
      [150, "SECURITY"],
      [190, "SAFETY"],
      [230, "CONTROL"],
    ];
    return (
      <svg {...common} aria-label="Animated diagram of building systems connecting">
        <rect x="220" y="50" width="130" height="210" stroke={ghost} strokeWidth="1.5" className="draw-on-in" />
        {[92, 134, 176, 218].map((y) => (
          <line key={y} x1="220" y1={y} x2="350" y2={y} stroke={ghost} />
        ))}
        {systems.map(([y, label], i) => (
          <g key={label}>
            <path d={`M40 ${y} H220`} stroke={ghost} strokeWidth="1.5" />
            <path d={`M40 ${y} H220`} stroke="#C8102E" strokeWidth="1.5" className="current current--slow" style={{ animationDelay: `${i * 0.5}s` }} />
            <circle cx="40" cy={y} r="4" fill="#5A5FF0" className="node-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
            <text x="52" y={y - 8} fill="#9AA0B4" fontFamily="monospace" fontSize="10" letterSpacing="2">{label}</text>
          </g>
        ))}
        <text x="222" y="282" fill="#9AA0B4" fontFamily="monospace" fontSize="10" letterSpacing="2">FACILITY</text>
      </svg>
    );
  }

  // blueprint
  return (
    <svg {...common} aria-label="Animated technical blueprint drawing itself">
      <rect x="50" y="50" width="300" height="200" stroke="#5A5FF0" strokeWidth="1.5" className="draw-on-in" />
      <path d="M50 130 H350 M170 50 V250 M170 130 L260 200 M260 130 V250" stroke={ghost} strokeWidth="1.5" className="draw-on-in" />
      <circle cx="170" cy="130" r="26" stroke="#C8102E" strokeWidth="1.5" className="draw-on-in" />
      <line x1="50" y1="270" x2="350" y2="270" stroke={ghost} />
      <line x1="50" y1="264" x2="50" y2="276" stroke={ghost} />
      <line x1="350" y1="264" x2="350" y2="276" stroke={ghost} />
      <text x="160" y="290" fill="#9AA0B4" fontFamily="monospace" fontSize="10" letterSpacing="2">PLANNED</text>
      <circle cx="170" cy="130" r="4" fill="#C8102E" className="node-pulse" />
      <circle cx="260" cy="200" r="4" fill="#5A5FF0" className="node-pulse" />
    </svg>
  );
}

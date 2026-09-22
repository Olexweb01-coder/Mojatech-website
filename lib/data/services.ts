export type Service = {
  id: string; name: string; img: string; pos: string; head: string; sub: string;
  includes: string[]; steps: [string, string][]; faqs: [string, string][];
};

export const services: Service[] = [
  { id: "electrical-installation", name: "Electrical installation", img: "/stock/board.webp", pos: "50% 45%",
    head: "Wired right the first time.", sub: "Wiring, lighting, sockets and distribution boards for homes, offices and industrial buildings.",
    includes: ["Conduit and surface wiring", "Lighting systems", "Sockets and power distribution", "Distribution board installation and upgrades"],
    steps: [["Load assessment", "We measure what the building actually runs before anything is priced."], ["Design and materials", "Circuits, cable sizes and protection chosen for that load, using Grade A cable."], ["Installation and testing", "Installed, tested and commissioned, then handed over with support."]],
    faqs: [["Do you handle new buildings and rewiring?", "Yes. New installations, extensions and rewiring of existing buildings."], ["Can you upgrade an old distribution board?", "Yes. Board upgrades and protection changes are part of this service."]] },
  { id: "solar-inverter", name: "Solar, inverter and backup", img: "/stock/solar-roof.webp", pos: "50% 50%",
    head: "When the grid goes off, you don't.", sub: "Solar, inverters, lithium batteries and UPS, sized to what you actually run.",
    includes: ["Hybrid and off-grid inverter systems", "Lithium battery installation", "Solar panel sizing and setup", "UPS installation and system upgrades"],
    steps: [["Load assessment", "We list what must stay on and for how long."], ["System sizing", "Panels, inverter and battery sized to that list, not guesswork."], ["Install and commission", "Mounted, wired, tested and explained before we leave."]],
    faqs: [["Can I start small and add more later?", "Yes. Systems are planned so panels and batteries can be added later."], ["Do you service systems you didn't install?", "Yes, after an inspection to check what is already there."]] },
  { id: "cctv-security", name: "CCTV and security", img: "/stock/cctv.webp", pos: "45% 50%",
    head: "Eyes on every corner.", sub: "CCTV, access control, intercoms and alarms, installed and cabled properly.",
    includes: ["CCTV and surveillance", "Access control and intercoms", "Alarm systems", "Network cabling"],
    steps: [["Site walk-through", "Entry points, blind spots and cable routes are mapped first."], ["Camera and cable plan", "Coverage, storage and power decided before installation."], ["Install and hand over", "Mounted, cabled, configured and shown to you on your phone."]],
    faqs: [["Can I view the cameras from my phone?", "Yes, that is part of the setup and hand-over."], ["Do you cover gates and access control?", "Yes, including intercoms and access control."]] },
  { id: "industrial", name: "Industrial and low-voltage", img: "/stock/panel.webp", pos: "50% 50%",
    head: "Built for heavy loads.", sub: "Industrial power installations, low-voltage systems and panel work for plants and workshops.",
    includes: ["Industrial power installations", "Low-voltage system setup", "Panel building and upgrades", "Industrial maintenance"],
    steps: [["Load and layout study", "Machine loads, distribution and protection reviewed on site."], ["Panels and cabling", "Panels built or upgraded, cable routes and protection installed."], ["Testing and support", "Tested, commissioned and supported after hand-over."]],
    faqs: [["Do you work with contractors on site?", "Yes. We have delivered full electrical projects on active sites."], ["Can you maintain existing plant wiring?", "Yes, through inspection, testing and preventive maintenance."]] },
  { id: "maintenance", name: "Maintenance and troubleshooting", img: "/stock/maintenance.webp", pos: "55% 50%",
    head: "Find the fault. Fix it properly.", sub: "Fault finding, panel repair, inspection and preventive maintenance.",
    includes: ["Power failure diagnosis", "Panel repair", "Inspection and testing", "Preventive maintenance"],
    steps: [["Diagnose", "We trace the fault instead of replacing parts at random."], ["Repair", "The fault is fixed and the cause is explained."], ["Prevent", "Inspection and maintenance schedules to stop repeats."]],
    faqs: [["Do you take on one-off repairs?", "Yes, as well as ongoing maintenance."], ["Can you inspect a building before we buy it?", "Yes. Inspection and testing of an existing installation is part of this service."]] },
  { id: "power-audit", name: "Power audit and facility management", img: "/stock/audit.webp", pos: "50% 50%",
    head: "Know where every watt goes.", sub: "Energy audits, load assessment, facility electrical management and monitoring.",
    includes: ["Energy audit and load assessment", "Facility electrical management", "System monitoring"],
    steps: [["Measure", "Loads and consumption measured across the building."], ["Report", "Where the power goes, and what is costing you most."], ["Act", "Changes, upgrades or monitoring put in place."]],
    faqs: [["Is an audit worth it before going solar?", "Yes. Sizing a system without knowing the real load is guesswork."], ["Do you manage facilities long term?", "Yes, facility electrical management is part of this service."]] },
  { id: "automation", name: "Electrical automation", img: "/stock/automation.webp", pos: "50% 55%",
    head: "Your lights, on your phone.", sub: "Automated lighting, smart switching, energy monitoring and intelligent power management.",
    includes: ["Automated lighting control", "Smart switching", "Energy monitoring", "Intelligent power management"],
    steps: [["Decide the controls", "What should be automatic, and what stays manual."], ["Wire for it", "Switching and control wiring installed to suit."], ["Set up and show you", "Configured on your phone and handed over."]],
    faqs: [["Can automation be added to an existing house?", "It depends on the wiring; we check on site first."], ["Does it work when the grid is off?", "Yes, when it is installed alongside inverter or solar backup."]] }
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

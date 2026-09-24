/* ARIK AI: every answer lives here, in this project. No external service is called. */
export function createArik() {
var WA = "https://wa.me/2348161683153";
var lead = { on: false, step: 0, service: "", area: "", phone: "" };
/* ---------- words that mean the same thing here ---------- */
var SYN = [
  [/\bnepa\b|\bphcn\b|\bdisco\b|\bpublic power\b|\bmains\b/g, "grid"],
  [/\bgen\b|\bgenerator\b|\bgens\b/g, "generator"],
  [/\bpv\b|\bsolar panels?\b|\bsolar power\b/g, "solar"],
  [/\bups\b/g, "backup"],
  [/\bcamera?s?\b|\bsurveillance\b|\bcctvs?\b/g, "cctv"],
  [/\brewiring\b|\brewire\b|\bwires?\b|\bcabling\b|\bcables?\b/g, "wiring"],
  [/\bdb\b|\bdistribution board\b|\bfuse box\b|\bbreakers?\b|\bmcb\b|\brcd\b|\brcbo\b/g, "board"],
  [/\bearthing\b|\bgrounding\b|\bearth rod\b/g, "earth"],
  [/\bhow much\b|\bprices?\b|\bcosts?\b|\bcharge\b|\bbudget\b|\bquotation\b|\bquote\b|\bestimate\b/g, "price"],
  [/\bwhere\b|\blocation\b|\bareas?\b|\bcome to\b|\bcover\b/g, "area"],
  [/\bhow long\b|\bduration\b|\btimeline\b|\bhow many days\b/g, "duration"],
  [/\bguarantee\b|\bwarranty\b/g, "warranty"],
  [/\bfaults?\b|\bnot working\b|\bfix\b|\brepairs?\b|\bproblems?\b|\bissue\b|\bbroken\b/g, "repair"],
  [/\bfactory\b|\bplant\b|\bworkshop\b|\bindustry\b|\bindustrial\b/g, "industrial"],
  [/\bsmart home\b|\bautomation\b|\bautomate\b/g, "automation"],
  [/\benergy audit\b|\bpower audit\b|\bconsumption\b|\bbills?\b/g, "audit"],
  [/\bsiwes\b|\bit placement\b|\bindustrial training\b|\binternships?\b|\binterns?\b|\bapprentice\w*\b|\bnysc\b|\bcorpers?\b|\btrainings?\b|\btrainees?\b|\blearn the trade\b|\bemployment\b|\bvacanc(y|ies)\b|\bjobs?\b|\bhiring\b|\brecruit\w*\b|\bwork with you\b/g, "career"],
  [/\bcall you\b|\bwhatsapp\b|\bemail\b|\breach you\b|\bcontact\b|\byour number\b|\bphone number\b/g, "contact"],
  [/\bregistered\b|\bcac\b|\blicensed?\b|\bcertificate\b|\bcertified\b|\bnemsa\b|\blegit\b|\btrust\b/g, "credentials"],
  [/\binverters?\b/g, "inverter"], [/\bbatter(y|ies)\b/g, "battery"],
  [/\bsockets?\b|\boutlets?\b|\bplug points?\b/g, "socket"],
  [/\blights?\b|\blighting\b|\bbulbs?\b|\bfittings?\b/g, "lighting"]
];
function norm(t) {
  t = " " + String(t).toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ") + " ";
  SYN.forEach(function (r) { t = t.replace(r[0], r[1]); });
  return t;
}

var L = { quote: "/contact", services: "/services", work: "/work", careers: "/careers", about: "/about" };
function link(href, label) { return { href: href, label: label }; }

/* ---------- what ARIK AI knows ---------- */
var KB = [
  /* ---- the company ---- */
  { k: ["what does mojatech do", "about mojatech", "who are you company", "what do you do", "services offer", "tell me about"], t: "company",
    a: "MOJATECH Electrical Enterprises is an electrical and solar engineering company. We handle electrical installation, solar and inverter systems, CCTV and security, industrial and low-voltage work, maintenance, power audits and electrical automation, for homes, businesses and industry across Nigeria.", l: [link(L.services, "See all services")] },
  { k: ["credentials", "are you registered", "licensed", "can i trust"], t: "company",
    a: "Yes. MOJATECH is registered with the Corporate Affairs Commission since March 2019, business name number BN 2824770, and holds a NEMSA electrical installation competency certificate, Category C. We have delivered projects for Flour Mills NG, NRS Lagos and FIRS Lagos.", l: [link(L.about, "About MOJATECH"), link(L.work, "See our work")] },
  { k: ["how long have you", "experience", "years", "since when", "established"], t: "company",
    a: "MOJATECH has been registered and working since March 2019, on homes, offices and industrial sites." },
  { k: ["area", "do you work in", "outside lagos", "travel to", "do you come to", "serve my area"], t: "area",
    a: "We take on projects anywhere in Nigeria. Our office is at 21 Adeolubajo Street, off Ajegunle, Ogun State, and much of our work has been in Lagos, including Ikorodu, Ibeshe Road and client sites across the state. Tell me where you are and what the job is." },
  { k: ["contact", "speak to someone", "talk to a human", "customer care"], t: "contact",
    a: "Call or WhatsApp 0816 168 3153. Second line: 0902 110 3256. Email info@mojatechelectrical.com. Office: 21 Adeolubajo Street, off Ajegunle, Ogun State.", l: [link(WA, "WhatsApp now"), link("tel:+2348161683153", "Call 0816 168 3153")] },
  { k: ["office", "address", "visit", "located"], t: "contact",
    a: "The office is 21 Adeolubajo Street, off Ajegunle, Ogun State. Most work happens on site, so call or WhatsApp 0816 168 3153 before coming." },
  { k: ["open", "hours", "weekend", "sunday", "saturday", "available"], t: "contact",
    a: "The quickest way to reach us any day is WhatsApp on 0816 168 3153. Tell us the job and how urgent it is, and we will come back with a time.", l: [link(WA, "WhatsApp us")] },
  { k: ["clients", "who have you worked", "references", "projects done", "portfolio", "our work"], t: "work",
    a: "Projects include Ibeshe Road solar, a full electrical project for Flour Mills NG, inverter installation in Ikorodu, full electrical installations for NRS Lagos and FIRS Lagos, and full-house electrical works in Lagos State.", l: [link(L.work, "See the photos")] },

  /* ---- price, process, materials ---- */
  { k: ["price", "how much for", "cost of"], t: "price",
    a: "We quote after a load assessment, because the honest price depends on what the building runs, the cable sizes and the protection needed. Send the details and we will come back with what the job involves and what it costs.", l: [link(L.quote, "Request a quote"), link(WA, "Send details on WhatsApp")] },
  { k: ["free quote", "is quote free", "assessment cost"], t: "price",
    a: "Send us the details and we will tell you what the job involves. Anything about fees for a site visit is best confirmed directly on WhatsApp, since it depends on the location and the job.", l: [link(WA, "Ask on WhatsApp")] },
  { k: ["duration", "how fast", "when can you start", "urgent", "emergency"], t: "price",
    a: "Timing depends on the size of the job and the materials involved, so we confirm dates once we know the scope. If it is urgent, say so on WhatsApp and we will tell you what is possible.", l: [link(WA, "WhatsApp us")] },
  { k: ["process", "how do you work", "steps", "what happens"], t: "process",
    a: "Every job follows six steps: load assessment, system design, material selection, installation, testing and commissioning, then support after handover. You know what is happening at each stage.", l: [link(L.about, "How we work")] },
  { k: ["materials", "cable quality", "grade a", "what brand", "quality"], t: "process",
    a: "We use Grade A cables and standard protection devices, sized for the load rather than for the cheapest bill of materials. Undersized cable is the single most common cause of the faults we are called to fix." },
  { k: ["warranty"], t: "process",
    a: "Workmanship support after handover is part of how we work, and equipment such as panels, inverters and batteries carries the manufacturer's own warranty. For the exact terms on your job, confirm with us directly.", l: [link(WA, "Ask about warranty")] },
  { k: ["payment", "deposit", "installment", "pay"], t: "price",
    a: "Payment terms are agreed with the quote, once the scope is clear. Ask us directly and we will explain how it works for your job.", l: [link(WA, "Ask on WhatsApp")] },
  { k: ["do you supply", "buy materials", "sell", "equipment", "where to buy"], t: "process",
    a: "Material selection is part of our process, so we advise on what the job needs and can handle the supply along with the installation. Tell us the job and we will list what it takes.", l: [link(L.quote, "Get a quote")] },

  /* ---- electrical installation ---- */
  { k: ["wiring", "install electrical", "new building", "rewire house", "electrical installation"], t: "wiring",
    a: "We do conduit and surface wiring, lighting, sockets and power distribution, and distribution board installation or upgrades. New buildings, extensions and rewiring of old installations.", l: [link("/services/electrical-installation", "Electrical installation")] },
  { k: ["board", "upgrade board", "more breakers", "old fuse"], t: "wiring",
    a: "Yes. Board installation and upgrades are part of our electrical work: correct breakers, proper labelling and protection sized to the circuits behind them.", l: [link("/services/electrical-installation", "Electrical installation")] },
  { k: ["socket", "add point", "extra point"], t: "wiring",
    a: "Adding sockets or lighting points is straightforward work for us. What matters is whether the existing circuit and cable can carry the extra load, which we check first.", l: [link(L.quote, "Get a quote")] },
  { k: ["earth"], t: "wiring",
    a: "Earthing is what protects people when something fails: it gives fault current a safe path and lets the breaker trip. Many older buildings have none, or a rod that has dried out. It is part of what we test during installation and inspection." },

  /* ---- solar, inverter, battery ---- */
  { k: ["solar", "solar for my home", "install solar", "go solar"], t: "solar",
    a: "We install solar, hybrid and off-grid inverter systems, lithium batteries and UPS, sized to what you actually run. Every solar job starts with a load assessment so the system fits the house, not a package name.", l: [link("/services/solar-inverter", "Solar, inverter and backup"), link(L.quote, "Get a quote")] },
  { k: ["how many panels", "how many solar", "what size", "size my system", "how many battery", "kva", "kva do i need", "size inverter", "what size inverter"], t: "solar",
    a: "That comes from your load: we list what must stay on, for how many hours, add the surge of motors like a fridge or AC, then size panels, inverter and battery around it. Send me the appliances you want backed up and we will work it out properly.", l: [link(L.quote, "Send your load list")] },
  { k: ["inverter vs generator", "better than generator", "replace generator"], t: "solar",
    a: "An inverter runs silently, needs no fuel and switches over instantly, but it only carries the load you sized it for and recharges from grid or solar. A generator carries heavy loads on demand but costs fuel, noise and servicing. Many homes use an inverter for lights, fans, fridge and electronics, and keep a generator for heavy machinery." },
  { k: ["lithium", "tubular", "which battery", "battery type"], t: "solar",
    a: "Lithium batteries last longer, take deeper discharge and charge faster, with a higher price up front. Tubular batteries cost less to buy, need more care and space, and give fewer cycles. We advise based on your budget and how heavily the system will be used." },
  { k: ["hybrid", "off grid", "grid tie", "difference between"], t: "solar",
    a: "Off-grid runs only from panels and batteries. Hybrid uses solar and batteries but can also draw from the grid, which suits most Nigerian homes because it charges when the grid is up and carries you when it goes." },
  { k: ["grid", "when the light goes", "power goes off", "outage", "backup"], t: "solar",
    a: "That is what a properly sized inverter and battery system is for: when the grid drops, the changeover happens in an instant and your lights, fans, fridge and electronics keep running. How long depends on the battery size and the load, which we work out during the assessment.", l: [link("/services/solar-inverter", "Solar and backup")] },
  { k: ["solar not charging", "panels not charging", "battery not charging"], t: "fault",
    a: "Usually it is one of four things: shading or dirt on the panels, a loose or undersized DC cable, a tripped or wrong charge setting on the inverter, or a battery at the end of its life. It needs measuring, not guessing. Send us the make of inverter and battery and we will advise.", l: [link(WA, "Send the details")] },
  { k: ["battery drains", "battery finishes fast", "battery finishes", "battery does not last", "short backup", "backup is short", "runs down fast", "drains", "not lasting"], t: "fault",
    a: "Common causes: the load is bigger than the system was sized for, the battery is aged, the depth of discharge is set too low, or an appliance like a pumping machine or AC is on the backup circuit. A load assessment settles it quickly.", l: [link(L.quote, "Book an assessment")] },
  { k: ["inverter beeping", "inverter alarm", "overload", "beep", "beeping", "alarm", "inverter noise", "inverter shouting"], t: "fault",
    a: "Beeping usually means overload, low battery or high temperature. Switch off heavy appliances first and see whether it stops. If it keeps alarming with a light load, something is wrong in the wiring or the battery bank and it should be checked.", l: [link(WA, "Talk to a technician")] },
  { k: ["how long do panels last", "lifespan", "maintenance solar"], t: "solar",
    a: "Solar panels generally serve for decades with little more than cleaning, while inverters and batteries are the parts that wear and are eventually replaced. Keeping panels clean and the battery correctly charged does most of the work." },

  /* ---- security ---- */
  { k: ["cctv", "security", "install camera"], t: "cctv",
    a: "We install CCTV and surveillance, access control and intercoms, alarms and network cabling: cameras placed for real coverage, cabled properly, and set up on your phone before we leave.", l: [link("/services/cctv-security", "CCTV and security")] },
  { k: ["view on phone", "remote view", "watch from anywhere", "cctv on my phone", "see my cameras", "view my cctv", "watch remotely"], t: "cctv",
    a: "Yes. Viewing your cameras on your phone is part of the setup and hand-over, and we show you how it works before we finish." },
  { k: ["how many cameras", "coverage", "blind spot"], t: "cctv",
    a: "It depends on the entries, the corners and how far you need to recognise a face or a plate. We walk the site, mark the entry points and blind spots, then decide camera count, storage and power.", l: [link(L.quote, "Arrange a site walk-through")] },
  { k: ["night vision", "camera not recording", "cctv fault"], t: "fault",
    a: "Most CCTV faults come down to power, cable or storage: an underpowered supply, a damaged cable run, or a full or failed hard drive. If the picture is fine by day and poor at night, it is usually camera placement or infrared reflecting off a wall." },
  { k: ["gate", "access control", "intercom"], t: "cctv",
    a: "Yes, access control and intercoms are part of our security work, including gates.", l: [link("/services/cctv-security", "CCTV and security")] },

  /* ---- industrial, maintenance, audit, automation ---- */
  { k: ["industrial", "three phase", "3 phase", "panel building", "machines", "industrial panel", "control panel", "switchgear"], t: "industrial",
    a: "We handle industrial power installations, low-voltage systems, panel building and upgrades, and industrial maintenance. We have delivered full electrical projects on active sites, including Flour Mills NG.", l: [link("/services/industrial", "Industrial and low-voltage")] },
  { k: ["repair", "maintenance", "troubleshoot", "inspection", "servicing"], t: "fault",
    a: "We do fault finding, panel repair, inspection and testing, and preventive maintenance, including one-off repairs. We trace the fault rather than replacing parts at random, then explain what caused it.", l: [link("/services/maintenance", "Maintenance and troubleshooting")] },
  { k: ["audit", "high bill", "reduce bill", "energy"], t: "audit",
    a: "A power audit measures where your energy actually goes across the building, then reports what is costing you most and what to change. It is also the honest starting point before sizing solar.", l: [link("/services/power-audit", "Power audit and facility management")] },
  { k: ["automation", "control from phone", "smart switch", "monitoring"], t: "automation",
    a: "We install automated lighting control, smart switching, energy monitoring and intelligent power management, wired so it still behaves sensibly when the grid is off.", l: [link("/services/automation", "Electrical automation")] },
  { k: ["facility management", "manage building"], t: "audit",
    a: "Facility electrical management and system monitoring are part of our power audit service, for buildings that need someone keeping the electrical side in order.", l: [link("/services/power-audit", "Power audit and facility management")] },

  /* ---- common faults and safety ---- */
  { k: ["breaker trips", "tripping", "keeps tripping", "mcb trip"], t: "fault",
    a: "A breaker that trips is usually doing its job. The three usual causes are an overloaded circuit, a faulty appliance, or moisture and damaged insulation causing a leak to earth. Unplug everything on that circuit and add items back one by one; if it trips with nothing connected, the wiring needs checking.", l: [link(WA, "Get a technician")] },
  { k: ["flicker", "flickering", "blinking", "dim lights", "lights blinking", "light is dull"], t: "fault",
    a: "Flickering is often a loose connection at the switch, socket or board, or a voltage drop when a heavy appliance starts. Loose connections heat up and are a fire risk, so it is worth checking early rather than living with it." },
  { k: ["shock", "shocking", "current in tap", "electric shock", "burning smell", "smoke", "sparks", "fire"], t: "safety",
    a: "Treat that as urgent. Switch off at the main board, stop using the affected circuit, and do not open anything yourself. A shock from a tap or appliance usually means a fault in earthing or a live leak, and a burning smell means heat where there should be none. Call us on 0816 168 3153 and we will advise immediately.", l: [link("tel:+2348161683153", "Call now"), link(WA, "WhatsApp now")] },
  { k: ["no light in one room", "socket not working", "part of house"], t: "fault",
    a: "When one area dies and the rest is fine, it is usually that circuit's breaker, a loose neutral, or a failed joint in the run. It is traceable quickly with a tester; guessing usually means replacing good parts.", l: [link(WA, "Send the details")] },
  { k: ["ac trips", "air conditioner", "fridge trips", "pumping machine", "motor"], t: "fault",
    a: "Motors draw several times their running current at start-up. If the AC, fridge or pumping machine trips the breaker or stalls the inverter, the usual causes are a breaker or cable sized for running load only, or an inverter without the surge capacity for that motor. It is fixable once the real figures are measured." },
  { k: ["prepaid meter", "meter", "estimated bill", "disco"], t: "fault",
    a: "Meters and billing belong to your electricity distribution company, not to us, so that is one to take up with them. Anything on your side of the meter, wiring, board, earthing or backup, is ours." },
  { k: ["can i do it myself", "diy", "teach me to fix"], t: "safety",
    a: "Small things like resetting a breaker are fine. Anything inside the board, or any work on live circuits, is not worth the risk: the cost of getting it wrong is a fire or a life. Call a qualified electrician for that part." },

  /* ---- careers ---- */
  { k: ["career"], t: "career",
    a: "We take on interns, apprentices, NYSC members and industrial training (SIWES) students, and teach them on live jobs. Places depend on the projects running at the time, so tell us when you are available. Applications go to hr@mojatechelectrical.com.", l: [link(L.careers, "See the programmes and apply"), link("mailto:hr@mojatechelectrical.com", "Email HR")] },
  { k: ["how to apply", "application", "apply", "send cv", "my cv", "resume", "send my details", "hr email"], t: "career",
    a: "Apply on the Careers page with your programme, school and start date, or send your CV to hr@mojatechelectrical.com. WhatsApp 0816 168 3153 gets the fastest reply.", l: [link(L.careers, "Apply"), link("mailto:hr@mojatechelectrical.com", "Email your CV")] },
  { k: ["paid", "stipend", "salary", "allowance"], t: "career",
    a: "That depends on the programme and the projects running, so it is best confirmed directly. Ask on WhatsApp and you will get a straight answer.", l: [link(WA, "Ask about it")] },
  { k: ["what will i learn", "skills"], t: "career",
    a: "Conduit and surface wiring, distribution boards and protection, solar panels, inverters and batteries, CCTV and cabling, testing and fault finding, and how to conduct yourself on site with clients.", l: [link(L.careers, "Careers")] },

  { k: ["church", "mosque", "school", "hostel", "hotel", "estate", "shop", "supermarket", "office", "restaurant", "hospital", "clinic", "building type", "do you install in"], t: "company",
    a: "Yes. We work on homes, businesses and industry: houses and estates, shops and offices, churches and mosques, schools, hotels, clinics, factories and workshops. Tell me the building and what it runs, and we will take it from there.", l: [link(L.quote, "Get a quote"), link(L.services, "See all services")] },

  /* ---- small talk ---- */
  { k: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "how are you"], t: "hi",
    a: "Hello. I am ARIK AI, MOJATECH's assistant. Ask me about wiring, solar and inverters, CCTV, our projects or careers, or describe the problem you are having." },
  { k: ["who are you", "are you human", "are you a robot", "your name", "arik"], t: "hi",
    a: "I am ARIK AI, MOJATECH's assistant on this website, not a person. I answer from MOJATECH's own information. For a human, WhatsApp 0816 168 3153.", l: [link(WA, "Talk to a person")] },
  { k: ["thank", "thanks", "ok", "okay", "nice", "great", "well done"], t: "hi",
    a: "Anytime. If you want it moving, send the job details and we will come back with what it involves.", l: [link(L.quote, "Get a quote")] },
  { k: ["bye", "goodbye", "later"], t: "hi", a: "Take care. We are on 0816 168 3153 whenever you need us." }
];

/* topic fallbacks, so every question lands somewhere useful */
var TOPIC = {
  solar: "That is our solar, inverter and backup work: systems sized to what you actually run, with panels, inverters, lithium batteries and UPS. Tell me the appliances you want to keep on and I can point you the right way.",
  cctv: "That falls under our CCTV and security work: cameras, access control, intercoms, alarms and proper cabling, set up on your phone before we leave.",
  wiring: "That is electrical installation: wiring, lighting, sockets, power distribution and distribution boards, for new buildings and rewiring.",
  industrial: "That is our industrial and low-voltage side: industrial power installations, panel work and maintenance for plants and workshops.",
  fault: "That sounds like a fault-finding job. We trace the cause, repair it, and tell you what caused it rather than guessing.",
  audit: "That is our power audit and facility management work: measuring where your energy goes and what to change.",
  automation: "That is electrical automation: lighting control, smart switching, energy monitoring and intelligent power management.",
  career: "That is our careers side: internship, apprenticeship, NYSC placement and industrial training, taught on live jobs. Applications go to hr@mojatechelectrical.com.",
  price: "We quote after a load assessment, because the honest number depends on the load, cable sizes and protection. Send the details and we will come back to you.",
  contact: "Call or WhatsApp 0816 168 3153, or email info@mojatechelectrical.com.",
  company: "MOJATECH Electrical Enterprises installs, maintains and backs up electrical, solar and security systems across Nigeria."
};

KB.forEach(function (e) { e.k = e.k.map(function (kw) { return norm(kw).trim(); }); });
function score(q, entry) {
  var sc = 0;
  entry.k.forEach(function (kw) {
    var words = kw.split(" ");
    if (q.indexOf(" " + kw + " ") > -1) { sc += 6 + words.length * 2; return; }
    if (words.length > 1 && q.indexOf(kw) > -1) { sc += 4 + words.length; return; }
    if (words.length === 1 && q.indexOf(" " + kw) > -1) sc += 3 + (kw.length > 6 ? 3 : 0);
  });
  return sc;
}
var OFFTOPIC = /\b(president|governor|election|politic|football|match|arsenal|chelsea|weather|bitcoin|forex|visa|lottery|bet|love|girlfriend|boyfriend|song|movie|recipe|joke|exam result|jamb|waec)\b/;
var DANGER = /\b(shock|shocked|shocking|electrocut\w*|burning|burnt|smoke|smoking|spark\w*|fire|melting|sizzl\w*|explod\w*|naked wire|live wire|water is touching)\b/;
function answer(raw) {
  var q = norm(raw);
  if (DANGER.test(q)) return { text: "Treat that as urgent. Switch off at the main board, stop using that circuit and do not open anything yourself. A shock from a tap or appliance usually means a fault in the earthing or a live leak, and a burning smell or sparking means heat where there should be none. Call MOJATECH on 0816 168 3153 now and we will advise you straight away.", links: [link("tel:+2348161683153", "Call 0816 168 3153"), link(WA, "WhatsApp now")], hit: true };
  if (OFFTOPIC.test(q)) return { text: "That one is outside what I know. I am MOJATECH's assistant, so I can help with wiring, solar and inverters, CCTV, industrial power, maintenance, our projects and careers. What do you need electrically?", links: [link(L.services, "See all services")], hit: true };
  var best = null, bestScore = 0, topics = {};
  KB.forEach(function (e) {
    var sc = score(q, e);
    if (sc) topics[e.t] = (topics[e.t] || 0) + sc;
    if (sc > bestScore) { bestScore = sc; best = e; }
  });
  if (best && bestScore >= 6) return { text: best.a, links: best.l || [], hit: true };
  var top = Object.keys(topics).sort(function (a, b) { return topics[b] - topics[a]; })[0];
  if (top && TOPIC[top]) return { text: TOPIC[top], links: [link(L.quote, "Get a quote"), link(WA, "Ask on WhatsApp")], hit: true };
  if (/\b(load|appliance|fan|fridge|tv|freezer|pump|borehole|ac|house|shop|office|church|hostel|apartment|estate)\b/.test(q))
    return { text: "Tell me what you want powered and where the building is, and I will point you to the right service. If you would rather we work it out properly, send the list and we will do a load assessment.", links: [link(L.quote, "Get a quote"), link(WA, "WhatsApp us")], hit: true };
  if (/\d[\d\s-]{7,}/.test(raw)) return { text: "Thanks. Send that to MOJATECH with the button below and someone will call you back, or use the quote form so nothing is missed.", links: [link(WA + "?text=" + encodeURIComponent("Hello MOJATECH, please call me back on " + raw.trim() + "."), "Send my number on WhatsApp"), link(L.quote, "Use the quote form")], hit: true };
  return { text: "I answer questions about MOJATECH and electrical work: wiring, solar and inverters, CCTV and security, industrial power, maintenance, power audits, automation, our projects and careers. Ask me one of those and I will help. For anything else, a person is on WhatsApp.", links: [link(WA, "Talk to a person"), link(L.services, "See all services")], hit: false };
}

/* ---------- quote conversation ---------- */
function leadReply(raw) {
  if (lead.step === 1) { lead.service = raw; lead.step = 2; return { text: "Got it. Which area is the building in?", links: [] }; }
  if (lead.step === 2) { lead.area = raw; lead.step = 3; return { text: "Thanks. What number should MOJATECH call or WhatsApp you on?", links: [] }; }
  if (lead.step === 3) {
    lead.phone = raw; lead.on = false; lead.step = 0;
    var msg = "Hello MOJATECH, I need help with: " + lead.service + ". Area: " + lead.area + ". My number: " + lead.phone + ".";
    return { text: "Thank you. Send it straight to MOJATECH now with the button below, or use the quote form. Someone will come back to you on " + lead.phone + ".",
      links: [link(WA + "?text=" + encodeURIComponent(msg), "Send to MOJATECH on WhatsApp"), link(L.quote, "Use the quote form")] };
  }
  return null;
}
function wantsQuote(raw) {
  var q = norm(raw);
  return /\b(i want|i need|i would like|book|arrange|come and|please install|can you install)\b/.test(q)
    && !/\bcareer\b/.test(q) && !newQuestion(raw);
}
/* A new question always wins over the quote conversation. */
function newQuestion(raw) {
  var q = norm(raw);
  if (/\?/.test(raw)) return true;
  var top = 0;
  KB.forEach(function (e) { var sc = score(q, e); if (sc > top) top = sc; });
  return top >= 10;
}


return { answer: answer, leadReply: leadReply, wantsQuote: wantsQuote, newQuestion: newQuestion, state: lead };
}

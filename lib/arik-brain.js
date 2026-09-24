/* ARIK AI: every answer lives here, in this project. No external service is called.
 *
 * How it thinks, in order:
 *   1. Danger first. Shocks, smoke, sparks or burning are answered immediately.
 *   2. Conversation. Greetings, thanks, "how are you", "who are you", "what can you do".
 *   3. Knowledge. Answers about MOJATECH and about electrical work generally.
 *   4. Memory. Short follow-ups ("how much?", "and solar?") continue the last subject.
 *   5. Unsure? It asks which of two subjects is meant, rather than guessing.
 *   6. Nothing relevant? It says so politely and points back to what it can help with.
 */

export function createArik() {
  const WA = "https://wa.me/2348161683153";
  const PHONE = "0816 168 3153";
  const MAIL = "info@mojatechelectrical.com";
  const HR = "hr@mojatechelectrical.com";
  const L = { quote: "/contact", services: "/services", work: "/work", careers: "/careers", about: "/about" };
  const link = (href, label) => ({ href, label });
  const lead = { on: false, step: 0, service: "", area: "", phone: "" };
  const memory = { topic: "" };

  const SYN = [
    [/\bnepa\b|\bphcn\b|\bdisco\b|\bpublic power\b|\bmains\b|\bnational grid\b/g, "grid"],
    [/\bgens?\b|\bgenerators?\b|\bgen set\b|\bgenset\b/g, "generator"],
    [/\bpv\b|\bsolar panels?\b|\bsolar power\b|\bsolar system\b/g, "solar"],
    [/\bcameras?\b|\bsurveillance\b|\bcctvs?\b|\bsecurity camera\b/g, "cctv"],
    [/\brewiring\b|\brewire\b|\bwires?\b|\bcabling\b|\bcables?\b|\bwiring\b/g, "wiring"],
    [/\bdb\b|\bdistribution board\b|\bfuse box\b|\bbreakers?\b|\bmcbs?\b|\brcds?\b|\brcbos?\b|\bconsumer unit\b/g, "board"],
    [/\bearthing\b|\bgrounding\b|\bearth rod\b|\bearthed\b/g, "earth"],
    [/\bhow much\b|\bprices?\b|\bcosts?\b|\bcharges?\b|\bbudget\b|\bquotations?\b|\bquotes?\b|\bestimates?\b|\bexpensive\b/g, "price"],
    [/\blocations?\b|\bareas?\b|\bcome to\b|\bservice area\b/g, "area"],
    [/\bhow long\b|\bdurations?\b|\btimelines?\b|\bhow many days\b|\bwhen can you\b/g, "duration"],
    [/\bguarantees?\b|\bwarrant(y|ies)\b/g, "warranty"],
    [/\bfaults?\b|\bnot working\b|\bfix\b|\brepairs?\b|\bproblems?\b|\bissues?\b|\bbroken\b|\bspoilt\b/g, "repair"],
    [/\bfactor(y|ies)\b|\bplants?\b|\bworkshops?\b|\bindustry\b|\bindustrial\b|\bwarehouse\b/g, "industrial"],
    [/\bsmart home\b|\bautomations?\b|\bautomate\b|\bsmart switch\w*\b/g, "automation"],
    [/\benergy audit\b|\bpower audit\b|\bconsumption\b|\bbills?\b|\bmeter reading\b/g, "audit"],
    [/\bsiwes\b|\bit placement\b|\bindustrial training\b|\binternships?\b|\binterns?\b|\bapprentice\w*\b|\bnysc\b|\bcorpers?\b|\btrainings?\b|\btrainees?\b|\blearn the trade\b|\bemployment\b|\bvacanc(y|ies)\b|\bjob opening\w*\b|\bhiring\b|\brecruit\w*\b|\bwork with you\b|\bwork for you\b/g, "career"],
    [/\bcontacts?\b|\breach you\b|\bcall you\b|\bwhatsapp\b|\bemails?\b|\byour number\b|\bphone number\b|\bget in touch\b/g, "contact"],
    [/\bregistered\b|\bcac\b|\blicen[sc]ed?\b|\bcertificates?\b|\bcertified\b|\bnemsa\b|\blegit\b|\btrust\w*\b|\bgenuine\b|\bscam\b/g, "credentials"],
    [/\binverters?\b/g, "inverter"], [/\bbatter(y|ies)\b/g, "battery"],
    [/\bsockets?\b|\boutlets?\b|\bplug points?\b/g, "socket"],
    [/\blights?\b|\blighting\b|\bbulbs?\b|\bfittings?\b/g, "lighting"],
    [/\bacs?\b|\bair conditioners?\b|\bair conditioning\b/g, "aircon"],
    [/\bstabili[sz]ers?\b|\bavrs?\b|\bvoltage regulators?\b/g, "stabiliser"],
  ];
  const norm = (t) => {
    let s = " " + String(t).toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ") + " ";
    SYN.forEach((r) => { s = s.replace(r[0], r[1]); });
    return s;
  };
  const STOP = new Set(["the", "a", "an", "is", "are", "am", "do", "does", "did", "you", "your", "yours", "i", "my", "me",
    "we", "our", "us", "it", "its", "to", "of", "for", "and", "or", "in", "on", "at", "can", "could", "would", "will",
    "please", "kindly", "just", "so", "if", "that", "this", "there", "have", "has", "had", "be", "been", "with", "about",
    "want", "need", "like", "get", "got", "know", "tell", "say", "what", "which", "who", "how", "when", "any", "some", "pls"]);
  const stem = (w) => w.replace(/(ing|ed|es|s)$/, "");
  const words = (s) => norm(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w)).map(stem);

  const CHAT = [
    { re: /\b(how are you|how you dey|how far|hope you are fine|how is it going|how do you do|wassup|whats up)\b/,
      a: "I am well, thank you for asking. I am ARIK AI, MOJATECH's assistant. What can I help you with: wiring, solar and inverters, CCTV, a fault you are having, or careers?" },
    { re: /^\s*(hi|hello|hey|yo|hola|good morning|good afternoon|good evening|good day|greetings)\b/,
      a: "Hello. I am ARIK AI, MOJATECH's assistant. Ask me about electrical work, solar and inverters, CCTV, our projects or careers, or simply describe the problem you are having." },
    { re: /\b(thank you|thanks|thank u|appreciate|god bless|well done|nice one|good job)\b/,
      a: "You are welcome. If you would like it moving, send us the details and we will come back with what the job involves.", l: [link("/contact", "Get a quote")] },
    { re: /\b(who are you|what are you|your name|are you human|are you a robot|are you real|who made you|who built you|are you ai)\b/,
      a: "I am ARIK AI, the assistant on MOJATECH's website. I am not a person: I answer from MOJATECH's own information and from general electrical knowledge. For a person, WhatsApp " + PHONE + ".",
      l: [link(WA, "Talk to a person")] },
    { re: /\b(what can you do|how can you help|what do you know|what should i ask|menu)\b|^\s*(help|i need help)\s*[?.!]?\s*$/,
      a: "I can explain what MOJATECH does and what a job involves, help you work out what you need for solar or backup, walk through a fault you are having, tell you about our projects, and answer questions about internships and training. Ask in your own words." },
    { re: /^\s*(ok|okay|alright|fine|cool|great|good|noted|got it|sure|nice|hmm|mm)\s*[.!]?\s*$/,
      a: "Anything else you would like to ask? If you are ready, tell me what you need and where the building is, and I will point you the right way." },
    { re: /\b(bye|goodbye|later|good night|see you|that is all|thats all)\b/,
      a: "Take care. We are on " + PHONE + " whenever you need us." },
    { re: /\b(sorry|my bad|oops)\b/, a: "No problem at all. What would you like to know?" },
    { re: /\b(are you there|you there|still there)\b/, a: "I am here. Ask away." },
    { re: /\b(speak|talk) to (a )?(human|person|someone|agent|staff)\b|\b(customer care|customer service)\b/,
      a: "Of course. WhatsApp " + PHONE + " and someone from MOJATECH will reply, or call the same number.",
      l: [link(WA, "WhatsApp a person"), link("tel:+2348161683153", "Call " + PHONE)] },
    { re: /\b(nice website|beautiful site|this is nice|impressive|i love this|nice work|good work|well done|keep it up)\b/,
      a: "Thank you. If there is anything you need doing electrically, tell me about it and I will point you the right way." },
  ];

  const KB = [
    { id: "what", t: "company", k: ["what does mojatech do", "what do you do", "what do you guys do", "what do u do", "what work do you do", "what kind of work", "wetin una dey do", "what una dey do", "about mojatech", "tell me about mojatech", "what is mojatech", "services do you offer", "what services", "your services"],
      a: "MOJATECH Electrical Enterprises is an electrical and solar engineering company. We do electrical installation, solar and inverter backup, CCTV and security, industrial and low-voltage work, maintenance and fault finding, power audits and electrical automation, for homes, businesses and industry across Nigeria.",
      l: [link(L.services, "See all services")] },
    { id: "credentials", t: "company", k: ["credentials", "registered", "are you licensed", "can i trust you", "are you genuine", "company number"],
      a: "Yes. MOJATECH is registered with the Corporate Affairs Commission since March 2019, business name BN 2824770, and holds a NEMSA electrical installation competency certificate, Category C. We have delivered projects for Flour Mills NG, NRS Lagos and FIRS Lagos.",
      l: [link(L.about, "About us"), link(L.work, "See our work")] },
    { id: "experience", t: "company", k: ["how long have you", "experience", "years in business", "since when", "established", "how old is the company"],
      a: "MOJATECH has been registered and working since March 2019, on homes, offices and industrial sites across Nigeria." },
    { id: "area", t: "area", k: ["area", "do you work in", "where do you work", "where are you based", "outside lagos", "travel to", "do you come to", "serve my area", "which states", "are you in lagos", "do you cover"],
      a: "We take on projects anywhere in Nigeria. Our office is at 21 Adeolubajo Street, off Ajegunle, Ogun State, and much of our work has been across Lagos, including Ikorodu and Ibeshe Road. Tell me where you are and what the job is." },
    { id: "contact", t: "contact", k: ["contact", "speak to someone", "customer care", "how do i reach", "your email", "your number"],
      a: "Call or WhatsApp " + PHONE + ". Second line: 0902 110 3256. Email " + MAIL + ". Office: 21 Adeolubajo Street, off Ajegunle, Ogun State.",
      l: [link(WA, "WhatsApp now"), link("tel:+2348161683153", "Call " + PHONE)] },
    { id: "office", t: "contact", k: ["office", "address", "visit", "located", "where is your office", "where are you", "your location"],
      a: "The office is 21 Adeolubajo Street, off Ajegunle, Ogun State. Most of our work happens on site, so call or WhatsApp " + PHONE + " before coming." },
    { id: "hours", t: "contact", k: ["open", "hours", "weekend", "sunday", "saturday", "available", "what time"],
      a: "WhatsApp on " + PHONE + " is the quickest way to reach us on any day. Tell us the job and how urgent it is, and we will come back with a time.", l: [link(WA, "WhatsApp us")] },
    { id: "clients", t: "work", k: ["clients", "who have you worked", "references", "projects done", "portfolio", "our work", "past jobs", "examples"],
      a: "Projects include solar at Ibeshe Road, a full electrical project for Flour Mills NG, inverter installation in Ikorodu, and full electrical installations for NRS Lagos and FIRS Lagos.",
      l: [link(L.work, "See the photos")] },
    { id: "buildings", t: "company", k: ["church", "mosque", "school", "hostel", "hotel", "estate", "shop", "supermarket", "restaurant", "hospital", "clinic", "do you install in", "residential", "commercial"],
      a: "Yes. We work on homes, businesses and industry: houses and estates, shops and offices, churches and mosques, schools, hotels, clinics, factories and workshops. Tell me the building and what it runs." },
    { id: "team", t: "company", k: ["your team", "how many staff", "who will come", "technicians", "engineers"],
      a: "Work is carried out by our own technicians rather than casual hands, which is how the finish stays consistent. Tell me the job and we will say what it involves." },

    { id: "price", t: "price", k: ["price", "how much for", "cost of", "what will it cost", "pricing"],
      a: "We quote after a load assessment, because the honest price depends on what the building actually runs, the cable sizes and the protection needed. Send the details and we will come back with what the job involves and what it costs.",
      l: [link(L.quote, "Request a quote"), link(WA, "Send details on WhatsApp")], follow: "What is the job, and roughly what do you want powered?" },
    { id: "survey", t: "price", k: ["free quote", "is quote free", "assessment cost", "site visit", "inspection fee", "do you charge to come"],
      a: "Send us the details and we will tell you what the job involves. Anything about a fee for a site visit depends on the location and the job, so confirm that directly on WhatsApp.", l: [link(WA, "Ask on WhatsApp")] },
    { id: "duration", t: "price", k: ["duration", "how fast", "when can you start", "how soon", "urgent", "emergency"],
      a: "Timing depends on the size of the job and the materials involved, so we confirm dates once the scope is clear. If it is urgent, say so on WhatsApp and we will tell you what is possible.", l: [link(WA, "WhatsApp us")] },
    { id: "process", t: "process", k: ["process", "how do you work", "steps", "what happens", "procedure", "what to expect"],
      a: "Every job follows six steps: load assessment, system design, material selection, installation, testing and commissioning, then support after handover. You know what is happening at each stage.",
      l: [link(L.about, "How we work")] },
    { id: "materials", t: "process", k: ["materials", "cable quality", "grade a", "what brand", "quality", "original", "fake materials"],
      a: "We use Grade A cables and standard protection devices, sized for the load rather than for the cheapest bill of materials. Undersized cable is the single most common cause of the faults we are called to fix." },
    { id: "warranty", t: "process", k: ["warranty"],
      a: "Support after handover is part of how we work, and equipment such as panels, inverters and batteries carries the manufacturer's own warranty. For the exact terms on your job, confirm with us directly.", l: [link(WA, "Ask about warranty")] },
    { id: "payment", t: "price", k: ["payment", "deposit", "installment", "pay", "part payment", "bank transfer", "financing"],
      a: "Payment terms are agreed with the quote, once the scope is clear. Ask us directly and we will explain how it works for your job.", l: [link(WA, "Ask on WhatsApp")] },
    { id: "cando", t: "company", k: ["can you do", "can you handle", "do you do", "is it something you do", "do you take on", "can you help with"],
      a: "Most likely, yes. We cover electrical installation, solar and inverter backup, CCTV and security, industrial and low-voltage work, maintenance and fault finding, power audits and automation. Tell me what the job is and I will say exactly how we would handle it.",
      l: [link(L.services, "See all services"), link(L.quote, "Get a quote")] },
    { id: "bank", t: "price", k: ["bank account", "account details", "account number", "how do i pay you", "where do i pay", "transfer money", "send money"],
      a: "Payment details are shared directly by MOJATECH once the quote is agreed, never posted on a website. Ask on WhatsApp " + PHONE + " or email " + MAIL + " and you will get them from us, so you always know who you are paying.",
      l: [link(WA, "Ask on WhatsApp"), link("mailto:" + MAIL, "Email us")] },
    { id: "complaint", t: "contact", k: ["complain", "complaint", "unhappy", "not satisfied", "poor job", "bad job", "report a problem", "not done well", "job was not", "poorly done", "did a bad", "redo the work", "not happy with"],
      a: "I am sorry to hear that. Tell MOJATECH directly on " + PHONE + " or email " + MAIL + " with what happened and where, and someone will take it up with you properly.",
      l: [link(WA, "WhatsApp us"), link("tel:+2348161683153", "Call " + PHONE), link("mailto:" + MAIL, "Email us")] },
    { id: "supply", t: "process", k: ["do you supply", "buy materials", "sell", "equipment", "where to buy", "do you sell"],
      a: "Material selection is part of our process, so we advise on what the job needs and can handle the supply along with the installation. Tell me the job and we will list what it takes.", l: [link(L.quote, "Get a quote")] },
    { id: "existing", t: "process", k: ["already installed", "another company", "someone else installed", "take over", "continue a job", "abandoned"],
      a: "Yes, we take over work started by someone else, but we inspect first and tell you honestly what is safe to keep and what should be redone.", l: [link(WA, "Send photos on WhatsApp")] },

    { id: "wiring", t: "wiring", k: ["wiring", "install electrical", "new building", "rewire house", "electrical installation", "wire my house"],
      a: "We do conduit and surface wiring, lighting, sockets and power distribution, and distribution board installation or upgrades: new buildings, extensions and rewiring of old installations.",
      l: [link("/services/electrical-installation", "Electrical installation")], follow: "Is it a new building, an extension, or rewiring something existing?" },
    { id: "board", t: "wiring", k: ["board", "upgrade board", "more breakers", "old fuse", "change over switch", "changeover"],
      a: "Yes. Board installation and upgrades are part of our electrical work: correct breakers, proper labelling, changeover arrangements, and protection sized to the circuits behind them.",
      l: [link("/services/electrical-installation", "Electrical installation")] },
    { id: "socket", t: "wiring", k: ["socket", "add point", "extra point", "more sockets", "switch"],
      a: "Adding sockets or lighting points is straightforward work for us. What matters is whether the existing circuit and cable can carry the extra load, which we check first.", l: [link(L.quote, "Get a quote")] },
    { id: "earth", t: "wiring", k: ["earth"],
      a: "Earthing is what protects people when something fails: it gives fault current a safe path so the breaker trips instead of the metal staying live. Many older buildings have none, or a rod that has dried out. We test it during installation and inspection." },
    { id: "3phase", t: "industrial", k: ["three phase", "3 phase", "single phase", "phase", "upgrade to three phase"],
      a: "Single phase suits most homes. Three phase suits heavy or motor-driven loads and lets large loads be spread across phases so nothing is overloaded. Whether you need it depends on your total load and what your supply allows, which the assessment settles." },
    { id: "conduit", t: "wiring", k: ["conduit", "surface wiring", "trunking", "concealed", "casing"],
      a: "Concealed conduit is neater and protects the cable inside the walls; surface work is quicker and easier to alter later. We advise based on the building stage and how you want it to look." },

    { id: "solar", t: "solar", k: ["solar", "install solar", "go solar", "solar for my home", "want solar"],
      a: "We install solar, hybrid and off-grid inverter systems, lithium batteries and UPS, sized to what you actually run. Every solar job starts with a load assessment so the system fits the building rather than a package name.",
      l: [link("/services/solar-inverter", "Solar, inverter and backup"), link(L.quote, "Get a quote")],
      follow: "What do you want to keep running when the grid is off?" },
    { id: "sizing", t: "solar", k: ["how many panels", "how many solar", "what size", "size my system", "how many battery", "kva", "kva do i need", "size inverter", "what size inverter", "what capacity"],
      a: "It comes from your load: we list what must stay on and for how many hours, add the surge that motors like a fridge or air conditioner draw at start-up, then size panels, inverter and battery around it. Send me the appliances you want backed up and we will work it out properly.",
      l: [link(L.quote, "Send your load list")] },
    { id: "invertervsgen", t: "solar", k: ["inverter vs generator", "better than generator", "replace generator", "generator"],
      a: "An inverter runs silently, needs no fuel and switches over instantly, but it only carries the load you sized it for and has to recharge from grid or solar. A generator carries heavy loads on demand but costs fuel, noise and servicing. Many homes run an inverter for lights, fans, fridge and electronics and keep a generator for heavy machinery." },
    { id: "batterytype", t: "solar", k: ["lithium", "tubular", "which battery", "battery type", "gel battery", "how long do batteries last"],
      a: "Lithium batteries last longer, take deeper discharge and charge faster, at a higher price up front. Tubular batteries cost less to buy but need more care and space and give fewer cycles. We advise based on your budget and how hard the system will work." },
    { id: "hybrid", t: "solar", k: ["hybrid", "off grid", "grid tie", "difference between hybrid"],
      a: "Off-grid runs only from panels and batteries. Hybrid uses solar and batteries but can also draw from the grid, which suits most Nigerian homes: it charges when the grid is up and carries you when it goes." },
    { id: "gridoff", t: "solar", k: ["grid", "when the light goes", "power goes off", "outage", "backup", "no light"],
      a: "That is what a properly sized inverter and battery system is for: when the grid drops, the changeover happens in an instant and your lights, fans, fridge and electronics keep running. How long depends on the battery size and the load, which the assessment settles.",
      l: [link("/services/solar-inverter", "Solar and backup")] },
    { id: "solarac", t: "solar", k: ["solar for aircon", "run aircon on solar", "aircon on inverter", "can solar carry aircon"],
      a: "It can be done, but an air conditioner is a heavy load with a big start-up surge, so it needs a larger inverter, more panels and a battery bank to match. We usually price it as a separate option so you can see what that comfort costs before deciding." },
    { id: "solarmaint", t: "solar", k: ["clean panels", "maintain solar", "how long do panels last", "panel lifespan", "dust on panels"],
      a: "Panels generally serve for decades and mostly need cleaning; inverters and batteries are the parts that wear and are eventually replaced. Keeping panels clean and the battery correctly charged does most of the work." },
    { id: "solarnight", t: "solar", k: ["solar at night", "when there is no sun", "rainy season", "cloudy"],
      a: "Panels only make power in daylight, so nights and dull days run from the battery, and a hybrid system can top up from the grid. That is why the battery is sized around the hours you need rather than the panels alone." },

    { id: "cctv", t: "cctv", k: ["cctv", "security", "install camera", "want cameras"],
      a: "We install CCTV and surveillance, access control and intercoms, alarms and network cabling: cameras placed for real coverage, cabled properly, and set up on your phone before we leave.",
      l: [link("/services/cctv-security", "CCTV and security")], follow: "Is it for a home, a shop, or a larger site?" },
    { id: "cctvphone", t: "cctv", k: ["view on phone", "remote view", "watch from anywhere", "cctv on my phone", "see my cameras", "watch remotely"],
      a: "Yes. Viewing your cameras on your phone is part of the setup and hand-over, and we show you how it works before we finish." },
    { id: "cctvcount", t: "cctv", k: ["how many cctv", "coverage", "blind spot", "where to put cameras"],
      a: "It depends on the entries, the corners, and how far you need to recognise a face or a plate. We walk the site, mark entry points and blind spots, then decide camera count, storage and power.",
      l: [link(L.quote, "Arrange a site walk-through")] },
    { id: "cctvstorage", t: "cctv", k: ["how long does it record", "storage", "hard drive", "footage", "recording days"],
      a: "How many days you keep depends on the number of cameras, the resolution and the drive size. Tell us how far back you want to be able to look and we will size the storage for it." },
    { id: "access", t: "cctv", k: ["gate", "access control", "intercom", "door lock", "alarm"],
      a: "Yes, access control, intercoms, gates and alarm systems are part of our security work.",
      l: [link("/services/cctv-security", "CCTV and security")] },

    { id: "industrial", t: "industrial", k: ["industrial", "panel building", "machines", "switchgear", "plant wiring", "factory wiring"],
      a: "We handle industrial power installations, low-voltage systems, panel building and upgrades, and industrial maintenance. We have delivered full electrical projects on active sites, including Flour Mills NG.",
      l: [link("/services/industrial", "Industrial and low-voltage")] },
    { id: "maintenance", t: "fault", k: ["repair", "maintenance", "troubleshoot", "inspection", "servicing", "check my wiring", "electrician"],
      a: "We do fault finding, panel repair, inspection and testing, and preventive maintenance, including one-off repairs. We trace the fault rather than replacing parts at random, then explain what caused it.",
      l: [link("/services/maintenance", "Maintenance and troubleshooting")], follow: "What is happening, and where in the building?" },
    { id: "audit", t: "audit", k: ["audit", "high bill", "reduce bill", "energy", "save electricity", "why is my bill high"],
      a: "A power audit measures where your energy actually goes across the building, then reports what is costing you most and what to change. It is also the honest starting point before sizing solar.",
      l: [link("/services/power-audit", "Power audit and facility management")] },
    { id: "automation", t: "automation", k: ["automation", "control from phone", "smart switch", "monitoring", "smart house"],
      a: "We install automated lighting control, smart switching, energy monitoring and intelligent power management, wired so it still behaves sensibly when the grid is off.",
      l: [link("/services/automation", "Electrical automation")] },
    { id: "facility", t: "audit", k: ["facility management", "manage building", "monthly maintenance", "retainer"],
      a: "Facility electrical management and system monitoring are part of our power audit service, for buildings that need someone keeping the electrical side in order.",
      l: [link("/services/power-audit", "Power audit and facility management")] },

    { id: "tripping", t: "fault", k: ["board trips", "tripping", "keeps tripping", "power keeps going off"],
      a: "A breaker that trips is usually doing its job. The three usual causes are an overloaded circuit, a faulty appliance, or moisture and damaged insulation leaking to earth. Unplug everything on that circuit and add items back one at a time; if it trips with nothing connected, the wiring needs checking.",
      l: [link(WA, "Get a technician")] },
    { id: "flicker", t: "fault", k: ["flicker", "flickering", "blinking", "dim lighting", "light is dull"],
      a: "Flickering is often a loose connection at a switch, socket or the board, or a voltage drop when a heavy appliance starts. Loose connections heat up and are a fire risk, so it is worth checking early rather than living with it." },
    { id: "deadcircuit", t: "fault", k: ["no lighting in one room", "socket not working", "part of house", "one room has no power", "half of the house"],
      a: "When one area dies and the rest is fine, it is usually that circuit's breaker, a loose neutral, or a failed joint in the run. A tester traces it quickly; guessing usually means replacing good parts.",
      l: [link(WA, "Send the details")] },
    { id: "motor", t: "fault", k: ["aircon trips", "fridge trips", "pumping machine", "motor", "washing machine trips"],
      a: "Motors draw several times their running current at start-up. If the air conditioner, fridge or pumping machine trips the breaker or stalls the inverter, it is usually a breaker or cable sized for running load only, or an inverter without the surge capacity for that motor. It is fixable once the real figures are measured." },
    { id: "invbeep", t: "fault", k: ["inverter beeping", "inverter alarm", "overload", "beep", "beeping", "alarm", "inverter noise"],
      a: "Beeping usually means overload, low battery or high temperature. Switch off heavy appliances first and see whether it stops. If it keeps alarming on a light load, something is wrong in the wiring or the battery bank and it should be checked.",
      l: [link(WA, "Talk to a technician")] },
    { id: "batdrain", t: "fault", k: ["battery drains", "battery finishes fast", "battery finishes", "short backup", "backup is short", "not lasting", "runs down fast"],
      a: "Common causes: the load is bigger than the system was sized for, the battery has aged, the depth of discharge is set wrong, or something heavy like a pumping machine or air conditioner sits on the backup circuit. A load assessment settles it quickly.",
      l: [link(L.quote, "Book an assessment")] },
    { id: "nocharge", t: "fault", k: ["solar not charging", "not charging", "battery not charging", "inverter not charging"],
      a: "Usually one of four things: shading or dirt on the panels, a loose or undersized DC cable, a wrong charge setting on the inverter, or a battery at the end of its life. It needs measuring, not guessing. Send us the make of inverter and battery and we will advise.",
      l: [link(WA, "Send the details")] },
    { id: "cctvfault", t: "fault", k: ["night vision", "cctv not recording", "cctv fault", "cctv offline", "cctv not working"],
      a: "Most CCTV faults come down to power, cable or storage: an underpowered supply, a damaged cable run, or a full or failed hard drive. If the picture is fine by day and poor at night, it is usually camera placement or infrared bouncing off a nearby wall." },
    { id: "voltage", t: "fault", k: ["low voltage", "high voltage", "voltage fluctuation", "stabiliser", "appliances spoiling", "surge"],
      a: "Swinging voltage damages appliances over time. A stabiliser protects one appliance, surge protection at the board protects the installation, and an inverter with a proper output holds a steady voltage for whatever is on backup. Which you need depends on how bad the supply is, which we measure." },
    { id: "meter", t: "fault", k: ["prepaid meter", "meter", "estimated bill", "token", "band a"],
      a: "Meters, tokens and billing belong to your electricity distribution company, so those go to them. Anything on your side of the meter, wiring, board, earthing or backup, is ours." },
    { id: "diy", t: "safety", k: ["can i do it myself", "diy", "teach me to fix", "should i try"],
      a: "Small things like resetting a breaker are fine. Anything inside the board, or any work on live circuits, is not worth the risk: the cost of getting it wrong is a fire or a life. Call a qualified electrician for that part." },

    { id: "careers", t: "career", k: ["career"],
      a: "We take on interns, apprentices, NYSC members and industrial training (SIWES) students, and teach them on live jobs. Places depend on the projects running at the time, so tell us when you are available. Applications go to " + HR + ".",
      l: [link(L.careers, "See the programmes and apply"), link("mailto:" + HR, "Email HR")] },
    { id: "apply", t: "career", k: ["how to apply", "application", "apply", "send cv", "my cv", "resume", "send my details", "hr email"],
      a: "Apply on the Careers page with your programme, school and start date, or send your CV to " + HR + ". WhatsApp " + PHONE + " gets the fastest reply.",
      l: [link(L.careers, "Apply"), link("mailto:" + HR, "Email your CV")] },
    { id: "stipend", t: "career", k: ["paid", "stipend", "salary", "allowance", "is it paid"],
      a: "That depends on the programme and the projects running, so it is best confirmed directly. Ask on WhatsApp or email " + HR + " and you will get a straight answer.",
      l: [link(WA, "Ask about it"), link("mailto:" + HR, "Email HR")] },
    { id: "learn", t: "career", k: ["what will i learn", "skills", "what do you teach", "curriculum"],
      a: "Conduit and surface wiring, distribution boards and protection, solar panels, inverters and batteries, CCTV and cabling, testing and fault finding, and how to conduct yourself on site with clients.",
      l: [link(L.careers, "Careers")] },
    { id: "traindur", t: "career", k: ["how long is the career", "career duration", "how long does it take to learn"],
      a: "It depends on the programme and on the projects running at the time. Tell us which programme and when you are available, and HR will come back with what is possible.",
      l: [link(L.careers, "Careers"), link("mailto:" + HR, "Email HR")] },
  ];

  const TOPIC = {
    solar: "That is our solar, inverter and backup work: systems sized to what you actually run, with panels, inverters, lithium batteries and UPS. Tell me what you want to keep on and I can point you the right way.",
    cctv: "That falls under our CCTV and security work: cameras, access control, intercoms, alarms and proper cabling, set up on your phone before we leave.",
    wiring: "That is electrical installation: wiring, lighting, sockets, power distribution and distribution boards, for new buildings and for rewiring.",
    industrial: "That is our industrial and low-voltage side: industrial power installations, panel work and maintenance for plants and workshops.",
    fault: "That sounds like a fault-finding job. We trace the cause, repair it, and tell you what caused it rather than guessing.",
    audit: "That is our power audit and facility management work: measuring where your energy goes and what to change.",
    automation: "That is electrical automation: lighting control, smart switching, energy monitoring and intelligent power management.",
    career: "That is our careers side: internship, apprenticeship, NYSC placement and industrial training, taught on live jobs. Applications go to " + HR + ".",
    price: "We quote after a load assessment, because the honest number depends on the load, cable sizes and protection. Send the details and we will come back to you.",
    contact: "Call or WhatsApp " + PHONE + ", or email " + MAIL + ".",
    company: "MOJATECH Electrical Enterprises installs, maintains and backs up electrical, solar and security systems across Nigeria.",
    process: "Every job runs through six steps: load assessment, design, materials, installation, testing and commissioning, then support afterwards.",
    area: "We take on projects anywhere in Nigeria, from our base in Ogun State.",
    work: "Our projects include solar at Ibeshe Road, Flour Mills NG, inverter work in Ikorodu, and installations for NRS and FIRS Lagos.",
    safety: "If anything is sparking, smoking or giving shocks, switch off at the main board and call " + PHONE + " straight away.",
  };
  const TOPIC_NAME = { solar: "solar and backup", cctv: "CCTV and security", wiring: "electrical installation",
    industrial: "industrial work", fault: "a fault you are having", audit: "power audits", automation: "automation",
    career: "careers and training", price: "prices and quotes", contact: "contacting us", company: "the company",
    process: "how we work", area: "where we work", work: "our projects", safety: "an urgent safety problem" };

  const PLACES = /\b(lagos|ikorodu|ibeshe|ikeja|lekki|ajah|yaba|surulere|festac|badagry|epe|ogun|abeokuta|sagamu|ijebu|ota|mowe|ibafo|akute|abuja|ibadan|oyo|osun|osogbo|ilorin|kwara|benin|edo|delta|warri|asaba|port harcourt|rivers|enugu|anambra|onitsha|awka|owerri|imo|abia|aba|kano|kaduna|jos|plateau|maiduguri|calabar|uyo|akwa ibom|niger|minna|lokoja|kogi|ekiti|ado|ondo|akure|nigeria)\b/;
  const OFFTOPIC = /\b(president|governor|election|politic|football|soccer|arsenal|chelsea|weather|bitcoin|crypto|forex|visa|lottery|bet|betting|girlfriend|boyfriend|marriage|song|music|movie|film|recipe|cook|joke|bible|quran|jamb|waec|neco|admission|scholarship|loan|flight)\b/;
  const DANGER = /\b(shock|shocked|shocking|electrocut\w*|burning|burnt|smoke|smoking|spark\w*|fire|melting|sizzl\w*|explod\w*|naked wiring|live wiring|water is touching|shook me)\b/;

  KB.forEach((e) => { e.k = e.k.map((kw) => norm(kw).trim()); e.tok = e.k.map((kw) => words(kw)); });

  function score(q, qt, entry) {
    let s = 0;
    entry.k.forEach((kw) => {
      const n = kw.split(" ").length;
      if (q.indexOf(" " + kw + " ") > -1) { s += 8 + n * 3; return; }
      if (n > 1 && q.indexOf(kw) > -1) { s += 5 + n * 2; return; }
      if (n === 1 && q.indexOf(" " + kw) > -1) s += 3 + (kw.length > 6 ? 3 : 0);
    });
    const flat = new Set([].concat.apply([], entry.tok));
    let hits = 0;
    qt.forEach((w) => { if (flat.has(w)) hits += 1; });
    if (hits) s += hits * 2 + (hits > 1 ? 2 : 0);
    return s;
  }

  /* every word the knowledge bank knows about, used to spot questions that are
     nothing to do with electrical work */
  const DOMAIN = new Set();
  KB.forEach((e) => { e.tok.forEach((list) => list.forEach((w) => DOMAIN.add(w))); });
  ["mojatech", "power", "electric", "electrical", "light", "current", "supply", "energi", "instal"].forEach((w) => DOMAIN.add(w));
  const OFF_REPLY = {
    text: "Hello. That question is not about MOJATECH's work, so I cannot help with it. Ask me anything about electrical installation, solar and inverters, CCTV and security, industrial power, a fault you are having, our projects or careers, and I will answer properly.",
    links: [link(L.services, "See what we do"), link(WA, "Talk to a person")], hit: false };

  function answer(raw) {
    const q = norm(raw);
    const qt = words(raw);

    if (DANGER.test(q)) {
      memory.topic = "safety";
      return { text: "Treat that as urgent. Switch off at the main board, stop using that circuit and do not open anything yourself. A shock from a tap or an appliance usually means a fault in the earthing or a live leak, and a burning smell or sparking means heat where there should be none. Call MOJATECH on " + PHONE + " now and we will advise you straight away.",
        links: [link("tel:+2348161683153", "Call " + PHONE), link(WA, "WhatsApp now")], hit: true };
    }

    if (OFFTOPIC.test(q)) return OFF_REPLY;

    for (let i = 0; i < CHAT.length; i++) {
      if (CHAT[i].re.test(q)) return { text: CHAT[i].a, links: CHAT[i].l || [], hit: true };
    }

    /* a phone number is always meaningful */
    if (/\d[\d\s-]{7,}/.test(raw)) {
      return { text: "Thanks. Send that to MOJATECH with the button below and someone will call you back, or use the quote form so nothing is missed.",
        links: [link(WA + "?text=" + encodeURIComponent("Hello MOJATECH, please call me back on " + raw.trim() + "."), "Send my number on WhatsApp"), link(L.quote, "Use the quote form")], hit: true };
    }
    /* a place on its own usually means "do you work here?" */
    if (qt.length <= 4 && PLACES.test(q)) {
      memory.topic = "area";
      return { text: "Yes, we take on work there. We are based in Ogun State and work anywhere in Nigeria. Tell me what the job is and I will point you the right way.",
        links: [link(L.quote, "Get a quote"), link(WA, "WhatsApp us")], hit: true };
    }
    /* a list of appliances means they are working out a backup system */
    if (/\b(fan|fridge|freezer|tv|pump|borehole|aircon|lighting|socket|water heater|deep freezer)\b/.test(q)) {
      memory.topic = "solar";
      return { text: "Tell me the full list of what you want powered and roughly how many hours a day, and I will point you to the right service. If you would rather we work it out properly, send the list and we will do a load assessment.",
        links: [link(L.quote, "Get a quote"), link(WA, "WhatsApp us")], hit: true };
    }

    /* nothing in the question belongs to electrical work at all */
    const known = qt.filter((w) => DOMAIN.has(w)).length;
    if (qt.length && !known) return OFF_REPLY;

    let best = null, bestScore = 0, second = 0, secondTopic = "";
    KB.forEach((e) => {
      const s = score(q, qt, e);
      if (!s) return;
      if (s > bestScore) { second = bestScore; secondTopic = best ? best.t : ""; bestScore = s; best = e; }
      else if (s > second) { second = s; secondTopic = e.t; }
    });

    if (qt.length <= 3 && memory.topic && bestScore < 8) {
      if (/price/.test(q)) return { text: TOPIC.price, links: [link(L.quote, "Get a quote"), link(WA, "Ask on WhatsApp")], hit: true };
      if (TOPIC[memory.topic]) return { text: TOPIC[memory.topic], links: [link(L.quote, "Get a quote")], hit: true };
    }

    if (best && bestScore >= 8) {
      memory.topic = best.t;
      return { text: best.follow ? best.a + "\n\n" + best.follow : best.a, links: best.l || [], hit: true };
    }

    if (best && bestScore >= 7 && known) {
      const other = secondTopic && secondTopic !== best.t ? secondTopic : "";
      memory.topic = best.t;
      if (other && TOPIC_NAME[other]) {
        return { text: "I want to be sure I answer the right thing. Do you mean " + TOPIC_NAME[best.t] + ", or " + TOPIC_NAME[other] + "?", links: [], hit: true };
      }
      return { text: TOPIC[best.t] || TOPIC.company, links: [link(L.quote, "Get a quote"), link(WA, "Ask on WhatsApp")], hit: true };
    }

    return OFF_REPLY;
  }

  function leadReply(raw) {
    if (lead.step === 1) { lead.service = raw; lead.step = 2; return { text: "Got it. Which area is the building in?", links: [] }; }
    if (lead.step === 2) { lead.area = raw; lead.step = 3; return { text: "Thanks. What number should MOJATECH call or WhatsApp you on?", links: [] }; }
    if (lead.step === 3) {
      lead.phone = raw; lead.on = false; lead.step = 0;
      const msg = "Hello MOJATECH, I need help with: " + lead.service + ". Area: " + lead.area + ". My number: " + lead.phone + ".";
      return { text: "Thank you. Send it straight to MOJATECH with the button below, or use the quote form. Someone will come back to you on " + lead.phone + ".",
        links: [link(WA + "?text=" + encodeURIComponent(msg), "Send to MOJATECH on WhatsApp"), link(L.quote, "Use the quote form")] };
    }
    return null;
  }
  function newQuestion(raw) {
    const q = norm(raw), qt = words(raw);
    if (/\?/.test(raw)) return true;
    let top = 0;
    KB.forEach((e) => { const s = score(q, qt, e); if (s > top) top = s; });
    return top >= 12;
  }
  function wantsQuote(raw) {
    const q = norm(raw);
    return /\b(i want|i need|i would like|book|arrange|come and|please install|can you install|interested in)\b/.test(q)
      && !/\bcareer\b/.test(q) && !/\?/.test(raw);
  }

  return { answer, leadReply, wantsQuote, newQuestion, state: lead };
}

/**
 * ------------------------------------------------------------------
 * MOJATECH — central company information
 * ------------------------------------------------------------------
 * Edit THIS file to update contact details, social links and business
 * information across the entire website. Any value that still starts
 * with "[ADD:" is treated as "not yet provided" and the UI will hide
 * the related link/button automatically instead of showing fake data.
 * ------------------------------------------------------------------
 */

export const company = {
  name: "MOJATECH Electrical Enterprises",
  shortName: "MOJATECH",
  legalName: "MOJATECH Electrical Enterprises",
  tagline: "Power. Safety. Control. Reliability.",
  description:
    "MOJATECH Electrical Enterprises is an electrical engineering, solar power, safety systems, security, electrical consultancy, general building management and facility solutions company based in Lagos, Nigeria.",
  location: {
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    countryCode: "NG",
  },
  contact: {
    phone: "+234 816 168 3153",
    // WhatsApp number in international format, digits only.
    whatsapp: "2348161683153",
    email: "mojatech01@gmail.com",
    address: "Lagos, Nigeria",
  },
  social: {
    instagram: "[ADD: Instagram profile URL]",
    linkedin: "[ADD: LinkedIn company page URL]",
    facebook: "[ADD: Facebook page URL]",
    x: "[ADD: X / Twitter profile URL]",
  },
};

/** Base URL used for canonical links, sitemap and Open Graph. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.mojatechelectrical.com";

/** True when a value has been filled in (i.e. is not an "[ADD:" placeholder). */
export function isProvided(value: string | undefined | null): value is string {
  return !!value && !value.trim().startsWith("[ADD");
}

/**
 * Preset message attached to every WhatsApp link so MOJATECH instantly
 * knows the chat is coming from the website. Edit freely.
 */
export const whatsappPresetMessage =
  "Hello MOJATECH, I am reaching out from your website and would like to make an enquiry.";

export function whatsappHref(): string | null {
  const raw = company.contact.whatsapp;
  if (!isProvided(raw)) return null;
  const number = raw.replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappPresetMessage)}`;
}

export function phoneHref(): string | null {
  const raw = company.contact.phone;
  if (!isProvided(raw)) return null;
  return `tel:${raw.replace(/[^+0-9]/g, "")}`;
}

export function emailHref(): string | null {
  const raw = company.contact.email;
  if (!isProvided(raw)) return null;
  return `mailto:${raw}`;
}

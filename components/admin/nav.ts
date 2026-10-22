/* The admin's sections. A section appears in the menu only once it is built,
 * so there is never a link to an empty page. */

import type { Perm } from "@/lib/admin-auth";

export type NavIcon = "arik" | "products" | "inbox" | "work" | "star" | "team" | "calendar";
export type NavItem = { href: string; label: string; icon: NavIcon; hint: string; perm?: Perm };

export const NAV: NavItem[] = [
  { href: "/admin", label: "Arik", icon: "arik", hint: "Your assistant" },
  { href: "/admin/schedule", label: "Schedule", icon: "calendar", hint: "Reminders, visits, jobs" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "inbox", hint: "Quotes, orders, applications", perm: "enquiries" },
  { href: "/admin/products", label: "Products", icon: "products", hint: "Catalogue and prices", perm: "products" },
  { href: "/admin/work", label: "Work", icon: "work", hint: "Projects and photos", perm: "work" },
  { href: "/admin/reviews", label: "Reviews", icon: "star", hint: "What customers say", perm: "reviews" },
  { href: "/admin/team", label: "Team", icon: "team", hint: "Who can sign in", perm: "team" },
];

export const titleFor = (path: string) =>
  path.startsWith("/admin/account") ? "Your account" : [...NAV].sort((a, b) => b.href.length - a.href.length).find((n) => path === n.href || path.startsWith(n.href + "/"))?.label ?? "MOJATECH";

import { notFound } from "next/navigation";

/* Any address the website does not have lands here, so the "page not found"
 * screen is shown inside the website's own layout (header, footer, styles). */
export default function Missing() {
  notFound();
}

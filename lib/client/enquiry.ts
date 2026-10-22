/* Saves a website enquiry for the admin, without making the visitor wait.
 * keepalive lets it finish even as WhatsApp opens. */
export function sendEnquiry(data: {
  kind: "quote" | "order" | "careers";
  name?: string; phone?: string; email?: string;
  fields: [string, string][];
  website?: string;     /* the hidden "leave empty" field; only bots fill it */
  openedAt: number;     /* performance.now() when the form appeared */
}) {
  try {
    void fetch("/api/enquiry", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, t: Math.round(performance.now() - data.openedAt), page: location.pathname }),
    }).catch(() => {});
  } catch { /* never block the visitor */ }
}

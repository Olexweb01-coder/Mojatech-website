import { guard } from "../../guard";
import { ownerKey, getFiles } from "@/lib/arik/store";
import { DOC_MIME } from "@/lib/arik/quotes";
import { getDocSettings } from "@/lib/docs/settings";
import { quotePdf } from "@/lib/docs/pdf";
import { quoteDocx } from "@/lib/docs/word";
import type { Quote } from "@/lib/docs/quote";

/* Files in a chat, only for the person they belong to: photos, and quotations
 * or invoices (made fresh as PDF or Word each time, so they always match). */

export const maxDuration = 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const [f] = await getFiles(ownerKey(g.me), [(await params).id]);
  if (!f) return new Response("Not found", { status: 404 });

  if (f.mime === DOC_MIME) {
    const q = JSON.parse(f.text) as Quote;
    const s = await getDocSettings();
    const format = new URL(req.url).searchParams.get("format");
    const base = `${q.number}${q.rev > 1 ? ` rev ${q.rev}` : ""} ${q.client.name}`.replace(/[^\w .()-]+/g, "").trim();
    const inline = new URL(req.url).searchParams.has("view");
    if (format === "docx") {
      return new Response(new Uint8Array(await quoteDocx(q, s)), { headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${base}.docx"`, "Cache-Control": "no-store" } });
    }
    return new Response(new Uint8Array(await quotePdf(q, s)), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${base}.pdf"`, "Cache-Control": "no-store" } });
  }
  if (!f.bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.bytes), { headers: { "Content-Type": f.mime, "Cache-Control": "private, max-age=86400" } });
}

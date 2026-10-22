import { guard } from "../guard";
import { markdownPdf } from "@/lib/docs/pdf";
import { markdownDocx } from "@/lib/docs/word";
import { titleOf } from "@/lib/docs/md";

/* Any reply from Arik as a branded PDF or Word document: letters, proposals,
 * reports, method statements, price lists. */

export const maxDuration = 60;

const safe = (s: string) => s.replace(/[^\w .()-]+/g, "").trim().slice(0, 70) || "MOJATECH document";

export async function POST(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  const b = await req.json().catch(() => null) as { text?: string; format?: string; title?: string } | null;
  const text = String(b?.text || "").slice(0, 60_000);
  if (!text.trim()) return Response.json({ error: "Nothing to put in a document." }, { status: 400 });
  const title = (b?.title || titleOf(text)).slice(0, 80);
  try {
    if (b?.format === "docx") {
      const buf = await markdownDocx(title, text);
      return new Response(new Uint8Array(buf), { headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safe(title)}.docx"`, "Cache-Control": "no-store" } });
    }
    const buf = await markdownPdf(title, text);
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${safe(title)}.pdf"`, "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("export failed", e);
    return Response.json({ error: "Could not make the document. Try again." }, { status: 500 });
  }
}

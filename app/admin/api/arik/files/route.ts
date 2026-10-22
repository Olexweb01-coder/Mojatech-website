import { guard } from "../guard";
import { ownerKey, saveFile } from "@/lib/arik/store";

/* A file shared with Arik: photos are kept as they are (already shrunk on the
 * phone); documents are turned into text Arik can read. */

export const maxDuration = 60;
const MAX = 4 * 1024 * 1024;
const TEXT_LIMIT = 600_000;

async function readText(name: string, mime: string, buf: Buffer): Promise<string> {
  const ext = name.toLowerCase().split(".").pop() || "";
  if (mime === "application/pdf" || ext === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text, totalPages } = await extractText(pdf, { mergePages: false });
    return (text as string[]).map((t, i) => `--- Page ${i + 1} of ${totalPages} ---\n${t}`).join("\n\n");
  }
  if (ext === "docx" || mime.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ buffer: buf })).value;
  }
  if (["xlsx", "xls", "ods"].includes(ext) || mime.includes("spreadsheet") || mime.includes("excel")) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "buffer" });
    return wb.SheetNames.map((n) => `--- Sheet: ${n} ---\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`).join("\n\n");
  }
  if (mime.startsWith("text/") || ["txt", "md", "csv", "json", "html", "htm", "xml", "log"].includes(ext)) return buf.toString("utf8");
  throw new Error("unsupported");
}

export async function POST(req: Request) {
  const g = await guard(req);
  if (g.error) return g.error;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "That file is over 4MB. Try a smaller one, or split it." }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name || "file";
  const mime = file.type || "application/octet-stream";
  const owner = ownerKey(g.me);

  if (mime.startsWith("image/")) {
    const isImg = (buf[0] === 0xff && buf[1] === 0xd8) || buf.subarray(0, 4).toString("ascii") === "RIFF" || buf[0] === 0x89;
    if (!isImg) return Response.json({ error: "That photo could not be read." }, { status: 415 });
    const id = await saveFile(owner, { name, mime, kind: "image", text: "", bytes: buf });
    return Response.json({ id, name, kind: "image" });
  }

  let text = "";
  try {
    text = (await readText(name, mime, buf)).replace(/\u0000/g, "").trim();
  } catch (e) {
    if (e instanceof Error && e.message === "unsupported") return Response.json({ error: "Arik can read PDF, Word, Excel, CSV and text files, and photos." }, { status: 415 });
    console.error("arik file read failed", e);
    return Response.json({ error: "That file could not be read. It may be damaged or password-protected." }, { status: 422 });
  }
  if (!text) return Response.json({ error: "No text was found. If it is a scanned document, send photos of the pages instead." }, { status: 422 });
  const id = await saveFile(owner, { name, mime, kind: "doc", text: text.slice(0, TEXT_LIMIT), bytes: null });
  return Response.json({ id, name, kind: "doc", chars: text.length });
}

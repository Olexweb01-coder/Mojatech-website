import { allowed } from "@/lib/admin-auth";
import { dbConfigured, saveMedia } from "@/lib/store";

/* Receives one photo from the admin. Photos are shrunk on the phone before they
 * are sent (see lib/client/photo.ts), so they arrive small; this checks they are
 * really images and stores them. */

const MAX = 4 * 1024 * 1024;
const kinds: [string, (b: Buffer) => boolean][] = [
  ["image/webp", (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP"],
  ["image/jpeg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ["image/png", (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
];

export async function POST(req: Request) {
  if (!(await allowed("products")) && !(await allowed("work"))) return Response.json({ error: "You are signed out, or your role does not allow uploads." }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return Response.json({ error: "Not allowed." }, { status: 403 });
  if (!dbConfigured()) return Response.json({ error: "No database is connected, so photos cannot be stored yet." }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No photo received." }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "That photo is too large. Try a smaller one." }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = kinds.find(([, test]) => test(bytes));
  if (!kind) return Response.json({ error: "That file is not a JPEG, PNG or WebP photo." }, { status: 415 });

  const w = Number(form?.get("width")) || undefined;
  const h = Number(form?.get("height")) || undefined;
  try {
    const url = await saveMedia(bytes, kind[0], w, h);
    return Response.json({ url });
  } catch (e) {
    console.error("upload failed", e);
    return Response.json({ error: "Could not store the photo. Please try again." }, { status: 500 });
  }
}

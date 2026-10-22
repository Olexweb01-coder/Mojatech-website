/* Shrinks a photo on the phone before it is uploaded: at most 1600px on the long
 * side, saved as WebP (JPEG where WebP is not available). A 6MB camera photo
 * becomes roughly 150–300KB, so uploads are quick on mobile data and pages load fast. */

const LONG_SIDE = 1600;
const QUALITY = 0.82;

export type Shrunk = { blob: Blob; width: number; height: number; type: string };

export async function shrink(file: File): Promise<Shrunk> {
  /* imageOrientation honours the phone's rotation, so portrait shots stay upright. */
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bmp) throw new Error("That file could not be read as a photo.");
  const scale = Math.min(1, LONG_SIDE / Math.max(bmp.width, bmp.height));
  const width = Math.round(bmp.width * scale), height = Math.round(bmp.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot prepare photos.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();

  const as = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, QUALITY));
  let blob = await as("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await as("image/jpeg");
  if (!blob) throw new Error("Could not prepare that photo.");
  return { blob, width, height, type: blob.type };
}

/** Shrinks and uploads one photo. Resolves to its address, such as /media/ab12... */
export async function uploadPhoto(file: File): Promise<string> {
  const s = await shrink(file);
  const form = new FormData();
  form.append("file", s.blob, s.type === "image/webp" ? "photo.webp" : "photo.jpg");
  form.append("width", String(s.width));
  form.append("height", String(s.height));
  const res = await fetch("/admin/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || "Upload failed. Try again.");
  return data.url as string;
}

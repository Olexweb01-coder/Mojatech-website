"use client";
import { useRef, useState } from "react";
import { uploadPhoto } from "@/lib/client/photo";

/* Photos for a product or a project: upload from the phone (shrunk first), pick
 * from the website's own photos, make one the main photo, remove. Shared by
 * Products and Work. Writes the result into a hidden "photos" field. */

type Tile = { url: string; uploading?: boolean; key: string };

export default function PhotoPicker({ initial, max = 8, stock, connected, onChange, say, hint = "The first is the main photo." }: {
  initial: string[]; max?: number; stock: [string, string][]; connected: boolean;
  onChange: (state: { photos: string[]; uploading: boolean }) => void;
  say: (text: string, tone?: "good" | "bad") => void;
  hint?: string;
}) {
  const [tiles, setTilesState] = useState<Tile[]>(() => initial.map((url) => ({ url, key: url })));
  const fileInput = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLDialogElement>(null);

  const setTiles = (fn: (t: Tile[]) => Tile[]) => setTilesState((prev) => {
    const next = fn(prev);
    queueMicrotask(() => onChange({ photos: next.filter((t) => !t.uploading).map((t) => t.url), uploading: next.some((t) => t.uploading) }));
    return next;
  });

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (!connected) return say("Connect the database to upload photos.", "bad");
    const room = max - tiles.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) say(`Up to ${max} photos.`, "bad");
    await Promise.all(picked.map(async (file) => {
      const key = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setTiles((t) => [...t, { url: preview, uploading: true, key }]);
      try {
        const url = await uploadPhoto(file);
        setTiles((t) => t.map((x) => (x.key === key ? { url, key } : x)));
      } catch (e) {
        setTiles((t) => t.filter((x) => x.key !== key));
        say(e instanceof Error ? e.message : "Upload failed.", "bad");
      } finally {
        URL.revokeObjectURL(preview);
      }
    }));
    if (fileInput.current) fileInput.current.value = "";
  };

  const makeMain = (key: string) => setTiles((t) => [...t.filter((x) => x.key === key), ...t.filter((x) => x.key !== key)]);
  const remove = (key: string) => setTiles((t) => t.filter((x) => x.key !== key));
  const fromLibrary = (url: string) => {
    if (tiles.length >= max) { say(`Up to ${max} photos.`, "bad"); return; }
    setTiles((t) => (t.some((x) => x.url === url) ? t : [...t, { url, key: url + t.length }]));
    library.current?.close();
  };

  const photos = tiles.filter((t) => !t.uploading).map((t) => t.url);

  return (
    <section className="mja-card">
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />
      <div className="mja-card-head">
        <h3 className="mja-h3">Photos</h3>
        <span className="mja-note">{tiles.length}/{max}. {hint}</span>
      </div>
      <ul className="mja-photos" data-noswipe>
        {tiles.map((t, i) => (
          <li key={t.key} className={t.uploading ? "is-uploading" : ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.url} alt={i === 0 ? "Main photo" : `Photo ${i + 1}`} />
            {t.uploading ? <span className="mja-spin" aria-label="Uploading" /> : (
              <>
                {i === 0 ? <em className="mja-main-tag">Main</em> : (
                  <button type="button" className="mja-ph-btn left" onClick={() => makeMain(t.key)} aria-label={`Make photo ${i + 1} the main photo`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                  </button>
                )}
                <button type="button" className="mja-ph-btn right" onClick={() => remove(t.key)} aria-label={`Remove photo ${i + 1}`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </>
            )}
          </li>
        ))}
        {tiles.length < max && (
          <li className="mja-add-photo">
            <button type="button" onClick={() => fileInput.current?.click()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
              Add photos
            </button>
          </li>
        )}
      </ul>
      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      <button type="button" className="mja-linkbtn" onClick={() => library.current?.showModal()}>Choose from the website&apos;s photos</button>

      <dialog ref={library} className="mja-dialog" aria-labelledby="lib-title">
        <div className="mja-dialog-head">
          <h3 id="lib-title" className="mja-h3">The website&apos;s photos</h3>
          <button type="button" className="mja-menu" onClick={() => library.current?.close()} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <ul className="mja-library">
          {stock.map(([url, label]) => (
            <li key={url}>
              <button type="button" onClick={() => fromLibrary(url)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" />
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </dialog>
    </section>
  );
}

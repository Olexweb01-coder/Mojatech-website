"use client";
import { useState } from "react";

/* The product photo, with thumbnails underneath when there is more than one. */
export default function ProductGallery({ photos, name, flag }: { photos: string[]; name: string; flag?: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="pgallery">
      <figure className="pshot">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[i]} alt={i === 0 ? name : `${name}, photo ${i + 1}`} fetchPriority={i === 0 ? "high" : "auto"} />
        {flag && <figcaption className="pflag big">{flag}</figcaption>}
      </figure>
      {photos.length > 1 && (
        <div className="pthumbs" role="group" aria-label="More photos">
          {photos.map((src, n) => (
            <button key={src + n} type="button" aria-pressed={n === i} aria-label={`Photo ${n + 1}`} onClick={() => setI(n)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

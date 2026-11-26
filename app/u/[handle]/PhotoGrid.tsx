"use client";
import { useState, useRef } from "react";

type P = { id: string | number; url: string; alt: string };

export default function PhotoGrid({ photos }: { photos: P[] }) {
  const [idx, setIdx] = useState<number | null>(null);
  const sx = useRef(0);
  const n = photos.length;
  const go = (d: number) => setIdx((i) => (i === null ? i : (i + d + n) % n));
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {photos.map((x, i) => (
          <div key={x.id} onClick={() => setIdx(i)} style={{ aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", background: "#EDEDEA", cursor: "pointer" }}>
            <img src={x.url} alt={x.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      {idx !== null && (
        <div
          onClick={() => setIdx(null)}
          onTouchStart={(e) => { sx.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - sx.current; if (Math.abs(dx) > 50 && n > 1) go(dx < 0 ? 1 : -1); }}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <button onClick={() => setIdx(null)} aria-label="閉じる" style={{ position: "absolute", top: "calc(16px + env(safe-area-inset-top))", right: 16, background: "none", border: "none", color: "#fff", fontSize: 28, lineHeight: 1, cursor: "pointer" }}>✕</button>
          <img src={photos[idx].url} alt={photos[idx].alt} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />
          {n > 1 && <div style={{ position: "absolute", bottom: "calc(24px + env(safe-area-inset-bottom))", color: "#fff", fontSize: 12 }}>{idx + 1} / {n}</div>}
        </div>
      )}
    </>
  );
}

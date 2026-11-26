"use client";
// SWIPE_V2
import { useState, useRef } from "react";

type P = { id: string | number; url: string; alt: string };

export default function PhotoGrid({ photos }: { photos: P[] }) {
  const [idx, setIdx] = useState<number | null>(null);
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const st = useRef({ x: 0, y: 0, t: 0, lx: 0, lt: 0, v: 0, lock: "" as "" | "h" | "v", moved: false });
  const n = photos.length;

  const onStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    st.current = { x: t.clientX, y: t.clientY, t: Date.now(), lx: t.clientX, lt: Date.now(), v: 0, lock: "", moved: false };
    setDrag(true);
  };
  const onMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const s = st.current;
    const mx = t.clientX - s.x, my = t.clientY - s.y;
    if (!s.lock && (Math.abs(mx) > 8 || Math.abs(my) > 8)) s.lock = Math.abs(mx) > Math.abs(my) ? "h" : "v";
    if (s.lock !== "h") return;
    s.moved = true;
    const now = Date.now();
    const dt = now - s.lt;
    if (dt > 0) s.v = 0.6 * s.v + 0.4 * ((t.clientX - s.lx) / dt);
    s.lx = t.clientX; s.lt = now;
    let d = mx;
    if (idx !== null && ((idx === 0 && d > 0) || (idx === n - 1 && d < 0))) d = d * 0.3;
    setDx(d);
  };
  const onEnd = () => {
    const s = st.current;
    setDrag(false);
    if (idx === null || s.lock !== "h") { setDx(0); return; }
    const w = window.innerWidth;
    const v = s.v; // px/ms（負＝左へ）
    const av = Math.abs(v);
    let steps = 0;
    if (av > 0.35 || Math.abs(dx) > w * 0.25) steps = 1 + Math.floor(Math.max(0, av - 0.7) * 2.5);
    steps = Math.min(steps, 8);
    const dir = (av > 0.35 ? v : dx) < 0 ? 1 : -1;
    const next = Math.max(0, Math.min(n - 1, idx + dir * steps));
    setIdx(next);
    setDx(0);
  };

  const w = typeof window !== "undefined" ? window.innerWidth : 390;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {photos.map((x, i) => (
          <div key={x.id} onClick={() => { setDx(0); setIdx(i); }} style={{ aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", background: "#EDEDEA", cursor: "pointer" }}>
            <img src={x.url} alt={x.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>
      {idx !== null && (
        <div
          onClick={() => { if (!st.current.moved) setIdx(null); }}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.92)", overflow: "hidden", touchAction: "pan-y" }}
        >
          <div
            style={{
              display: "flex", height: "100%", width: n * w,
              transform: `translateX(${-idx * w + dx}px)`,
              transition: drag ? "none" : "transform .38s cubic-bezier(.2,.8,.2,1)",
              willChange: "transform",
            }}
          >
            {photos.map((x, i) => (
              <div key={x.id} style={{ width: w, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
                {Math.abs(i - idx) <= 2 && (
                  <img src={x.url} alt={x.alt} draggable={false} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", userSelect: "none" }} />
                )}
                {x.alt && <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, padding: "0 16px", textAlign: "center" }}>{x.alt}</div>}
              </div>
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIdx(null); }} aria-label="閉じる" style={{ position: "absolute", top: "calc(16px + env(safe-area-inset-top))", right: 16, background: "none", border: "none", color: "#fff", fontSize: 28, lineHeight: 1, cursor: "pointer" }}>✕</button>
          {n > 1 && <div style={{ position: "absolute", bottom: "calc(24px + env(safe-area-inset-bottom))", width: "100%", textAlign: "center", color: "#fff", fontSize: 12 }}>{idx + 1} / {n}</div>}
        </div>
      )}
    </>
  );
}

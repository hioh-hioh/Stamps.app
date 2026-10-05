"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

const APP_URL = "https://apps.apple.com/jp/app/id6811545575";
const STORAGE_KEY = "app-download-popup-closed-at";
const HIDE_DAYS = 7;

export default function AppDownloadPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (Capacitor.getPlatform() !== "web") return;
      const ua = navigator.userAgent;
      const isIOS =
        /iPhone|iPad|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (!isIOS) return;
      const closedAt = Number(localStorage.getItem(STORAGE_KEY) || 0);
      if (Date.now() - closedAt < HIDE_DAYS * 24 * 60 * 60 * 1000) return;
    } catch {}
    setShow(true);
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(84px + env(safe-area-inset-bottom))",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "#FFFFFF",
        border: "1px solid #E0DFDB",
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,.15)",
        fontFamily: "inherit",
      }}
    >
      <img
        src="/icon-512-v2.png"
        alt="Stamps."
        width={44}
        height={44}
        style={{ borderRadius: 10, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>
          Stamps. アプリ
        </div>
        <div style={{ fontSize: 12, color: "#6B6B67", marginTop: 2 }}>
          アプリならもっと快適に使えます
        </div>
      </div>
      <a
        href={APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flexShrink: 0,
          padding: "8px 14px",
          background: "#E8452A",
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: 700,
          borderRadius: 999,
          textDecoration: "none",
        }}
      >
        入手
      </a>
      <button
        onClick={close}
        aria-label="閉じる"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          fontSize: 20,
          color: "#9B9B97",
          cursor: "pointer",
          padding: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}

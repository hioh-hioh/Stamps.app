import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import PhotoGrid from "./PhotoGrid"; // SHARE_V1

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function load(handle: string) {
  const h = decodeURIComponent(handle).replace(/^@/, "").toLowerCase();
  const { data: p } = await supabase
    .from("profiles")
    .select("id,name,location,bio,avatar_url,handle")
    .ilike("handle", h)
    .maybeSingle();
  if (!p) return { p: null, posts: [] as any[] };
  const { data: posts } = await supabase
    .from("checkins")
    .select("id,spot_name,photo_urls,created_at")
    .eq("user_id", p.id)
    .order("created_at", { ascending: false })
    .limit(60);
  return { p, posts: posts || [] };
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const { p } = await load(handle);
  if (!p) return { title: "Stamps.", robots: { index: false } };
  return {
    title: `${p.name || p.handle} (@${p.handle}) | Stamps.`,
    description: p.bio || "Stamps. - スタンプラリー記録アプリ",
    robots: { index: false, follow: false },
    openGraph: {
      title: `${p.name || p.handle} (@${p.handle}) | Stamps.`,
      description: p.bio || "Stamps. - スタンプラリー記録アプリ",
      images: p.avatar_url ? [p.avatar_url] : [],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const { p, posts } = await load(handle);

  const wrap: React.CSSProperties = { maxWidth: 520, margin: "0 auto", padding: "56px 16px 120px", fontFamily: "-apple-system, 'Hiragino Sans', sans-serif", color: "#1A1A18" };

  if (!p) {
    return (
      <main style={wrap}>
        <p style={{ textAlign: "center", marginTop: 80 }}>ユーザーが見つかりません</p>
        <p style={{ textAlign: "center" }}><a href="/">Stamps. を見る</a></p>
      </main>
    );
  }

  const photos = posts.filter((x: any) => x.photo_urls && x.photo_urls.length);

  return (
    <main style={wrap}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#EDEDEA", overflow: "hidden" }}>
          {p.avatar_url && <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div>
        <div style={{ fontSize: 13, color: "#9B9B97", marginTop: -4 }}>@{p.handle}</div>
        {p.location && <div style={{ fontSize: 12, color: "#6B6B67" }}>{p.location}</div>}
        {p.bio && <div style={{ fontSize: 13, textAlign: "center", whiteSpace: "pre-wrap" }}>{p.bio}</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>投稿 ({posts.length})</div>
      <PhotoGrid photos={photos.map((x: any) => ({ id: x.id, url: x.photo_urls[0], alt: x.spot_name || "" }))} />

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "12px 16px calc(16px + env(safe-area-inset-bottom))", background: "linear-gradient(rgba(255,255,255,0), #fff 30%)", zIndex: 50 }}>
        <a href="https://apps.apple.com/jp/app/id6811545575" style={{ display: "block", maxWidth: 488, margin: "0 auto", textAlign: "center", padding: 15, borderRadius: 14, background: "#E8452A", color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
          アプリをダウンロード
        </a>
      </div>
    </main>
  );
}

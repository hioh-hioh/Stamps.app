import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

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

  const wrap: React.CSSProperties = { maxWidth: 520, margin: "0 auto", padding: "32px 16px 64px", fontFamily: "-apple-system, 'Hiragino Sans', sans-serif", color: "#111" };

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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#eee", overflow: "hidden", flexShrink: 0 }}>
          {p.avatar_url && <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{p.name}</div>
          <div style={{ fontSize: 14, color: "#888" }}>@{p.handle}</div>
        </div>
      </div>
      {p.bio && <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.bio}</p>}
      <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>チェックイン {posts.length}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginTop: 16 }}>
        {photos.map((x: any) => (
          <div key={x.id} style={{ aspectRatio: "1 / 1", background: "#eee", overflow: "hidden" }}>
            <img src={x.photo_urls[0]} alt={x.spot_name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 40 }}>
        <a href="/" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 999, background: "#111", color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          Stamps. を使ってみる
        </a>
      </div>
    </main>
  );
}

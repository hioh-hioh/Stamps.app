import { supabase } from '../../../lib/supabase';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data: spot } = await supabase.from("spots").select("*").eq("id", id).single();
  if (!spot) return { title: "スポットが見つかりません | Stamps.app" };
  return {
    title: `${spot.name} | Stamps.app`,
    description: `${spot.name}のスタンプ情報。${spot.location || ""} ${spot.hours || ""}`.trim(),
  };
}

export default async function SpotPage({ params }) {
  const { id } = await params;
  const { data: spot } = await supabase.from("spots").select("*").eq("id", id).single();

  if (!spot) {
    return <div style={{ padding: 40, textAlign: "center" }}>スポットが見つかりませんでした</div>;
  }

  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("spot_id", id)
    .order("created_at", { ascending: false });

  const posts = checkins || [];
  const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
  let profileMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id,name,avatar_url").in("id", userIds);
    profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  }

  const mainPhoto = posts.find(p => p.photo_urls?.length > 0)?.photo_urls?.[0];
  const limitedPost = posts.find(p => p.limited);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "sans-serif", color: "#1A1A18" }}>
      {mainPhoto && (
        <div style={{ position: "relative", marginBottom: 16 }}>
          <img src={mainPhoto} alt={spot.name} style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 8, display: "block" }} />
          {limitedPost && (
            <div style={{ position: "absolute", left: 12, bottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 100, background: "rgba(240,240,240,0.85)", color: "#E65100", fontSize: 11, fontWeight: 700 }}>LIMITED</span>
              {limitedPost.date_from && <span style={{ fontSize: 12, color: "#fff" }}>{limitedPost.date_from} → {limitedPost.date_to || "未定"}</span>}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A18", textAlign: "center" }}>{spot.name}</div>
      <div style={{ display: "flex", gap: 8, fontSize: 13, color: "#6B6B67", marginTop: -4 }}>
        <span>{spot.category}</span>
        <span>{spot.area}</span>
      </div>

      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, borderRadius: 4, background: "#F6F6F6", marginTop: 20 }}>
        {spot.hours && <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#6B6B67" }}>🕐 {spot.hours}</div>}
        {spot.location && <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#6B6B67" }}>📍 {spot.location}</div>}
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", marginBottom: 4 }}>投稿 ({posts.length})</div>
        {posts.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "#9B9B97", fontSize: 13 }}>まだ投稿がありません</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
            {posts.map(p => {
              const author = profileMap[p.user_id];
              const photos = p.photo_urls || [];
              return (
                <a key={p.id} href={`/checkins/${p.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, background: "#F7F7F7", borderRadius: 8, padding: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "#D8D8D5", flexShrink: 0 }}>
                    {author?.avatar_url && <img src={author.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 500, color: "#1A1A18", margin: 0 }}>{author?.name || "ゲスト"}</h4>
                    <p style={{ fontSize: 11, color: "#9B9B97", margin: "1px 0 0" }}>{new Date(p.created_at).toLocaleDateString("ja-JP")}</p>
                  </div>
                  {p.note && <p style={{ fontSize: 13, color: "#1A1A18", lineHeight: 1.6, margin: 0 }}>{p.note}</p>}
                  {photos.length > 0 && (
                    <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                      {photos.map((url, i) => (
                        <img key={i} src={url} style={{ width: 100, height: 80, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ))}
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <a href="/" style={{ display: "block", textAlign: "center", marginTop: 32, color: "#616168", fontSize: 14 }}>
        ← Stamps.appで見る
      </a>
    </div>
  );
}
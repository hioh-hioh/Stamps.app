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

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "sans-serif", color: "#1A1A18" }}>
      {mainPhoto && (
        <img src={mainPhoto} alt={spot.name} style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 8, display: "block", marginBottom: 16 }} />
      )}
      <h1 style={{ fontSize: 18, fontWeight: 700, textAlign: "center", margin: 0 }}>{spot.name}</h1>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", fontSize: 13, color: "#6B6B67", marginTop: 6 }}>
        <span>{spot.category}</span>
        <span>{spot.area}</span>
      </div>

      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, borderRadius: 4, background: "#F6F6F6", marginTop: 20 }}>
        {spot.hours && <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#6B6B67" }}>🕐 {spot.hours}</div>}
        {spot.location && <div style={{ display: "flex", gap: 10, fontSize: 13, color: "#6B6B67" }}>📍 {spot.location}</div>}
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>投稿 ({posts.length})</div>
        {posts.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9B9B97", textAlign: "center", padding: "24px 0" }}>まだ投稿がありません</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {posts.map(p => {
              const profile = profileMap[p.user_id];
              const photo = p.photo_urls?.[0];
              return (
                <a key={p.id} href={`/checkins/${p.id}`} style={{ textDecoration: "none", color: "inherit", background: "#F7F7F5", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "#EBEBEB" }}>
                    {profile?.avatar_url && <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{profile?.name || "ゲスト"}</div>
                    <div style={{ fontSize: 11, color: "#9B9B97" }}>{new Date(p.created_at).toLocaleDateString("ja-JP")}</div>
                  </div>
                  {p.limited && (
                    <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 100, background: "#F0F0F0", color: "#E65100", fontSize: 11, fontWeight: 700, alignSelf: "flex-start" }}>
                      LIMITED
                    </div>
                  )}
                  {p.note && <div style={{ fontSize: 12 }}>{p.note}</div>}
                  {photo && (
                    <img src={photo} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, background: p.color || "#FEF0ED" }} />
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
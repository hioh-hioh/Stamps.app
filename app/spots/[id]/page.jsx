import { supabase } from '../../../lib/supabase';

async function getSpot(id) {
  let { data: spot } = await supabase.from("spots").select("*").eq("short_id", id).maybeSingle();
  if (!spot) {
    ({ data: spot } = await supabase.from("spots").select("*").eq("id", id).maybeSingle());
  }
  return spot;
}

const CATEGORY_LABELS = {
  tourist_information_center:"観光案内所", point_of_interest:"観光スポット", establishment:"施設",
  premise:"施設", subpremise:"施設", store:"店舗", shopping_mall:"商業施設", department_store:"百貨店",
  supermarket:"スーパー", convenience_store:"コンビニ", clothing_store:"衣料品店", book_store:"書店",
  restaurant:"レストラン", cafe:"カフェ", bakery:"パン屋", bar:"バー", food:"飲食店",
  museum:"博物館", art_gallery:"ギャラリー", library:"図書館", park:"公園", zoo:"動物園", aquarium:"水族館",
  amusement_park:"遊園地", tourist_attraction:"観光地", place_of_worship:"寺社・教会", shrine:"神社", temple:"寺",
  train_station:"駅", transit_station:"駅", subway_station:"駅", bus_station:"バス停",
  airport:"空港", parking:"駐車場", hospital:"病院", pharmacy:"薬局",
  lodging:"宿泊施設", hotel:"ホテル", school:"学校", university:"大学", bank:"銀行",
  natural_feature:"自然・景観", landmark:"ランドマーク", place:"場所",
};
function catLabel(cat) {
  return CATEGORY_LABELS[cat] || cat || "";
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const spot = await getSpot(id);
  if (!spot) return { title: "スポットが見つかりません | Stamps.app" };
  return {
    title: `${spot.name} | Stamps.app`,
    description: `${spot.name}のスタンプ情報。${spot.location || ""} ${spot.hours || ""}`.trim(),
  };
}

export default async function SpotPage({ params }) {
  const { id } = await params;
  const spot = await getSpot(id);

  if (!spot) {
    return <div style={{ padding: 40, textAlign: "center" }}>スポットが見つかりませんでした</div>;
  }

  const { data: checkins } = await supabase
    .from("checkins")
    .select("*")
    .eq("spot_id", spot.id)
    .order("created_at", { ascending: false });

  // 関連スポット（同じカテゴリ・エリアから最大6件）
  const { data: relatedSpots } = await supabase
    .from("spots")
    .select("id, short_id, name, category")
    .eq("area", spot.area || "")
    .neq("id", spot.id)
    .limit(6);

  const posts = checkins || [];
  const userIds = [...new Set(posts.map(p => p.user_id).filter(Boolean))];
  let profileMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id,name,avatar_url").in("id", userIds);
    profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  }

  // 関連スポットの代表写真を取得
  let relatedPhotoMap = {};
  if (relatedSpots && relatedSpots.length > 0) {
    const relatedIds = relatedSpots.map(s => s.id);
    const { data: relatedCheckins } = await supabase
      .from("checkins")
      .select("spot_id, photo_urls")
      .in("spot_id", relatedIds)
      .not("photo_urls", "is", null);
    if (relatedCheckins) {
      for (const c of relatedCheckins) {
        if (!relatedPhotoMap[c.spot_id] && c.photo_urls?.length > 0) {
          relatedPhotoMap[c.spot_id] = c.photo_urls[0];
        }
      }
    }
  }

  const mainPhoto = posts.find(p => p.photo_urls?.length > 0)?.photo_urls?.[0];
  const limitedPost = posts.find(p => p.limited);

  // SVGアイコン（インライン）
  const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8452A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  const PinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8452A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px 80px", fontFamily: "sans-serif", color: "#1A1A18" }}>

      {/* メインレイアウト：左コンテンツ＋右サイドバー */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32, alignItems: "start" }}>

        {/* ── 左：メインコンテンツ ── */}
        <div>
          {mainPhoto && (
            <div style={{ position: "relative", marginBottom: 20 }}>
              <img src={mainPhoto} alt={spot.name} style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 12, display: "block" }} />
              {limitedPost && (
                <div style={{ position: "absolute", left: 12, bottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ padding: "4px 10px", borderRadius: 100, background: "rgba(240,240,240,0.88)", color: "#E65100", fontSize: 11, fontWeight: 700 }}>LIMITED</span>
                  {limitedPost.date_from && <span style={{ fontSize: 12, color: "#fff" }}>{limitedPost.date_from} → {limitedPost.date_to || "未定"}</span>}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A18" }}>{spot.name}</div>
          <div style={{ display: "flex", gap: 8, fontSize: 13, color: "#6B6B67", marginTop: 4, marginBottom: 16 }}>
            <span>{catLabel(spot.category)}</span>
            <span>{spot.area}</span>
          </div>

          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, borderRadius: 8, background: "#F6F6F6", marginBottom: 24 }}>
            {spot.hours && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#6B6B67" }}>
                <ClockIcon /> {spot.hours}
              </div>
            )}
            {spot.location && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#6B6B67" }}>
                <PinIcon /> {spot.location}
              </div>
            )}
          </div>

          {/* 投稿一覧 */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", marginBottom: 12 }}>投稿 ({posts.length})</div>
          {posts.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "#9B9B97", fontSize: 13 }}>まだ投稿がありません</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {posts.map(p => {
                const author = profileMap[p.user_id];
                const photos = p.photo_urls || [];
                return (
                  <a key={p.id} href={`/checkins/${p.short_id || p.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 8, background: "#F7F7F7", borderRadius: 10, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#D8D8D5", flexShrink: 0 }}>
                        {author?.avatar_url && <img src={author.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{author?.name || "ゲスト"}</div>
                        <div style={{ fontSize: 11, color: "#9B9B97" }}>{new Date(p.created_at).toLocaleDateString("ja-JP")}</div>
                      </div>
                    </div>
                    {p.note && <p style={{ fontSize: 12, color: "#1A1A18", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.note}</p>}
                    {photos.length > 0 && (
                      <img src={photos[0]} style={{ width: "100%", height: 120, borderRadius: 8, objectFit: "cover" }} />
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 右：サイドバー ── */}
        <div style={{ position: "sticky", top: 24 }}>
          {relatedSpots && relatedSpots.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", marginBottom: 12 }}>
                {spot.area}の他のスタンプ
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {relatedSpots.map(s => (
                  <a key={s.id} href={`/spots/${s.short_id || s.id}`}
                    style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#F7F7F7", borderRadius: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", background: "#E5E5E2", flexShrink: 0 }}>
                      {relatedPhotoMap[s.id]
                        ? <img src={relatedPhotoMap[s.id]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📍</div>
                      }
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A18", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#9B9B97" }}>{catLabel(s.category)}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <a href="/" style={{ display: "block", textAlign: "center", marginTop: 32, color: "#616168", fontSize: 13 }}>
            ← Stamps.appで見る
          </a>
        </div>
      </div>
    </div>
  );
}

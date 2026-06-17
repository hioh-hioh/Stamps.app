import { supabase } from '../../../lib/supabase';

async function getCheckin(id) {
  let { data: checkin } = await supabase.from("checkins").select("*").eq("short_id", id).maybeSingle();
  if (!checkin) {
    ({ data: checkin } = await supabase.from("checkins").select("*").eq("id", id).maybeSingle());
  }
  return checkin;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const checkin = await getCheckin(id);
  if (!checkin) return { title: "投稿が見つかりません | Stamps.app" };
  return {
    title: `${checkin.spot_name} | Stamps.app`,
    description: checkin.note || `${checkin.spot_name}でのチェックイン記録`,
  };
}

export default async function CheckinPage({ params }) {
  const { id } = await params;
  const checkin = await getCheckin(id);

  if (!checkin) {
    return <div style={{ padding: 40, textAlign: "center" }}>投稿が見つかりませんでした</div>;
  }

  let author = null;
  if (checkin.user_id) {
    const { data } = await supabase.from("profiles").select("id,name,avatar_url").eq("id", checkin.user_id).maybeSingle();
    author = data;
  }

  const photos = checkin.photo_urls || [];

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "sans-serif", color: "#1A1A18" }}>
      {photos.length > 0 && (
        <img src={photos[0]} alt={checkin.spot_name} style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 8, display: "block", marginBottom: 16 }} />
      )}

      <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center" }}>{checkin.spot_name}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#D8D8D5", flexShrink: 0 }}>
          {author?.avatar_url && <img src={author.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
        </div>
        <div style={{ fontSize: 13, color: "#1A1A18" }}>{author?.name || "ゲスト"}</div>
        <div style={{ fontSize: 11, color: "#9B9B97", marginLeft: "auto" }}>{new Date(checkin.created_at).toLocaleDateString("ja-JP")}</div>
      </div>

      {checkin.note && <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 16 }}>{checkin.note}</p>}

      {photos.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 16 }}>
          {photos.slice(1).map((url, i) => (
            <img key={i} src={url} style={{ width: 140, height: 110, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          ))}
        </div>
      )}

      <a href="/" style={{ display: "block", textAlign: "center", marginTop: 32, color: "#616168", fontSize: 14 }}>
        ← Stamps.appで見る
      </a>
    </div>
  );
}
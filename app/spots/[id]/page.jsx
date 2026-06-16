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

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{spot.name}</h1>
      <p style={{ color: "#666", fontSize: 14 }}>{spot.category} {spot.area}</p>
      {spot.hours && <p style={{ fontSize: 14 }}>営業時間: {spot.hours}</p>}
      {spot.location && <p style={{ fontSize: 14 }}>{spot.location}</p>}
      <a href="/" style={{ display: "inline-block", marginTop: 20, color: "#616168" }}>
        Stamps.appで見る →
      </a>
    </div>
  );
}
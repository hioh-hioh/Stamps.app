import { supabase } from '../lib/supabase';

const BASE_URL = "https://stamps-app-seven.vercel.app"; // 実際の本番URLに合わせて変更してください

export default async function sitemap() {
  const { data: spots } = await supabase.from("spots").select("id, created_at");

  const spotUrls = (spots || []).map(spot => ({
    url: `${BASE_URL}/spots/${spot.id}`,
    lastModified: spot.created_at || new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...spotUrls,
  ];
}
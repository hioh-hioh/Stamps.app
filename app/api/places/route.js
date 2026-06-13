export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;

  if (!q || q.trim().length < 2) {
    return Response.json({ predictions: [] });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify({
      input: q,
      languageCode: "ja",
      regionCode: "JP",
    }),
  });
  const data = await res.json();

  const predictions = (data.suggestions || []).map(s => ({
    place_id: s.placePrediction?.placeId,
    description: s.placePrediction?.text?.text,
    structured_formatting: {
      main_text: s.placePrediction?.structuredFormat?.mainText?.text,
      secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text,
    },
  })).filter(p => p.place_id);

  return Response.json({ predictions });
}
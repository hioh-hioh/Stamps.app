export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;

  if (!q || q.trim().length < 2) {
    return Response.json({ predictions: [] });
  }

  const body = {
    input: q,
    languageCode: "ja",
    regionCode: "JP",
  };

  if (lat && lng) {
    body.locationBias = {
      circle: {
        center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
        radius: 50000.0,
      }
    };
    body.origin = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  const predictions = (data.suggestions || []).map(s => ({
    place_id: s.placePrediction?.placeId,
    description: s.placePrediction?.text?.text,
    distance_meters: s.placePrediction?.distanceMeters,
    structured_formatting: {
      main_text: s.placePrediction?.structuredFormat?.mainText?.text,
      secondary_text: s.placePrediction?.structuredFormat?.secondaryText?.text,
    },
  })).filter(p => p.place_id);

  if (lat && lng) {
    predictions.sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));
  }

  return Response.json({ predictions });
}
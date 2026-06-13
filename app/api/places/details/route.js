export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");
  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;

  if (!placeId) {
    return Response.json({ result: null });
  }

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "displayName,formattedAddress,location,types,addressComponents",
    },
  });
  const data = await res.json();

  const result = {
    name: data.displayName?.text,
    formatted_address: data.formattedAddress,
    geometry: { location: { lat: data.location?.latitude, lng: data.location?.longitude } },
    types: data.types,
    address_components: (data.addressComponents || []).map(c => ({
      long_name: c.longText,
      types: c.types,
    })),
  };

  return Response.json({ result });
}
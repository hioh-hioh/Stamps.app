'use client'
import Map, { useMap } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect } from 'react'

function FlyToRegistrar() {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map) return;
    window.__mapboxFlyTo = (lng, lat) => {
      map.flyTo({ center: [lng, lat], zoom: 15 });
    };
  }, [map]);
  return null;
}

export default function MapView({ children }) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: 139.7016,
        latitude: 35.6580,
        zoom: 14,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/kthhtm/cmptvkv4f006501su5hqm3cp2"
    >
      <FlyToRegistrar />
      {children}
    </Map>
  )
}
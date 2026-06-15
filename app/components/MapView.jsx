'use client'
import Map, { useMap } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useState } from 'react'

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

function LocateButton() {
  const { current: map } = useMap();
  const [loading, setLoading] = useState(false);

  const handleLocate = () => {
    if(!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 });
        setLoading(false);
      },
      () => setLoading(false)
    );
  };

  return (
    <button onClick={handleLocate}
      style={{
        position:"absolute", bottom:100, right:16,
        width:44, height:44, borderRadius:"50%",
        background:"#fff", border:"none", cursor:"pointer",
        boxShadow:"0 2px 6px rgba(0,0,0,0.15)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:10,
      }}>
      {loading
        ? <span style={{fontSize:18}}>⟳</span>
        : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#616168" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          </svg>
      }
    </button>
  );
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
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      <FlyToRegistrar />
      <LocateButton />
      {children}
    </Map>
  )
}
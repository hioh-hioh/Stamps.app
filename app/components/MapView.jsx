'use client'
import Map, { useMap, Marker } from 'react-map-gl/mapbox'
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

function FlyToUserLocation({ userLocation }) {
  const { current: map } = useMap();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!map || !userLocation || done) return;
    map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14 });
    setDone(true);
  }, [map, userLocation, done]);
  return null;
}

export default function MapView({ children, userLocation }) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: userLocation?.lng || 139.7016,
        latitude: userLocation?.lat || 35.6580,
        zoom: 14,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/kthhtm/cmptvkv4f006501su5hqm3cp2"
    >
      <FlyToRegistrar />
      <FlyToUserLocation userLocation={userLocation} />
      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <div style={{position:'relative',width:20,height:20}}>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'#4285F4',opacity:0.25,animation:'pulse 2s infinite'}}/>
            <div style={{position:'absolute',top:4,left:4,width:12,height:12,borderRadius:'50%',background:'#4285F4',border:'2px solid #fff',boxShadow:'0 0 4px rgba(0,0,0,0.3)'}}/>
          </div>
        </Marker>
      )}
      {children}
    </Map>
  )
}
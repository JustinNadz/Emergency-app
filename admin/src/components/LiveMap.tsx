'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Incident, Responder } from '@/types';
import { MAP_TILES, GEOCODING_URL } from '@/lib/map.config';

// Custom fire icon (critical - red)
const fireIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div class="marker-pulse" style="position: absolute; width: 48px; height: 48px; background: rgba(239, 68, 68, 0.2); border-radius: 50%;"></div>
      <div style="
        position: relative;
        width: 40px; 
        height: 40px; 
        background: #ef4444; 
        border: 2px solid rgba(255,255,255,0.2); 
        border-radius: 50%; 
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <span style="font-family: 'Material Symbols Outlined'; font-size: 20px; color: white;">local_fire_department</span>
      </div>
    </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// Custom medical icon (high priority - orange)
const medicalIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 40px; 
      height: 40px; 
      background: #f59e0b; 
      border: 2px solid rgba(255,255,255,0.2); 
      border-radius: 50%; 
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <span style="font-family: 'Material Symbols Outlined'; font-size: 20px; color: white;">medical_services</span>
    </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Custom police icon (standard - blue)
const policeIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 32px; 
      height: 32px; 
      background: #197fe6; 
      border: 1px solid rgba(255,255,255,0.2); 
      border-radius: 6px; 
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: rotate(45deg);
    ">
      <span style="font-family: 'Material Symbols Outlined'; font-size: 16px; color: white; transform: rotate(-45deg);">local_police</span>
    </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Default emergency icon
const emergencyIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div class="marker-pulse" style="position: absolute; width: 48px; height: 48px; background: rgba(239, 68, 68, 0.2); border-radius: 50%;"></div>
      <div style="
        position: relative;
        width: 40px; 
        height: 40px; 
        background: #ef4444; 
        border: 2px solid rgba(255,255,255,0.2); 
        border-radius: 50%; 
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <span style="font-family: 'Material Symbols Outlined'; font-size: 20px; color: white;">warning</span>
      </div>
    </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// Responder icon
const responderIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 28px; 
      height: 28px; 
      background: #22c55e; 
      border: 2px solid rgba(255,255,255,0.3); 
      border-radius: 6px; 
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <span style="font-family: 'Material Symbols Outlined'; font-size: 16px; color: white;">directions_car</span>
    </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Get icon based on incident index/type
function getIncidentIcon(index: number) {
  if (index === 0) return fireIcon;
  if (index === 1) return medicalIcon;
  if (index % 3 === 0) return fireIcon;
  if (index % 3 === 1) return medicalIcon;
  return policeIcon;
}

// Reverse geocoding function using Geoapify
async function getAddressFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(`${GEOCODING_URL}&lat=${lat}&lon=${lon}`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const props = data.features[0].properties;
      const barangay = props.suburb || props.neighbourhood || '';
      const city = props.city || props.town || props.municipality || '';
      return barangay ? `${barangay}, ${city}` : props.formatted || 'Unknown location';
    }
    return 'Unknown location';
  } catch {
    return 'Unknown location';
  }
}

interface LiveMapProps {
  incidents: Incident[];
  responders: Responder[];
}

export default function LiveMap({ incidents, responders }: LiveMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [addresses, setAddresses] = useState<Record<number, string>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch addresses for incidents
  useEffect(() => {
    incidents.forEach(async (incident) => {
      if (!addresses[incident.id]) {
        const address = await getAddressFromCoords(incident.latitude, incident.longitude);
        setAddresses((prev) => ({ ...prev, [incident.id]: address }));
      }
    });
  }, [incidents]);

  if (!isMounted) {
    return (
      <div className="h-full bg-[#111921] flex items-center justify-center">
        <p className="text-slate-400">Loading map...</p>
      </div>
    );
  }

  // Default center (Butuan City, Caraga)
  const defaultCenter: [number, number] = [8.9475, 125.5406];
  
  // Calculate center based on incidents or use default
  const center: [number, number] = incidents.length > 0
    ? [incidents[0].latitude, incidents[0].longitude]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      {/* Geoapify Dark Theme Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a>'
        url={MAP_TILES.dark}
      />

      {/* Emergency markers */}
      {incidents.map((incident, index) => (
        <Marker
          key={`incident-${incident.id}`}
          position={[incident.latitude, incident.longitude]}
          icon={getIncidentIcon(index)}
        >
          <Popup>
            <div className="text-slate-900 min-w-[200px]">
              <p className="font-bold text-red-600">🚨 Emergency #{incident.id}</p>
              <p className="text-sm font-medium mt-1">
                📍 {addresses[incident.id] || 'Loading address...'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  incident.status === 'reported' ? 'bg-red-100 text-red-700' :
                  incident.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700' :
                  incident.status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {incident.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(incident.reported_at).toLocaleString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Emergency radius circles */}
      {incidents.map((incident, index) => (
        <Circle
          key={`circle-${incident.id}`}
          center={[incident.latitude, incident.longitude]}
          radius={300}
          pathOptions={{
            color: index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#197fe6',
            fillColor: index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#197fe6',
            fillOpacity: 0.1,
            weight: 1,
          }}
        />
      ))}

      {/* Responder markers */}
      {responders.map((responder) => (
        <Marker
          key={`responder-${responder.id}`}
          position={[responder.latitude, responder.longitude]}
          icon={responderIcon}
        >
          <Popup>
            <div className="text-slate-900">
              <p className="font-semibold">🚔 {responder.name}</p>
              <p className="text-sm">{responder.type}</p>
              <p className="text-sm">📞 {responder.phone}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

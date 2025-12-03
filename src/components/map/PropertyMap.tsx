import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Property } from '@/hooks/useProperties';
import PropertyMarker from './PropertyMarker';
import MapControls from './MapControls';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

interface PropertyMapProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  onLocationFound?: (lat: number, lon: number) => void;
}

const PropertyMap = ({ 
  properties, 
  center = [20, 0], 
  zoom = 2,
  onLocationFound 
}: PropertyMapProps) => {
  
  // Filter properties with valid coordinates
  const validProperties = properties.filter(
    (p) => p.latitude && p.longitude
  );

  useEffect(() => {
    // Fix for default marker icons not showing in production
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        // @ts-ignore - react-leaflet type issue
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-lg"
        scrollWheelZoom={true}
        style={{ zIndex: 0 }}
      >
        {/* OpenStreetMap Tiles - Free, no API key required */}
        <TileLayer
          // @ts-ignore - react-leaflet type issue
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Map Controls */}
        <MapControls onLocationFound={onLocationFound} />

        {/* Clustered Property Markers */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            return new L.DivIcon({
              html: `<div class="cluster-icon">${count}</div>`,
              className: 'custom-cluster-icon',
              iconSize: L.point(40, 40, true),
            });
          }}
        >
          {validProperties.map((property) => (
            <PropertyMarker key={property.id} property={property} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Custom cluster styling */}
      <style>{`
        .custom-cluster-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .cluster-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: hsl(var(--primary));
          color: white;
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
        }

        .leaflet-popup-content {
          margin: 0;
          width: 280px !important;
        }

        .leaflet-popup-tip {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default PropertyMap;

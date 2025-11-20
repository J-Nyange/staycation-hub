import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Property } from '@/hooks/useProperties';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PropertyMarkerProps {
  property: Property;
}

// Custom marker icon
const createCustomIcon = (category: string) => {
  const color = category === 'villa' ? '#8B5CF6' : category === 'airbnb' ? '#10b981' : '#f59e0b';
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path fill="${color}" stroke="#fff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const PropertyMarker = ({ property }: PropertyMarkerProps) => {
  const navigate = useNavigate();

  // Skip if no coordinates
  if (!property.latitude || !property.longitude) {
    return null;
  }

  const handleViewDetails = () => {
    navigate(`/properties/${property.id}`);
  };

  const categoryLabels = {
    airbnb: 'Airbnb',
    villa: 'Villa',
    homestay: 'Homestay',
  };

  return (
    <>
      <Marker
        // @ts-ignore - react-leaflet type issue
        position={[property.latitude, property.longitude]}
        // @ts-ignore - react-leaflet type issue
        icon={createCustomIcon(property.category)}
      >
        <Popup
          // @ts-ignore - react-leaflet type issue
          maxWidth={300}
          className="custom-popup"
        >
        <Card className="border-0 shadow-none">
          <CardContent className="p-0 space-y-3">
            {/* Property Image */}
            <div className="relative w-full h-40 overflow-hidden rounded-lg">
              <img
                src={property.main_image || property.images?.[0] || '/placeholder.svg'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm"
              >
                {categoryLabels[property.category as keyof typeof categoryLabels]}
              </Badge>
            </div>

            {/* Property Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-base line-clamp-2">{property.title}</h3>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{property.location}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  {property.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{property.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{property.guests}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-primary">
                    ${property.price_per_night}
                  </span>
                  <span className="text-xs text-muted-foreground">/night</span>
                </div>
              </div>

              <Button
                onClick={handleViewDetails}
                className="w-full"
                size="sm"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </Popup>
    </Marker>
    </>
  );
};

export default PropertyMarker;

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation, ZoomIn, ZoomOut, Locate } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { toast } from 'sonner';
import { getCurrentLocation } from '@/utils/geocoding';

interface MapControlsProps {
  onLocationFound?: (lat: number, lon: number) => void;
}

const MapControls = ({ onLocationFound }: MapControlsProps) => {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleNearMe = async () => {
    try {
      toast.loading('Getting your location...');
      const location = await getCurrentLocation();
      
      map.flyTo([location.lat, location.lon], 12, {
        duration: 2,
      });

      onLocationFound?.(location.lat, location.lon);
      toast.dismiss();
      toast.success('Location found! Showing nearby properties');
    } catch (error) {
      toast.dismiss();
      toast.error('Unable to get your location. Please enable location services.');
      console.error('Geolocation error:', error);
    }
  };

  const handleResetView = () => {
    // Reset to initial world view
    map.setView([20, 0], 2, {
      animate: true,
      duration: 1,
    });
  };

  return (
    <Card className="absolute top-4 right-4 z-[1000] p-2 space-y-2 shadow-lg">
      <Button
        variant="outline"
        size="icon"
        onClick={handleNearMe}
        className="w-10 h-10"
        title="Near Me"
      >
        <Locate className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomIn}
        className="w-10 h-10"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleZoomOut}
        className="w-10 h-10"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleResetView}
        className="w-10 h-10"
        title="Reset View"
      >
        <Navigation className="w-4 h-4" />
      </Button>
    </Card>
  );
};

export default MapControls;

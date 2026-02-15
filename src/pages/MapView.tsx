import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import PropertyMap from '@/components/map/PropertyMap';
import { useProperties } from '@/hooks/useProperties';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapIcon, List, Filter } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateBreadcrumbSchema } from '@/lib/structuredData';

const MapView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showList, setShowList] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);

  const { data: properties, isLoading } = useProperties();

  // Filter properties based on search and category
  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    let filtered = properties;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [properties, selectedCategory, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleLocationFound = (lat: number, lon: number) => {
    setMapCenter([lat, lon]);
    setMapZoom(12);
  };

  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: 'Home', url: '/' },
      { name: 'Map View', url: '/map' },
    ],
  });

  // Auto-geocode properties missing coordinates (one-time)
  const geocodedRef = useRef(false);
  useEffect(() => {
    if (!properties || geocodedRef.current) return;
    const missing = properties.filter(
      (p) => !p.latitude && !p.longitude && p.location
    );
    if (missing.length === 0) return;
    geocodedRef.current = true;

    supabase.functions.invoke('geocode-properties', { method: 'POST' }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    });
  }, [properties, queryClient]);

  const propertiesWithCoordinates = filteredProperties.filter(
    (p) => p.latitude && p.longitude
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Map View - Find Properties Near You"
        description="Explore properties on an interactive map. Find the perfect vacation rental, villa, or homestay near your desired location."
        url="/map"
      />
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="bg-background border-b border-border sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by location, property name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="villa">Villas</SelectItem>
                    <SelectItem value="homestay">Homestays</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowList(!showList)}
                className="hidden md:flex items-center gap-2"
              >
                {showList ? (
                  <>
                    <MapIcon className="w-4 h-4" />
                    Map
                  </>
                ) : (
                  <>
                    <List className="w-4 h-4" />
                    List
                  </>
                )}
              </Button>
            </form>

            {/* Stats */}
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
              </Badge>
              {propertiesWithCoordinates.length < filteredProperties.length && (
                <Badge variant="outline" className="text-xs">
                  {filteredProperties.length - propertiesWithCoordinates.length} without map location
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Map/List View */}
        <div className="flex-1 flex">
          {showList ? (
            // List View
            <div className="flex-1 overflow-y-auto">
              <div className="container mx-auto px-4 py-8">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-[400px] rounded-lg" />
                    ))}
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <MapIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search filters or explore all properties
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        id={property.id}
                        title={property.title}
                        location={property.location}
                        guests={property.guests}
                        category={property.category as "airbnb" | "villa" | "homestay"}
                        amenities={property.amenities || []}
                        price_per_night={property.price_per_night}
                        main_image={property.main_image || undefined}
                        images={property.images || undefined}
                        rating={property.rating}
                        reviews={property.review_count}
                        description={property.description}
                        bedrooms={property.bedrooms || undefined}
                        bathrooms={property.bathrooms || undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Map View
            <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 200px)' }}>
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                </div>
              ) : (
                <PropertyMap
                  properties={filteredProperties}
                  center={mapCenter}
                  zoom={mapZoom}
                  onLocationFound={handleLocationFound}
                />
              )}

              {/* Mobile List Toggle */}
              <Button
                onClick={() => setShowList(true)}
                className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[1001] shadow-lg"
              >
                <List className="w-4 h-4 mr-2" />
                Show List
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapView;

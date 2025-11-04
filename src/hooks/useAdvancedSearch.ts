import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from './useProperties';

export interface AdvancedSearchParams {
  location?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  priceRange?: [number, number];
  propertyType?: string[];
  amenities?: string[];
  instantBook?: boolean;
  nearMe?: { lat: number; lng: number; radius: number };
  minRating?: number;
  bedroomsMin?: number;
}

export const useAdvancedSearch = (params: AdvancedSearchParams) => {
  return useQuery<Property[]>({
    queryKey: ['advanced-search', params],
    queryFn: async (): Promise<Property[]> => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('is_active', true);

      // Location filter
      if (params.location && params.location.trim()) {
        query = query.ilike('location', `%${params.location}%`);
      }

      // Guest capacity
      if (params.guests) {
        query = query.gte('guests', params.guests);
      }

      // Price range
      if (params.priceRange) {
        query = query.gte('price_per_night', params.priceRange[0]);
        query = query.lte('price_per_night', params.priceRange[1]);
      }

      // Property type
      if (params.propertyType && params.propertyType.length > 0) {
        query = query.in('property_type', params.propertyType);
      }

      // Instant book
      if (params.instantBook) {
        query = query.eq('instant_book', true);
      }

      // Bedrooms
      if (params.bedroomsMin) {
        query = query.gte('bedrooms', params.bedroomsMin);
      }

      const { data: properties, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Client-side filtering for amenities (array contains)
      let filteredProperties = (properties || []) as Property[];

      if (params.amenities && params.amenities.length > 0) {
        filteredProperties = filteredProperties.filter(property =>
          params.amenities!.every(amenity =>
            property.amenities && property.amenities.includes(amenity)
          )
        );
      }

      // Filter by availability if dates provided
      if (params.checkIn && params.checkOut && filteredProperties.length > 0) {
        const availableProperties = await Promise.all(
          filteredProperties.map(async (property) => {
            const { data: bookings } = await supabase
              .from('bookings')
              .select('check_in, check_out')
              .eq('property_id', property.id)
              .in('status', ['confirmed', 'pending'])
              .gte('check_out', params.checkIn!.toISOString().split('T')[0])
              .lte('check_in', params.checkOut!.toISOString().split('T')[0]);

            const isAvailable = !bookings || bookings.length === 0;
            return isAvailable ? property : null;
          })
        );

        filteredProperties = availableProperties.filter(Boolean) as any as Property[];
      }

      return filteredProperties;
    },
    enabled: Object.keys(params).length > 0,
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Property } from './useProperties';

export interface SearchParams {
  location?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
}

export const useSearch = (params: SearchParams) => {
  return useQuery({
    queryKey: ['search', params],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('is_active', true);

      // Filter by location if provided
      if (params.location && params.location.trim()) {
        query = query.ilike('location', `%${params.location}%`);
      }

      // Filter by guest capacity if provided
      if (params.guests) {
        query = query.gte('guests', params.guests);
      }

      const { data: properties, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // If dates are provided, filter out unavailable properties
      if (params.checkIn && params.checkOut && properties) {
        const availableProperties = await Promise.all(
          properties.map(async (property) => {
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

        return availableProperties.filter(Boolean) as Property[];
      }

      return properties as Property[];
    },
    enabled: !!(params.location || params.checkIn || params.checkOut || params.guests),
  });
};
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAvailability = (propertyId: string, checkIn?: Date, checkOut?: Date) => {
  return useQuery({
    queryKey: ['availability', propertyId, checkIn, checkOut],
    queryFn: async () => {
      if (!checkIn || !checkOut) {
        return { isAvailable: true, conflictingBookings: [] };
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, check_in, check_out, status')
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'pending'])
        .gte('check_out', checkIn.toISOString().split('T')[0])
        .lte('check_in', checkOut.toISOString().split('T')[0]);

      if (error) {
        throw error;
      }

      const isAvailable = !bookings || bookings.length === 0;
      
      return {
        isAvailable,
        conflictingBookings: bookings || [],
      };
    },
    enabled: !!propertyId,
  });
};

export const usePropertyAvailability = (propertyId: string) => {
  return useQuery({
    queryKey: ['property-availability', propertyId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('check_in, check_out, status')
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'pending'])
        .lte('check_in', today)  // Booking starts on or before today
        .gt('check_out', today); // Booking ends after today

      if (error) {
        throw error;
      }

      // Property is generally available if it has no current bookings (bookings that overlap with today)
      const hasCurrentBookings = bookings && bookings.length > 0;
      
      return {
        isGenerallyAvailable: !hasCurrentBookings,
        upcomingBookings: bookings || [],
      };
    },
    enabled: !!propertyId,
  });
};
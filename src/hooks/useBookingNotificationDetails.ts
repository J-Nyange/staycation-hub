import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";

export interface BookingNotificationData {
  id: string;
  property_title: string;
  property_location: string;
  property_image: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  special_requests?: string;
  accommodation_explanation?: string;
  status: string;
  payment_status: string;
}

export const useBookingNotificationDetails = (bookingId: string | null) => {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ["booking-notification-details", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      // Fetch booking with property details
      const { data: booking, error } = await supabase
        .from("bookings")
        .select(`
          id,
          check_in,
          check_out,
          guests,
          total_price,
          status,
          payment_status,
          special_requests,
          user_id,
          guest_email,
          guest_phone,
          guest_name,
          is_group_booking,
          group_type,
          dietary_requirements,
          accessibility_needs,
          additional_services,
          accommodation_explanation,
          properties (
            id,
            title,
            location,
            main_image,
            description
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      if (!booking) return null;

      // Get guest info directly from booking record
      const guestName = booking.guest_name || "Guest";
      const guestEmail = booking.guest_email || "No email available";
      const guestPhone = booking.guest_phone || undefined;

      const bookingData: BookingNotificationData = {
        id: booking.id,
        property_title: booking.properties?.title || "Unknown Property",
        property_location: booking.properties?.location || "Unknown Location",
        property_image: booking.properties?.main_image || "",
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests,
        total_price: booking.total_price,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        special_requests: booking.special_requests || undefined,
        accommodation_explanation: booking.accommodation_explanation || undefined,
        status: booking.status,
        payment_status: booking.payment_status,
      };

      return bookingData;
    },
    enabled: !!bookingId,
  });
};

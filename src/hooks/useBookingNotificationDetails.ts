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

      // Fetch booking with guest details
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
          properties (
            id,
            title,
            location,
            main_image,
            description
          ),
          profiles:user_id (
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      if (!booking) return null;

      // Get guest info from booking snapshot (preferred) or profile (fallback)
      const guestName = (booking as any).guest_name || 
        `${(booking as any).profiles?.first_name || ""} ${(booking as any).profiles?.last_name || ""}`.trim() || 
        "Guest";
      const guestEmail = (booking as any).guest_email || (booking as any).profiles?.email || "No email available";
      const guestPhone = (booking as any).guest_phone || (booking as any).profiles?.phone || undefined;

      const bookingData: BookingNotificationData = {
        id: (booking as any).id,
        property_title: (booking as any).properties?.title || "Unknown Property",
        property_location: (booking as any).properties?.location || "Unknown Location",
        property_image: (booking as any).properties?.main_image || "",
        check_in: (booking as any).check_in,
        check_out: (booking as any).check_out,
        guests: (booking as any).guests,
        total_price: (booking as any).total_price,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        special_requests: (booking as any).special_requests || undefined,
        accommodation_explanation: (booking as any).accommodation_explanation || undefined,
        status: (booking as any).status,
        payment_status: (booking as any).payment_status,
      };

      return bookingData;
    },
    enabled: !!bookingId,
  });
};

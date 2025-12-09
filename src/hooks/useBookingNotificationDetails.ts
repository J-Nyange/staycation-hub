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

      // Fetch booking with guest email from Clerk
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
          properties (
            id,
            title,
            location,
            main_image
          ),
          profiles:user_id (
            first_name,
            last_name,
            phone
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      if (!booking) return null;

      // Get guest email from Clerk user
      let guestEmail = "No email available";
      if (user?.id === (booking as any).user_id) {
        guestEmail = user.primaryEmailAddress?.emailAddress || guestEmail;
      }

      const bookingData: BookingNotificationData = {
        id: (booking as any).id,
        property_title: (booking as any).properties?.title || "Unknown Property",
        property_location: (booking as any).properties?.location || "Unknown Location",
        property_image: (booking as any).properties?.main_image || "",
        check_in: (booking as any).check_in,
        check_out: (booking as any).check_out,
        guests: (booking as any).guests,
        total_price: (booking as any).total_price,
        guest_name: `${(booking as any).profiles?.first_name || ""} ${(booking as any).profiles?.last_name || ""}`.trim() || "Guest",
        guest_email: guestEmail,
        guest_phone: (booking as any).profiles?.phone || undefined,
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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  // Role identification
  owner_id?: string;
  booking_user_id?: string;
  // Owner contact info (for guest view)
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
}

export const useBookingNotificationDetails = (bookingId: string | null) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["booking-notification-details", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      // Fetch booking with property details including owner_id
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
            description,
            owner_id
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

      // Fetch owner profile if we have an owner_id
      let ownerName: string | undefined;
      let ownerEmail: string | undefined;
      let ownerPhone: string | undefined;

      const ownerId = booking.properties?.owner_id;
      if (ownerId) {
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone")
          .eq("user_id", ownerId)
          .single();

        if (ownerProfile) {
          const firstName = ownerProfile.first_name || "";
          const lastName = ownerProfile.last_name || "";
          ownerName = [firstName, lastName].filter(Boolean).join(" ") || "Property Owner";
          ownerPhone = ownerProfile.phone || undefined;
        }

        // Try to get owner email from Clerk user metadata stored in profiles or use a fallback
        // Since we can't directly query Clerk, we'll use the owner_id as a contact reference
        ownerEmail = undefined; // Email not stored in profiles table
      }

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
        // Role identification
        owner_id: ownerId,
        booking_user_id: booking.user_id,
        // Owner contact info
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
      };

      return bookingData;
    },
    enabled: !!bookingId,
  });
};

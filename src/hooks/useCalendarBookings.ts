import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface CalendarBooking {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
  user_id: string;
}

export const useCalendarBookings = (propertyId: string, currentMonth: Date) => {
  return useQuery({
    queryKey: ["calendar-bookings", propertyId, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      // Fetch bookings where check_out is after month start AND check_in is before month end
      const { data, error } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, status, user_id")
        .eq("property_id", propertyId)
        .gte("check_out", format(start, "yyyy-MM-dd"))  // Booking ends on or after month start
        .lte("check_in", format(end, "yyyy-MM-dd"));    // Booking starts on or before month end

      if (error) throw error;
      return data as CalendarBooking[];
    },
    enabled: !!propertyId,
  });
};

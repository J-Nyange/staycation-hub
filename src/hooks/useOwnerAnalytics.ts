import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, subMonths, format } from "date-fns";

export type TimeRange = "7days" | "30days" | "3months" | "1year" | "all";

export interface OwnerAnalytics {
  property_id: string;
  property_title: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  total_revenue: number;
  avg_booking_value: number;
  average_rating: number;
  review_count: number;
  booking_success_rate: number;
  avg_stay_duration: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  booking_count: number;
}

const getDateRange = (range: TimeRange) => {
  const end = new Date();
  let start: Date;

  switch (range) {
    case "7days":
      start = subDays(end, 7);
      break;
    case "30days":
      start = subDays(end, 30);
      break;
    case "3months":
      start = subMonths(end, 3);
      break;
    case "1year":
      start = subMonths(end, 12);
      break;
    case "all":
      start = new Date(2020, 0, 1); // Arbitrary early date
      break;
  }

  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
};

export const useOwnerAnalytics = (timeRange: TimeRange = "30days") => {
  const { user } = useAuth();

  const { data: analytics = [], isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["owner-analytics", user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];

      const { start, end } = getDateRange(timeRange);
      const { data, error } = await supabase.rpc("get_owner_analytics", {
        target_owner_id: user.id,
        start_date: start,
        end_date: end,
      });

      if (error) throw error;
      return (data || []) as OwnerAnalytics[];
    },
    enabled: !!user,
  });

  const { data: revenueByMonth = [], isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["revenue-by-month", user?.id, timeRange],
    queryFn: async () => {
      if (!user) return [];

      const { start, end } = getDateRange(timeRange);

      const { data, error } = await supabase.rpc("get_revenue_by_month", {
        owner_text: user.id,
        start_date: start,
        end_date: end,
      });

      if (error) throw error;
      return data as RevenueData[];
    },
    enabled: !!user,
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ["owner-earnings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("property_earnings")
        .select(`
          *,
          property:properties(title)
        `)
        .in(
          "property_id",
          analytics.map((a) => a.property_id)
        );

      if (error) throw error;
      return data;
    },
    enabled: !!user && analytics.length > 0,
  });

  // Calculate aggregate metrics
  const totalRevenue = analytics.reduce((sum, a) => sum + Number(a.total_revenue), 0);
  const totalBookings = analytics.reduce((sum, a) => sum + a.confirmed_bookings, 0);
  const totalPending = analytics.reduce((sum, a) => sum + a.pending_bookings, 0);
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const totalPendingPayout = earnings
    .filter((e: any) => e.payout_status === "pending")
    .reduce((sum, e: any) => sum + Number(e.net_amount), 0);

  return {
    analytics,
    revenueByMonth,
    earnings,
    isLoading: isLoadingAnalytics || isLoadingRevenue,
    metrics: {
      totalRevenue,
      totalBookings,
      totalPending,
      avgBookingValue,
      totalPendingPayout,
      propertyCount: analytics.length,
    },
  };
};

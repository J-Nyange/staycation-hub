import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BlockedDate {
  id: string;
  property_id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
}

export const useBlockedDates = (propertyId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: blockedDates = [], isLoading } = useQuery({
    queryKey: ["blocked-dates", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("*")
        .eq("property_id", propertyId)
        .order("blocked_date");

      if (error) throw error;
      return data as BlockedDate[];
    },
    enabled: !!propertyId,
  });

  const blockDateMutation = useMutation({
    mutationFn: async ({ date, reason }: { date: string; reason?: string }) => {
      const { error } = await supabase.from("blocked_dates").insert({
        property_id: propertyId,
        blocked_date: date,
        reason: reason || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-dates", propertyId] });
      toast({
        title: "Date blocked",
        description: "The date has been blocked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to block date",
        description: error.message,
      });
    },
  });

  const unblockDateMutation = useMutation({
    mutationFn: async (blockedDateId: string) => {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("id", blockedDateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-dates", propertyId] });
      toast({
        title: "Date unblocked",
        description: "The date has been unblocked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to unblock date",
        description: error.message,
      });
    },
  });

  return {
    blockedDates,
    isLoading,
    blockDate: blockDateMutation.mutate,
    unblockDate: unblockDateMutation.mutate,
  };
};

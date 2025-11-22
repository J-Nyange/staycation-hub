import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBookingActions = () => {
  const queryClient = useQueryClient();

  const cancelBooking = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const { data, error } = await supabase.functions.invoke("cancel-booking", {
        body: { bookingId, reason },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `Booking cancelled successfully${data.refundAmount > 0 ? `. Refund of $${data.refundAmount.toFixed(2)} (${data.refundPercentage}%) will be processed.` : "."}`
      );
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  const modifyBooking = useMutation({
    mutationFn: async ({
      bookingId,
      modificationType,
      newCheckIn,
      newCheckOut,
      newGuests,
      reason,
    }: {
      bookingId: string;
      modificationType: string;
      newCheckIn?: string;
      newCheckOut?: string;
      newGuests?: number;
      reason: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("modify-booking", {
        body: { bookingId, modificationType, newCheckIn, newCheckOut, newGuests, reason },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Modification request submitted. The owner will review your request.");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["modifications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit modification request");
    },
  });

  const respondToModification = useMutation({
    mutationFn: async ({
      modificationId,
      status,
      response,
    }: {
      modificationId: string;
      status: "approved" | "rejected";
      response: string;
    }) => {
      const { error } = await supabase
        .from("booking_modifications")
        .update({
          status,
          response,
          responded_at: new Date().toISOString(),
        })
        .eq("id", modificationId);

      if (error) throw error;

      // If approved, update the booking
      if (status === "approved") {
        const { data: mod } = await supabase
          .from("booking_modifications")
          .select("*, booking:bookings(*)")
          .eq("id", modificationId)
          .single();

        if (mod) {
          const updates: any = {
            modification_count: (mod.booking.modification_count || 0) + 1,
          };

          if (mod.new_check_in) updates.check_in = mod.new_check_in;
          if (mod.new_check_out) updates.check_out = mod.new_check_out;
          if (mod.new_guests) updates.guests = mod.new_guests;

          await supabase.from("bookings").update(updates).eq("id", mod.booking_id);
        }
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`Modification request ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["modifications"] });
      queryClient.invalidateQueries({ queryKey: ["owner-bookings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to respond to modification");
    },
  });

  return {
    cancelBooking,
    modifyBooking,
    respondToModification,
  };
};
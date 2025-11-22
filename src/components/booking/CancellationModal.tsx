import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RefundCalculator } from "./RefundCalculator";
import { useBookingActions } from "@/hooks/useBookingActions";
import { Loader2 } from "lucide-react";

interface CancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    check_in: string;
    total_price: number;
    properties: {
      cancellation_policy: string;
    };
  };
}

export const CancellationModal = ({ open, onOpenChange, booking }: CancellationModalProps) => {
  const [reason, setReason] = useState("");
  const { cancelBooking } = useBookingActions();

  const handleCancel = () => {
    cancelBooking.mutate(
      { bookingId: booking.id, reason },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Please review the refund details below before cancelling your booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RefundCalculator
            checkInDate={booking.check_in}
            totalPrice={booking.total_price}
            cancellationPolicy={booking.properties.cancellation_policy}
          />

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Help us understand why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelBooking.isPending}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelBooking.isPending}>
              {cancelBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
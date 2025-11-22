import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useBookingActions } from "@/hooks/useBookingActions";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ModificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    check_in: string;
    check_out: string;
    guests: number;
  };
}

export const ModificationModal = ({ open, onOpenChange, booking }: ModificationModalProps) => {
  const [newCheckIn, setNewCheckIn] = useState(booking.check_in);
  const [newCheckOut, setNewCheckOut] = useState(booking.check_out);
  const [newGuests, setNewGuests] = useState(booking.guests);
  const [reason, setReason] = useState("");
  const { modifyBooking } = useBookingActions();

  const handleSubmit = () => {
    modifyBooking.mutate(
      {
        bookingId: booking.id,
        modificationType: "date_change",
        newCheckIn,
        newCheckOut,
        newGuests,
        reason,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason("");
        },
      }
    );
  };

  const hasChanges = 
    newCheckIn !== booking.check_in || 
    newCheckOut !== booking.check_out || 
    newGuests !== booking.guests;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Booking Modification</DialogTitle>
          <DialogDescription>
            Request changes to your booking dates or guest count. The property owner will review your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Modification requests are subject to property availability and owner approval. Any price difference will be calculated upon approval.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newCheckIn">New Check-in Date</Label>
              <Input
                id="newCheckIn"
                type="date"
                value={newCheckIn}
                onChange={(e) => setNewCheckIn(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCheckOut">New Check-out Date</Label>
              <Input
                id="newCheckOut"
                type="date"
                value={newCheckOut}
                onChange={(e) => setNewCheckOut(e.target.value)}
                min={newCheckIn}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newGuests">Number of Guests</Label>
            <Input
              id="newGuests"
              type="number"
              min={1}
              value={newGuests}
              onChange={(e) => setNewGuests(parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for modification</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need to modify your booking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={modifyBooking.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={modifyBooking.isPending || !hasChanges || !reason}
            >
              {modifyBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
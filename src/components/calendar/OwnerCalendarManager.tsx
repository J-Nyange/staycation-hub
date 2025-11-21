import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OwnerCalendarManagerProps {
  propertyId: string;
}

export const OwnerCalendarManager = ({ propertyId }: OwnerCalendarManagerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const { blockedDates, blockDate, unblockDate } = useBlockedDates(propertyId);

  const handleBlockDate = () => {
    if (!selectedDate) return;
    blockDate({
      date: format(selectedDate, "yyyy-MM-dd"),
      reason: reason.trim() || undefined,
    });
    setSelectedDate(undefined);
    setReason("");
  };

  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blockedDates.some((blocked) => blocked.blocked_date === dateStr);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Manage Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Property Availability</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Select date to block</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || isDateBlocked(date)}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  blocked: (date) => isDateBlocked(date),
                }}
                modifiersClassNames={{
                  blocked: "bg-destructive/20 text-destructive line-through",
                }}
              />
            </div>
            {selectedDate && (
              <div className="space-y-3">
                <div>
                  <Label>Date to Block</Label>
                  <Input value={format(selectedDate, "PPP")} disabled />
                </div>
                <div>
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="E.g., Property maintenance, personal use..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <Button onClick={handleBlockDate} className="w-full">
                  Block This Date
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Blocked Dates ({blockedDates.length})</Label>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {blockedDates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No blocked dates
                </p>
              ) : (
                <div className="space-y-2">
                  {blockedDates.map((blocked) => (
                    <div
                      key={blocked.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {format(new Date(blocked.blocked_date), "PPP")}
                        </p>
                        {blocked.reason && (
                          <p className="text-sm text-muted-foreground">
                            {blocked.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unblockDate(blocked.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

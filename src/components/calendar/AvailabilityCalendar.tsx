import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarBookings } from "@/hooks/useCalendarBookings";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { BookingLegend } from "./BookingLegend";
import { isWithinInterval, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";

interface AvailabilityCalendarProps {
  propertyId: string;
  pricePerNight: number;
  onDateSelect?: (date: Date | undefined) => void;
  selectedDate?: Date;
  mode?: "single" | "range";
}

export const AvailabilityCalendar = ({
  propertyId,
  pricePerNight,
  onDateSelect,
  selectedDate,
  mode = "single",
}: AvailabilityCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: bookings = [] } = useCalendarBookings(propertyId, currentMonth);
  const { blockedDates = [] } = useBlockedDates(propertyId);

  const isDateBooked = (date: Date) => {
    return bookings.some((booking) => {
      if (booking.status === "cancelled") return false;
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return isWithinInterval(date, { start: checkIn, end: checkOut });
    });
  };

  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blockedDates.some((blocked) => blocked.blocked_date === dateStr);
  };

  const isDatePending = (date: Date) => {
    return bookings.some((booking) => {
      if (booking.status !== "pending") return false;
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      return isWithinInterval(date, { start: checkIn, end: checkOut });
    });
  };

  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
    blocked: (date: Date) => isDateBlocked(date),
    pending: (date: Date) => isDatePending(date),
  };

  const modifiersClassNames = {
    booked: "bg-destructive/20 text-destructive hover:bg-destructive/30",
    blocked: "bg-muted text-muted-foreground hover:bg-muted line-through",
    pending: "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30",
  };

  return (
    <div className="space-y-4">
      <BookingLegend />
      <Calendar
        mode={mode as any}
        selected={selectedDate}
        onSelect={onDateSelect}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        disabled={(date) =>
          date < new Date() || isDateBooked(date) || isDateBlocked(date)
        }
        className={cn("rounded-md border pointer-events-auto")}
      />
      <div className="text-sm text-muted-foreground">
        <p className="font-semibold">
          ${pricePerNight.toFixed(2)} <span className="font-normal">per night</span>
        </p>
      </div>
    </div>
  );
};

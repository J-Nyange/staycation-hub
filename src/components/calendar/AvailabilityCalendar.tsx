import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useCalendarBookings } from "@/hooks/useCalendarBookings";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { BookingLegend } from "./BookingLegend";
import { isBefore, format } from "date-fns";
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
      // Parse date-only strings (yyyy-MM-dd) using UTC to avoid timezone shifts
      const [checkInYear, checkInMonth, checkInDay] = booking.check_in.split('-').map(Number);
      const [checkOutYear, checkOutMonth, checkOutDay] = booking.check_out.split('-').map(Number);
      const checkIn = new Date(Date.UTC(checkInYear, checkInMonth - 1, checkInDay));
      const checkOut = new Date(Date.UTC(checkOutYear, checkOutMonth - 1, checkOutDay));
      // Convert calendar date to UTC for comparison
      const calendarDateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      // Booked if date is on or after check-in AND before check-out (check-out is guest departure)
      return !isBefore(calendarDateUTC, checkIn) && isBefore(calendarDateUTC, checkOut);
    });
  };

  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blockedDates.some((blocked) => blocked.blocked_date === dateStr);
  };

  const isDatePending = (date: Date) => {
    return bookings.some((booking) => {
      if (booking.status !== "pending") return false;
      // Parse date-only strings (yyyy-MM-dd) using UTC to avoid timezone shifts
      const [checkInYear, checkInMonth, checkInDay] = booking.check_in.split('-').map(Number);
      const [checkOutYear, checkOutMonth, checkOutDay] = booking.check_out.split('-').map(Number);
      const checkIn = new Date(Date.UTC(checkInYear, checkInMonth - 1, checkInDay));
      const checkOut = new Date(Date.UTC(checkOutYear, checkOutMonth - 1, checkOutDay));
      // Convert calendar date to UTC for comparison
      const calendarDateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      // Pending if date is on or after check-in AND before check-out
      return !isBefore(calendarDateUTC, checkIn) && isBefore(calendarDateUTC, checkOut);
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
          KES {pricePerNight.toFixed(2)} <span className="font-normal">per night</span>
        </p>
      </div>
    </div>
  );
};

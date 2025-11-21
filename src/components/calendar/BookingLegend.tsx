export const BookingLegend = () => {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-background border rounded" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-destructive/20 border border-destructive/30 rounded" />
        <span>Booked</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/30 rounded" />
        <span>Pending</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-muted border rounded" />
        <span>Blocked</span>
      </div>
    </div>
  );
};

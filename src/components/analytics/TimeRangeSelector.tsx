import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimeRange } from "@/hooks/useOwnerAnalytics";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const ranges: { label: string; value: TimeRange }[] = [
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last Year", value: "1year" },
  { label: "All Time", value: "all" },
];

export const TimeRangeSelector = ({ value, onChange }: TimeRangeSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range.value)}
          className={cn(
            value === range.value && "bg-primary text-primary-foreground"
          )}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
};

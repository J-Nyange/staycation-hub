import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { OwnerAnalytics } from "@/hooks/useOwnerAnalytics";

interface ExportButtonProps {
  analytics: OwnerAnalytics[];
  timeRange: string;
}

export const ExportButton = ({ analytics, timeRange }: ExportButtonProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    if (analytics.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to export",
        description: "There is no analytics data available to export.",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Property",
      "Total Revenue",
      "Confirmed Bookings",
      "Cancelled Bookings",
      "Pending Bookings",
      "Average Booking Value",
      "Average Rating",
      "Review Count",
      "Success Rate (%)",
      "Avg Stay Duration (days)",
    ];

    const rows = analytics.map((property) => [
      property.property_title,
      Number(property.total_revenue).toFixed(2),
      property.confirmed_bookings,
      property.cancelled_bookings,
      property.pending_bookings,
      Number(property.avg_booking_value).toFixed(2),
      Number(property.average_rating).toFixed(2),
      property.review_count,
      Number(property.booking_success_rate).toFixed(2),
      Number(property.avg_stay_duration).toFixed(1),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `property-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Your analytics data has been exported to CSV.",
    });
  };

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="w-4 h-4 mr-2" />
      Export to CSV
    </Button>
  );
};

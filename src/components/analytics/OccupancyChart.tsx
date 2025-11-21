import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { OwnerAnalytics } from "@/hooks/useOwnerAnalytics";

interface OccupancyChartProps {
  analytics: OwnerAnalytics[];
}

export const OccupancyChart = ({ analytics }: OccupancyChartProps) => {
  if (analytics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No properties found
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate occupancy rate (simplified: confirmed bookings / total days)
  const propertiesWithOccupancy = analytics.map((property) => {
    // Simplified occupancy: percentage of time booked
    const totalBookingDays = property.confirmed_bookings * property.avg_stay_duration;
    const daysInPeriod = 30; // Using 30 days as base period
    const occupancyRate = Math.min(
      100,
      (totalBookingDays / daysInPeriod) * 100
    );

    return {
      ...property,
      occupancyRate: occupancyRate || 0,
    };
  });

  const avgOccupancy =
    propertiesWithOccupancy.reduce((sum, p) => sum + p.occupancyRate, 0) /
    propertiesWithOccupancy.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Occupancy Rates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {avgOccupancy.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">
              Average Occupancy
            </span>
          </div>
          <Progress value={avgOccupancy} className="h-3" />
        </div>

        <div className="space-y-4">
          {propertiesWithOccupancy.map((property) => (
            <div key={property.property_id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1 mr-2">
                  {property.property_title}
                </span>
                <span className="font-medium">
                  {property.occupancyRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={property.occupancyRate} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

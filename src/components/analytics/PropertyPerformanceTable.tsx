import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Star } from "lucide-react";
import type { OwnerAnalytics } from "@/hooks/useOwnerAnalytics";

interface PropertyPerformanceTableProps {
  analytics: OwnerAnalytics[];
}

type SortField =
  | "property_title"
  | "total_revenue"
  | "confirmed_bookings"
  | "average_rating"
  | "booking_success_rate";

export const PropertyPerformanceTable = ({
  analytics,
}: PropertyPerformanceTableProps) => {
  const [sortField, setSortField] = useState<SortField>("total_revenue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedAnalytics = [...analytics].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === "asc"
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });

  if (analytics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No properties found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("property_title")}
                    className="h-8 px-2"
                  >
                    Property
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("total_revenue")}
                    className="h-8 px-2"
                  >
                    Revenue
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("confirmed_bookings")}
                    className="h-8 px-2"
                  >
                    Bookings
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("average_rating")}
                    className="h-8 px-2"
                  >
                    Rating
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("booking_success_rate")}
                    className="h-8 px-2"
                  >
                    Success Rate
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAnalytics.map((property) => (
                <TableRow key={property.property_id}>
                  <TableCell className="font-medium">
                    {property.property_title}
                  </TableCell>
                  <TableCell>
                    ${Number(property.total_revenue).toLocaleString()}
                  </TableCell>
                  <TableCell>{property.confirmed_bookings}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{Number(property.average_rating).toFixed(1)}</span>
                      <span className="text-muted-foreground text-xs">
                        ({property.review_count})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {Number(property.booking_success_rate).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

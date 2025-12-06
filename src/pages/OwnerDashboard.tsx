import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Home,
  Calendar,
  TrendingUp,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerAnalytics, type TimeRange } from "@/hooks/useOwnerAnalytics";
import { TimeRangeSelector } from "@/components/analytics/TimeRangeSelector";
import { RevenueChart } from "@/components/analytics/RevenueChart";
import { BookingTrendsChart } from "@/components/analytics/BookingTrendsChart";
import { OccupancyChart } from "@/components/analytics/OccupancyChart";
import { PropertyPerformanceTable } from "@/components/analytics/PropertyPerformanceTable";
import { ExportButton } from "@/components/analytics/ExportButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OwnerDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("30days");

  const { analytics, revenueByMonth, metrics, isLoading } =
    useOwnerAnalytics(timeRange);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg">
            Please sign in to access your owner dashboard.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Owner Dashboard"
        description="Manage your properties and track performance"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
                <p className="text-muted-foreground">
                  Track your properties, bookings, and revenue
                </p>
              </div>
              <ExportButton analytics={analytics} timeRange={timeRange} />
            </div>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    KES {metrics.totalRevenue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  From {metrics.totalBookings} bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Payout
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    KES {metrics.totalPendingPayout.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ready to withdraw
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Properties
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {metrics.propertyCount}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Active listings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Booking Value
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    KES {metrics.avgBookingValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Per reservation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Bookings Alert */}
          {metrics.totalPending > 0 && (
            <Alert className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pending Bookings</AlertTitle>
              <AlertDescription>
                You have {metrics.totalPending} pending booking
                {metrics.totalPending !== 1 ? "s" : ""} that need your
                attention.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Button
              onClick={() => navigate("/my-properties")}
              variant="outline"
              className="h-auto py-4"
            >
              <div className="text-left w-full">
                <Home className="h-5 w-5 mb-2" />
                <p className="font-semibold">Manage Properties</p>
                <p className="text-xs text-muted-foreground">
                  View and edit your listings
                </p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/bookings")}
              variant="outline"
              className="h-auto py-4"
            >
              <div className="text-left w-full">
                <Calendar className="h-5 w-5 mb-2" />
                <p className="font-semibold">View Bookings</p>
                <p className="text-xs text-muted-foreground">
                  Check reservations
                </p>
              </div>
            </Button>
            <Button
              onClick={() => navigate("/messages")}
              variant="outline"
              className="h-auto py-4"
            >
              <div className="text-left w-full">
                <BarChart3 className="h-5 w-5 mb-2" />
                <p className="font-semibold">Messages</p>
                <p className="text-xs text-muted-foreground">
                  Communicate with guests
                </p>
              </div>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analytics.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Properties Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first property to see analytics
                  </p>
                  <Button onClick={() => navigate("/my-properties")}>
                    Add Property
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Revenue Chart */}
              <RevenueChart data={revenueByMonth} />

              {/* Booking Trends Chart */}
              <BookingTrendsChart data={revenueByMonth} />

              {/* Occupancy Chart */}
              <OccupancyChart analytics={analytics} />

              {/* Property Performance Table */}
              <PropertyPerformanceTable analytics={analytics} />

              {/* Additional Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">
                        Most Booked Property
                      </p>
                      <p className="font-semibold">
                        {
                          [...analytics].sort(
                            (a, b) =>
                              b.confirmed_bookings - a.confirmed_bookings
                          )[0]?.property_title
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {
                          [...analytics].sort(
                            (a, b) =>
                              b.confirmed_bookings - a.confirmed_bookings
                          )[0]?.confirmed_bookings
                        }{" "}
                        bookings
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">
                        Highest Revenue Property
                      </p>
                      <p className="font-semibold">
                        {
                          [...analytics].sort(
                            (a, b) =>
                              Number(b.total_revenue) - Number(a.total_revenue)
                          )[0]?.property_title
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        KES
                        {Number(
                          [...analytics].sort(
                            (a, b) =>
                              Number(b.total_revenue) - Number(a.total_revenue)
                          )[0]?.total_revenue
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">
                        Highest Rated Property
                      </p>
                      <p className="font-semibold">
                        {
                          [...analytics].sort(
                            (a, b) =>
                              Number(b.average_rating) -
                              Number(a.average_rating)
                          )[0]?.property_title
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⭐{" "}
                        {Number(
                          [...analytics].sort(
                            (a, b) =>
                              Number(b.average_rating) -
                              Number(a.average_rating)
                          )[0]?.average_rating
                        ).toFixed(1)}{" "}
                        rating
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground mb-1">
                        Best Performing Property
                      </p>
                      <p className="font-semibold">
                        {
                          [...analytics].sort(
                            (a, b) =>
                              Number(b.booking_success_rate) -
                              Number(a.booking_success_rate)
                          )[0]?.property_title
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Number(
                          [...analytics].sort(
                            (a, b) =>
                              Number(b.booking_success_rate) -
                              Number(a.booking_success_rate)
                          )[0]?.booking_success_rate
                        ).toFixed(1)}
                        % success rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}

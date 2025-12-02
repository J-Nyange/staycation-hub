import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, XCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CancellationModal } from "@/components/booking/CancellationModal";
import { ModificationModal } from "@/components/booking/ModificationModal";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  refund_amount?: number;
  refund_status?: string;
  cancellation_reason?: string;
  properties: {
    id: string;
    title: string;
    location: string;
    main_image: string;
    category: string;
    cancellation_policy: string;
  };
}

const BookingHistory = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [modifyingBooking, setModifyingBooking] = useState<Booking | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            id,
            title,
            location,
            main_image,
            category,
            cancellation_policy
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to view your booking history.
              </p>
              <Button onClick={() => navigate('/')}>Go to Home</Button>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Booking History</h1>
            <p className="text-muted-foreground">
              View and manage your property bookings
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Skeleton className="w-48 h-32 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                      <div className="w-full md:w-48 h-48 md:h-32 flex-shrink-0">
                        <img
                          src={booking.properties.main_image}
                          alt={booking.properties.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">
                              {booking.properties.title}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.properties.location}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Check-in</p>
                              <p className="font-medium">{format(new Date(booking.check_in), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Check-out</p>
                              <p className="font-medium">{format(new Date(booking.check_out), 'MMM dd, yyyy')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Guests</p>
                              <p className="font-medium">{booking.guests}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground text-xs">Total</p>
                              <p className="font-medium">${booking.total_price}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Badge variant="outline" className="text-xs">
                            {booking.properties.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Payment: {booking.payment_status}
                          </Badge>
                        </div>

                        {booking.status === "confirmed" && new Date(booking.check_in) > new Date() && (
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setModifyingBooking(booking)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modify
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => setCancellingBooking(booking)}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        )}

                        {booking.status === "cancelled" && booking.refund_amount && booking.refund_amount > 0 && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium">Refund:</span> ${booking.refund_amount.toFixed(2)} ({booking.refund_status})
                            </p>
                            {booking.cancellation_reason && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Reason: {booking.cancellation_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any bookings yet. Start exploring properties!
              </p>
              <Button onClick={() => navigate('/')}>Browse Properties</Button>
            </Card>
          )}
        </div>
      </main>

      {cancellingBooking && (
        <CancellationModal
          open={!!cancellingBooking}
          onOpenChange={(open) => !open && setCancellingBooking(null)}
          booking={cancellingBooking}
        />
      )}

      {modifyingBooking && (
        <ModificationModal
          open={!!modifyingBooking}
          onOpenChange={(open) => !open && setModifyingBooking(null)}
          booking={modifyingBooking}
        />
      )}

      <Footer />
    </>
  );
};

export default BookingHistory;
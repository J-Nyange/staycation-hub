import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, XCircle, Edit, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CancellationModal } from "@/components/booking/CancellationModal";
import { ModificationModal } from "@/components/booking/ModificationModal";
import { ResumePaymentModal } from "@/components/booking/ResumePaymentModal";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  expires_at?: string;
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [modifyingBooking, setModifyingBooking] = useState<Booking | null>(null);
  const [resumingPaymentBooking, setResumingPaymentBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Mutation to cancel pending bookings
  const cancelPendingBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      // Update booking status to cancelled
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'failed', // Must use 'failed' - constraint: ('pending', 'paid', 'refunded', 'failed')
          cancellation_reason: 'User cancelled before payment',
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "Your pending booking has been cancelled. The property is now available for those dates.",
      });
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel the booking. Please try again.",
      });
    },
  });

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
      case 'expired':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed':
      case 'expired':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings?.filter((booking) => {
    switch (activeTab) {
      case 'pending':
        return booking.status === 'pending' && booking.payment_status === 'pending';
      case 'paid':
        return booking.payment_status === 'completed';
      case 'expired':
        return booking.status === 'expired' || (booking.status === 'cancelled' && booking.cancellation_reason?.includes('auto'));
      default:
        return true;
    }
  });

  const getTabCount = (tab: string) => {
    if (!bookings) return 0;
    switch (tab) {
      case 'pending':
        return bookings.filter(b => b.status === 'pending' && b.payment_status === 'pending').length;
      case 'paid':
        return bookings.filter(b => b.payment_status === 'completed').length;
      case 'expired':
        return bookings.filter(b => b.status === 'expired' || (b.status === 'cancelled' && b.cancellation_reason?.includes('auto'))).length;
      default:
        return bookings.length;
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex gap-2">
                All
                <Badge variant="secondary" className="ml-1">{getTabCount('all')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex gap-2">
                <Clock className="h-4 w-4" />
                Pending
                <Badge variant="secondary" className="ml-1">{getTabCount('pending')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex gap-2">
                Paid
                <Badge variant="secondary" className="ml-1">{getTabCount('paid')}</Badge>
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex gap-2">
                <AlertCircle className="h-4 w-4" />
                Expired
                <Badge variant="secondary" className="ml-1">{getTabCount('expired')}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
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
              ) : filteredBookings && filteredBookings.length > 0 ? (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
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
                              <div className="flex flex-col gap-2 items-end">
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                                <Badge className={getPaymentStatusColor(booking.payment_status)}>
                                  Payment: {booking.payment_status}
                                </Badge>
                              </div>
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
                                  <p className="font-medium">KES {booking.total_price}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <Badge variant="outline" className="text-xs">
                                {booking.properties.category}
                              </Badge>
                            </div>

                            {/* Show expired message */}
                            {booking.status === "expired" && (
                              <div className="mt-4 p-3 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  This booking expired due to incomplete payment within 15 minutes.
                                </p>
                              </div>
                            )}

                            {/* Resume Payment and Cancel buttons for pending bookings */}
                            {booking.status === "pending" && booking.payment_status === "pending" && (
                              <div className="mt-4 space-y-3">
                                {booking.expires_at && new Date(booking.expires_at) > new Date() && (
                                  <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-500/10 p-2 rounded">
                                    <Clock className="h-4 w-4" />
                                    Complete payment before booking expires
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => setResumingPaymentBooking(booking)}
                                    className="flex-1"
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Resume Payment
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => cancelPendingBookingMutation.mutate(booking.id)}
                                    disabled={cancelPendingBookingMutation.isPending}
                                    className="flex-1"
                                  >
                                    {cancelPendingBookingMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Cancel Booking
                                  </Button>
                                </div>
                              </div>
                            )}

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
                                  <span className="font-medium">Refund:</span> KES {booking.refund_amount.toFixed(2)} ({booking.refund_status})
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
                  <h3 className="text-xl font-semibold mb-2">
                    {activeTab === 'all' ? 'No Bookings Yet' : `No ${activeTab} bookings`}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {activeTab === 'all' 
                      ? "You haven't made any bookings yet. Start exploring properties!"
                      : `You don't have any ${activeTab} bookings.`
                    }
                  </p>
                  <Button onClick={() => navigate('/')}>Browse Properties</Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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

      {resumingPaymentBooking && (
        <ResumePaymentModal
          open={!!resumingPaymentBooking}
          onOpenChange={(open) => !open && setResumingPaymentBooking(null)}
          booking={resumingPaymentBooking}
        />
      )}

      <Footer />
    </>
  );
};

export default BookingHistory;
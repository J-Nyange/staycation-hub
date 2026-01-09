import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBookingActions } from "@/hooks/useBookingActions";
import { useNotifications } from "@/hooks/useNotifications";
import { useBookingNotificationDetails } from "@/hooks/useBookingNotificationDetails";
import BookingNotificationModal from "@/components/notifications/BookingNotificationModal";
import { Calendar, Users, DollarSign, MessageSquare, CheckCircle, XCircle, Phone, Bell, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OwnerBookings() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMod, setSelectedMod] = useState<any>(null);
  const [response, setResponse] = useState("");
  const [selectedNotificationBookingId, setSelectedNotificationBookingId] = useState<string | null>(null);
  const { respondToModification, cancelBooking } = useBookingActions();
  const { notifications } = useNotifications();
  const { data: notificationBookingDetails, isLoading: isLoadingBookingDetails } = useBookingNotificationDetails(
    selectedNotificationBookingId
  );

  // Filter booking notifications
  const bookingNotifications = notifications?.filter((n) => n.type === "booking") || [];

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["owner-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          property:properties!inner(id, title, owner_id),
          profile:profiles!bookings_user_id_fkey(first_name, last_name, avatar_url, phone)
        `)
        .eq("property.owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: modifications } = useQuery({
    queryKey: ["modifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("booking_modifications")
        .select(`
          *,
          booking:bookings!inner(
            *,
            property:properties!inner(owner_id),
            profile:profiles!bookings_user_id_fkey(first_name, last_name, phone)
          )
        `)
        .eq("booking.property.owner_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Filter bookings by status
  const bookingRequests = bookings?.filter(b => b.payment_status === 'awaiting_contact') || [];
  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed') || [];
  const completedBookings = bookings?.filter(b => b.status === 'completed') || [];

  const handleRespondToModification = (status: "approved" | "rejected") => {
    if (!selectedMod) return;
    
    respondToModification.mutate(
      { modificationId: selectedMod.id, status, response },
      {
        onSuccess: () => {
          setSelectedMod(null);
          setResponse("");
        },
      }
    );
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid_offline'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking Confirmed",
        description: "The booking has been confirmed successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          payment_status: 'cancelled'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking Declined",
        description: "The booking request has been declined.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'awaiting_contact': { label: 'Awaiting Contact', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      'pending': { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      'paid': { label: 'Paid', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
      'paid_offline': { label: 'Paid Offline', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    };
    
    const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month, day] = dateString.split('-').map(Number);
    return `${monthNames[month - 1]} ${day}, ${year}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Booking Management</h1>

        {/* Booking Notifications Section */}
        {bookingNotifications.length > 0 && (
          <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                New Booking Notifications ({bookingNotifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bookingNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedNotificationBookingId(
                          notification.metadata?.booking_id || null
                        )
                      }
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" className="relative">
              Booking Requests
              {bookingRequests.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {bookingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="modifications">
              Modifications {modifications && modifications.length > 0 && `(${modifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
          </TabsList>

          {/* Booking Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-500" />
              <p className="text-muted-foreground">
                These guests are waiting for you to contact them about their booking requests.
              </p>
            </div>
            
            {bookingRequests.length > 0 ? (
              <div className="grid gap-4">
                {bookingRequests.map((booking: any) => (
                  <Card key={booking.id} className="border-blue-500/20">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{booking.property.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Guest: {booking.guest_name || `${booking.profile?.first_name || ''} ${booking.profile?.last_name || ''}`.trim() || 'Guest'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.guests} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>KES {booking.total_price?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="bg-muted/50 p-3 rounded-lg mb-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Contact Guest:</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.guest_phone && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={`tel:${booking.guest_phone}`}>
                                <Phone className="h-4 w-4 mr-2" />
                                {booking.guest_phone}
                              </a>
                            </Button>
                          )}
                          {booking.guest_email && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={`mailto:${booking.guest_email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleConfirmBooking(booking.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Booking
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDeclineBooking(booking.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedNotificationBookingId(booking.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending booking requests
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Confirmed Bookings Tab */}
          <TabsContent value="confirmed" className="space-y-4">
            {confirmedBookings.length > 0 ? (
              <div className="grid gap-4">
                {confirmedBookings.map((booking: any) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{booking.property.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Guest: {booking.guest_name || `${booking.profile?.first_name || ''} ${booking.profile?.last_name || ''}`.trim() || 'Guest'}
                          </p>
                          {(booking.guest_phone || booking.profile?.phone) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {booking.guest_phone || booking.profile?.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.guests} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>KES {booking.total_price?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Guest
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => cancelBooking.mutate({ 
                            bookingId: booking.id, 
                            reason: "Cancelled by owner" 
                          })}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No confirmed bookings
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Modifications Tab */}
          <TabsContent value="modifications" className="space-y-4">
            <h2 className="text-xl font-semibold">Modification Requests</h2>
            {modifications && modifications.length > 0 ? (
              <div className="grid gap-4">
                {modifications.map((mod: any) => (
                  <Card key={mod.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{mod.booking.property.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Guest: {mod.booking.profile.first_name} {mod.booking.profile.last_name}
                          </p>
                        </div>
                        <Badge>Pending Review</Badge>
                      </div>

                      <div className="grid gap-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="line-through text-muted-foreground">
                            {formatDate(mod.old_check_in)} - {formatDate(mod.old_check_out)}
                          </span>
                          <span className="mx-2">→</span>
                          <span className="text-primary font-medium">
                            {formatDate(mod.new_check_in)} - {formatDate(mod.new_check_out)}
                          </span>
                        </div>
                        {mod.reason && (
                          <p className="text-muted-foreground">Reason: {mod.reason}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedMod(mod)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedMod(mod)}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending modification requests
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Bookings Tab */}
          <TabsContent value="all" className="space-y-4">
            {bookings && bookings.length > 0 ? (
              <div className="grid gap-4">
                {bookings.map((booking: any) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{booking.property.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Guest: {booking.guest_name || `${booking.profile?.first_name || ''} ${booking.profile?.last_name || ''}`.trim() || 'Guest'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.guests} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>KES {booking.total_price?.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No bookings yet
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedMod} onOpenChange={() => setSelectedMod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Modification Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add a message to the guest (optional)..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => handleRespondToModification("approved")}
              >
                Approve
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleRespondToModification("rejected")}
              >
                Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingNotificationModal
        open={!!selectedNotificationBookingId}
        onOpenChange={(open) => {
          if (!open) setSelectedNotificationBookingId(null);
        }}
        bookingData={notificationBookingDetails || undefined}
        isLoading={isLoadingBookingDetails}
      />

      <Footer />
    </div>
  );
}

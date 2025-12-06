import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBookingActions } from "@/hooks/useBookingActions";
import { Calendar, Users, DollarSign, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function OwnerBookings() {
  const [selectedMod, setSelectedMod] = useState<any>(null);
  const [response, setResponse] = useState("");
  const { respondToModification, cancelBooking } = useBookingActions();

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
          profile:profiles!bookings_user_id_fkey(first_name, last_name, avatar_url)
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
            profile:profiles!bookings_user_id_fkey(first_name, last_name)
          )
        `)
        .eq("booking.property.owner_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
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

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
            <TabsTrigger value="pending">
              Pending {modifications && modifications.length > 0 && `(${modifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
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
                            {format(new Date(mod.old_check_in), "MMM dd")} - {format(new Date(mod.old_check_out), "MMM dd")}
                          </span>
                          <span className="mx-2">→</span>
                          <span className="text-primary font-medium">
                            {format(new Date(mod.new_check_in), "MMM dd")} - {format(new Date(mod.new_check_out), "MMM dd")}
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

          {["all", "confirmed", "completed"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {bookings
                ?.filter((b) => tab === "all" || b.status === tab)
                .map((booking: any) => (
                  <Card key={booking.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold">{booking.property.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Guest: {booking.profile.first_name} {booking.profile.last_name}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(booking.check_in), "MMM dd, yyyy")} - {format(new Date(booking.check_out), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.guests} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>KES {booking.total_price.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message Guest
                        </Button>
                        {booking.status === "confirmed" && (
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          ))}
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

      <Footer />
    </div>
  );
}
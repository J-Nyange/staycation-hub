import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Info, CreditCard, CalendarIcon, Shield, AlertCircle, Loader2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";
import { Property } from "@/hooks/useProperties";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface BookingModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookingModal({ property, open, onOpenChange }: BookingModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'details' | 'payment'>('details');
  
  // Form State
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Payment State
  const [clientSecret, setClientSecret] = useState("");
  const [bookingId, setBookingId] = useState("");

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * (property.price_per_night || property.price || 0);

  const handleBookingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !checkIn || !checkOut) return;

    setIsLoading(true);

    try {
      // Create booking record
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          property_id: property.id,
          check_in: checkIn.toISOString().split('T')[0],
          check_out: checkOut.toISOString().split('T')[0],
          guests,
          total_price: totalPrice,
          special_requests: specialRequests || null,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      setBookingId(booking.id);

      // Create payment intent
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment-intent',
        {
          body: {
            property_id: property.id,
            check_in: checkIn.toISOString().split('T')[0],
            check_out: checkOut.toISOString().split('T')[0],
            guests,
            total_price: totalPrice,
            special_requests: specialRequests || null,
            booking_id: booking.id,
          },
        }
      );

      if (paymentError) throw paymentError;

      setClientSecret(paymentData.clientSecret);
      setCurrentTab('payment');

      toast({
        title: "Booking Details Saved",
        description: "Please complete payment to confirm your booking.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful! 🎉",
      description: "Your booking is confirmed. Check your email for details.",
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuests(1);
    setSpecialRequests('');
    setCurrentTab('details');
    setBookingId('');
    setClientSecret('');
    setAcceptedTerms(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {property.title}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" disabled={currentTab === 'payment'}>
              <Info className="mr-2 h-4 w-4" />
              Booking Details
            </TabsTrigger>
            <TabsTrigger value="payment" disabled={!clientSecret}>
              <CreditCard className="mr-2 h-4 w-4" />
              Payment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-0">
            <form onSubmit={handleBookingDetails} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Check-in</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkIn && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Check-out</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !checkOut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "MMM dd, yyyy") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => date < new Date() || (checkIn && date <= checkIn)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guests">Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min={1}
                  max={property.guests}
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special-requests">Special Requests (Optional)</Label>
                <Textarea
                  id="special-requests"
                  placeholder="Any special requirements or requests..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              {checkIn && checkOut && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>${property.price_per_night || property.price} × {nights} nights</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              )}

              {property.cancellation_policy && (
                <Alert className="border-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    <strong className="font-semibold">Cancellation Policy: </strong>
                    {property.cancellation_policy === 'flexible' && (
                      <span>Full refund if canceled 24 hours before check-in. Cancel within 24 hours for 50% refund.</span>
                    )}
                    {property.cancellation_policy === 'moderate' && (
                      <span>Full refund if canceled 7 days before check-in. Cancel within 7 days for 50% refund.</span>
                    )}
                    {property.cancellation_policy === 'strict' && (
                      <span>50% refund if canceled 30 days before check-in. No refund within 30 days of check-in.</span>
                    )}
                    {' '}
                    <Link to="/cancellation-policy" className="text-primary hover:underline">
                      Learn more
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border border-border">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="mt-1"
                />
                <label 
                  htmlFor="terms" 
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I agree to the{' '}
                  <Link to="/terms-of-service" target="_blank" className="text-primary hover:underline font-medium">
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link to="/cancellation-policy" target="_blank" className="text-primary hover:underline font-medium">
                    Cancellation Policy
                  </Link>
                  , and{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {!acceptedTerms && checkIn && checkOut && (
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please accept the terms and conditions to continue with your booking.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!checkIn || !checkOut || !acceptedTerms || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue to Payment
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="payment" className="space-y-0">
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm 
                  onSuccess={handlePaymentSuccess}
                  totalPrice={totalPrice}
                />
              </Elements>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Property } from '@/hooks/useProperties';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Loader2, CreditCard, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface BookingModalProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookingModal({ property, open, onOpenChange }: BookingModalProps) {
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'details' | 'payment'>('details');
  const [bookingId, setBookingId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights * property.price_per_night;

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
                    <span>${property.price_per_night} × {nights} nights</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!checkIn || !checkOut || isLoading}
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
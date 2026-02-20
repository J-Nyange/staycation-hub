import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Calendar, Home, Users, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import PaystackPaymentForm from "@/components/PaystackPaymentForm";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_51N7jPrF6g21qrmupA6EPcdNQT4MJgZ7CZ06DmZBG53E1qPiomYCTFetpwARwbhIWp5AoboY4hAYT0SSx8mR5boPr00QIZnyoOl");

interface BalancePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    property_id: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    balance_amount: number;
    balance_due_date: string;
    properties?: {
      title: string;
      main_image: string;
    };
  };
}

export default function BalancePaymentModal({ open, onOpenChange, booking }: BalancePaymentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paystack'>('paystack');
  const [clientSecret, setClientSecret] = useState("");
  const [paymentReady, setPaymentReady] = useState(false);

  const daysUntilDue = booking.balance_due_date 
    ? differenceInDays(new Date(booking.balance_due_date), new Date())
    : null;

  const handleInitiatePayment = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (paymentMethod === 'stripe') {
        const { data, error } = await supabase.functions.invoke('pay-balance', {
          body: {
            booking_id: booking.id,
            payment_method: 'stripe',
          },
        });

        if (error) throw error;
        setClientSecret(data.clientSecret);
      }
      
      setPaymentReady(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Balance Paid! 🎉",
      description: "Your booking is now fully paid.",
    });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    onOpenChange(false);
    setPaymentReady(false);
    setClientSecret("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary" />
            Pay Remaining Balance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-3">
              {booking.properties?.main_image && (
                <img
                  src={booking.properties.main_image}
                  alt={booking.properties.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div>
                <h4 className="font-semibold">{booking.properties?.title}</h4>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(booking.check_in), 'MMM dd')} - {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  {booking.guests} guests
                </div>
              </div>
            </div>
          </div>

          {/* Payment Due Alert */}
          {daysUntilDue !== null && daysUntilDue <= 3 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {daysUntilDue === 0
                  ? "Payment is due today!"
                  : daysUntilDue < 0
                    ? "Payment is overdue. Please pay immediately to keep your booking."
                    : `Payment due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}
              </AlertDescription>
            </Alert>
          )}

          {/* Amount Summary */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Total Booking Cost</span>
              <span>KES {booking.total_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Deposit Paid</span>
              <span className="text-green-600">- KES {(booking.total_price - booking.balance_amount).toLocaleString()}</span>
            </div>
            <div className="border-t border-primary/20 pt-2 mt-2">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Balance Due</span>
                <span className="text-primary">KES {booking.balance_amount.toLocaleString()}</span>
              </div>
              {booking.balance_due_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due by {format(new Date(booking.balance_due_date), 'MMMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>

          {!paymentReady ? (
            <>
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
              
              <Button
                onClick={handleInitiatePayment}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Payment...
                  </>
                ) : (
                  `Pay KES ${booking.balance_amount.toLocaleString()}`
                )}
              </Button>
            </>
          ) : (
            <>
              {paymentMethod === 'stripe' && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm
                    totalPrice={booking.balance_amount}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}

              {paymentMethod === 'paystack' && user?.primaryEmailAddress?.emailAddress && (
              <PaystackPaymentForm
                  bookingId={booking.id}
                  totalPrice={booking.balance_amount}
                  email={user.primaryEmailAddress.emailAddress}
                  onSuccess={handlePaymentSuccess}
                  onStart={() => {}}
                  onEnd={() => {}}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

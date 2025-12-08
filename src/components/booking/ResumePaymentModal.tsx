import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, MapPin, AlertCircle } from 'lucide-react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import PaystackPaymentForm from '@/components/PaystackPaymentForm';
import { supabase } from '@/integrations/supabase/client';

interface ResumePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    status: string;
    payment_status: string;
    expires_at?: string;
    properties: {
      id: string;
      title: string;
      location: string;
      main_image: string;
      category: string;
    };
  };
}

export function ResumePaymentModal({ open, onOpenChange, booking }: ResumePaymentModalProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paystack'>('paystack');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Function to update booking status to expired in database
  const markBookingAsExpired = async () => {
    try {
      await supabase
        .from('bookings')
        .update({
          status: 'expired',
          payment_status: 'failed', // Must use 'failed' - constraint: ('pending', 'paid', 'refunded', 'failed')
          cancellation_reason: 'Booking expired - payment not completed in time',
        })
        .eq('id', booking.id);
      
      // Refresh the bookings list
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    } catch (error) {
      console.error('Failed to update booking status:', error);
    }
  };

  // Calculate and update time remaining
  useEffect(() => {
    if (!booking.expires_at) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const expiresAt = new Date(booking.expires_at!);
      const now = new Date();
      const diffMins = differenceInMinutes(expiresAt, now);
      const diffSecs = differenceInSeconds(expiresAt, now) % 60;

      if (diffMins <= 0 && diffSecs <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        // Update the database to reflect expired status
        markBookingAsExpired();
        return;
      }

      setTimeRemaining(`${diffMins}:${diffSecs.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [booking.expires_at, booking.id]);

  const handlePaymentSuccess = () => {
    onOpenChange(false);
    navigate('/booking-confirmation', { 
      state: { 
        bookingId: booking.id,
        propertyTitle: booking.properties.title 
      } 
    });
  };

  if (isExpired) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Booking Expired
            </DialogTitle>
            <DialogDescription>
              This booking has expired. Please create a new booking.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button 
              onClick={() => navigate(`/properties/${booking.properties.id}`)} 
              className="w-full"
            >
              Book Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            Complete payment to confirm your booking
          </DialogDescription>
        </DialogHeader>

        {/* Timer Warning */}
        {timeRemaining && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Time remaining: {timeRemaining}</p>
              <p className="text-xs text-muted-foreground">Complete payment before the booking expires</p>
            </div>
          </div>
        )}

        {/* Property Summary */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex gap-4">
            <img
              src={booking.properties.main_image}
              alt={booking.properties.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{booking.properties.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {booking.properties.location}
              </p>
              <Badge variant="outline" className="mt-2">{booking.properties.category}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{format(new Date(booking.check_in), 'MMM dd')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{format(new Date(booking.check_out), 'MMM dd')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{booking.guests} guests</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
        />

        {/* Payment Forms */}
        {paymentMethod === 'paystack' && user?.primaryEmailAddress?.emailAddress && (
          <PaystackPaymentForm
            onSuccess={handlePaymentSuccess}
            totalPrice={booking.total_price}
            email={user.primaryEmailAddress.emailAddress}
            bookingId={booking.id}
          />
        )}

        {paymentMethod === 'stripe' && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Stripe payment integration coming soon.</p>
            <p className="text-sm mt-2">Please use Paystack for now.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

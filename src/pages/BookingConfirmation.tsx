import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!user || !paymentIntentId) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            properties (
              id, title, location, main_image, price_per_night
            )
          `)
          .eq('stripe_payment_intent_id', paymentIntentId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [user, paymentIntentId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const checkInDate = new Date(booking.check_in).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const checkOutDate = new Date(booking.check_out).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground">
              Your payment was successful. Check your email for confirmation details.
            </p>
          </div>

          {/* Booking Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Info */}
              <div className="flex gap-4">
                {booking.properties.main_image && (
                  <img
                    src={booking.properties.main_image}
                    alt={booking.properties.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold">{booking.properties.title}</h3>
                  <p className="text-muted-foreground">{booking.properties.location}</p>
                </div>
              </div>

              {/* Booking Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Reference</p>
                  <p className="font-mono font-semibold">{booking.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold text-green-600">Confirmed</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-semibold">{checkInDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-semibold">{checkOutDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="font-semibold">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount Paid</p>
                  <p className="font-semibold text-lg">${booking.total_price}</p>
                </div>
              </div>

              {booking.special_requests && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Special Requests</p>
                  <p className="text-sm">{booking.special_requests}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Confirmation email has been sent to your inbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>You'll receive a reminder 24 hours before check-in</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Property owner may contact you with check-in instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>After your stay, we'd love to hear your feedback</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/bookings')}>
              View My Bookings
            </Button>
            <Button onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

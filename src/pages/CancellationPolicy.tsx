import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Cancellation & Refund Policy"
        description="Understand Lukemanbnb's flexible, moderate, and strict cancellation policies. Learn about refund processing, booking changes, and our guest protection policies."
        keywords="cancellation policy, refund policy, booking cancellation, flexible cancellation, Lukemanbnb refunds"
        url={window.location.href}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Cancellation & Refund Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <p>Lukemanbnb offers three cancellation policy options for property owners. The policy applicable to your booking is displayed on the property page and in your booking confirmation.</p>

            <div className="not-prose my-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Flexible Policy</CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Most Popular</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">Full refund if canceled 24 hours before check-in</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Cancel up to 24 hours before check-in for a full refund</li>
                    <li>Cancel within 24 hours of check-in for 50% refund</li>
                    <li>No refund for cancellations after check-in</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Moderate Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">Full refund if canceled 7 days before check-in</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Cancel up to 7 days before check-in for a full refund</li>
                    <li>Cancel within 7 days of check-in for 50% refund</li>
                    <li>No refund for cancellations within 48 hours of check-in</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Strict Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">50% refund if canceled 30 days before check-in</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Cancel up to 30 days before check-in for a 50% refund</li>
                    <li>No refund for cancellations within 30 days of check-in</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <h2>Refund Processing</h2>
            <ul>
              <li>Refunds are processed within 5-10 business days</li>
              <li>Refunds are issued to the original payment method</li>
              <li>Processing fees are non-refundable</li>
            </ul>

            <h2>Force Majeure</h2>
            <p>In cases of extreme circumstances (natural disasters, government travel restrictions, etc.), we may offer full refunds or rebooking options outside the standard policy.</p>

            <h2>Property Owner Cancellations</h2>
            <p>If a property owner cancels your confirmed booking:</p>
            <ul>
              <li>You will receive a full refund within 48 hours</li>
              <li>We will help you find alternative accommodation</li>
              <li>You may be eligible for additional compensation</li>
            </ul>

            <h2>How to Cancel</h2>
            <p>To cancel a booking:</p>
            <ol>
              <li>Log in to your account</li>
              <li>Go to "My Bookings"</li>
              <li>Select the booking you wish to cancel</li>
              <li>Click "Cancel Booking" and follow the prompts</li>
            </ol>

            <h2>Contact Us</h2>
            <p>For questions about cancellations or refunds, contact us at vilahorizon04@gmail.com</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

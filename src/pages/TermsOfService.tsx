import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service"
        description="Review Villa Horizon Kenya's terms of service, including user agreements, booking policies, payment terms, and liability information."
        keywords="terms of service, user agreement, booking terms, Villa Horizon policies"
        url={window.location.href}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using Villa Horizon Kenya, you accept and agree to be bound by the terms and provision of this agreement.</p>

            <h2>2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

            <h2>3. Property Listings</h2>
            <p>Property owners are responsible for the accuracy of their listings. Villa Horizon reserves the right to remove any listing that violates our policies.</p>

            <h2>4. Booking and Payments</h2>
            <p>All bookings are subject to availability. Payment must be completed at the time of booking. We use Stripe for secure payment processing.</p>

            <h2>5. Cancellation Policy</h2>
            <p>Cancellation policies vary by property. Please review the specific cancellation policy before booking. Refunds are processed according to the property's cancellation terms.</p>

            <h2>6. User Conduct</h2>
            <p>Users agree to:</p>
            <ul>
              <li>Provide accurate information</li>
              <li>Respect property rules and regulations</li>
              <li>Not engage in fraudulent activities</li>
              <li>Communicate respectfully with property owners and other users</li>
            </ul>

            <h2>7. Limitation of Liability</h2>
            <p>Villa Horizon acts as a platform connecting property owners and guests. We are not responsible for the quality, safety, or legality of properties listed.</p>

            <h2>8. Intellectual Property</h2>
            <p>All content on this platform, including text, graphics, logos, and images, is the property of Villa Horizon or its content suppliers.</p>

            <h2>9. Dispute Resolution</h2>
            <p>Any disputes arising from the use of this platform will be resolved through arbitration in accordance with Kenyan law.</p>

            <h2>10. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>

            <h2>11. Contact Information</h2>
            <p>For questions about these Terms of Service, please contact us at vilahorizon04@gmail.com</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

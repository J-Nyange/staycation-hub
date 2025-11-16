import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy"
        description="Learn how Villa Horizon Kenya collects, uses, and protects your personal information. Read our comprehensive privacy policy and data protection practices."
        keywords="privacy policy, data protection, GDPR, personal information, data security"
        url={window.location.href}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Property listings and booking details</li>
              <li>Reviews and communications</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Prevent fraud and enhance security</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>Property owners (when you make a booking)</li>
              <li>Service providers (Stripe for payments, Resend for emails)</li>
              <li>Law enforcement when required by law</li>
            </ul>

            <h2>4. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase. We implement appropriate technical and organizational measures to protect your personal information.</p>

            <h2>5. Cookies and Tracking</h2>
            <p>We use cookies to enhance your experience. You can control cookie preferences through your browser settings.</p>

            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>

            <h2>7. Children's Privacy</h2>
            <p>Our services are not intended for children under 18. We do not knowingly collect information from children.</p>

            <h2>8. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than Kenya. We ensure appropriate safeguards are in place.</p>

            <h2>9. Changes to Privacy Policy</h2>
            <p>We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

            <h2>10. Contact Us</h2>
            <p>For privacy-related questions, contact us at vilahorizon04@gmail.com</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

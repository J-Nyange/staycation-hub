import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Contacts = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Contact
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}Us
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              Have questions about our properties or need assistance with your booking? We're here to help make your coastal getaway perfect.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Office Location</h3>
                      <p className="text-muted-foreground">
                        Nyali Beach, Mombasa<br />
                        Kenya, East Africa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone Number</h3>
                      <p className="text-muted-foreground">
                        +254 (0) 700 123 456<br />
                        +254 (0) 721 987 654
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email Address</h3>
                      <p className="text-muted-foreground">
                        info@Villa Horizon.com<br />
                        bookings@Villa Horizon.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Business Hours</h3>
                      <p className="text-muted-foreground">
                        Monday - Sunday: 8:00 AM - 6:00 PM<br />
                        Emergency Support: 24/7
                      </p>
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="mt-8 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Interactive Map Coming Soon</p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-card rounded-3xl p-8 shadow-card">
                <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <Input placeholder="Your first name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <Input placeholder="Your last name" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <Input type="email" placeholder="your@email.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input type="tel" placeholder="+254 (0) 700 000 000" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input placeholder="What's this about?" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea 
                      placeholder="Tell us about your inquiry..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button variant="luxury" className="w-full" size="lg">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Quick answers to common questions about our properties and booking process.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-card p-6 rounded-2xl">
                <h3 className="font-semibold mb-3">How do I make a booking?</h3>
                <p className="text-sm text-muted-foreground">
                  Simply browse our properties, select your dates, and follow the booking process. You'll need to create an account for security and booking management.
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl">
                <h3 className="font-semibold mb-3">What's included in the rental?</h3>
                <p className="text-sm text-muted-foreground">
                  Each property listing includes detailed information about amenities, services, and what's provided. Most include WiFi, linens, and basic amenities.
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl">
                <h3 className="font-semibold mb-3">Can I cancel my booking?</h3>
                <p className="text-sm text-muted-foreground">
                  Cancellation policies vary by property. Check the specific policy on each listing. We offer flexible options for most bookings.
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl">
                <h3 className="font-semibold mb-3">Is customer support available?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! We provide 24/7 emergency support and regular customer service during business hours for all your needs.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contacts;
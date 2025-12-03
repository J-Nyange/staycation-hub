import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { MapPin, Users, Award, Heart } from "lucide-react";
import { generateBreadcrumbSchema } from "@/lib/structuredData";

const About = () => {
  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: "Home", url: "https://Lukemanbnb.com" },
      { name: "About", url: "https://Lukemanbnb.com/about" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Lukemanbnb Kenya"
        description="Learn about Lukemanbnb, Kenya's premier coastal property rental platform. Connecting travelers with luxury villas, homestays, and apartments since 2020."
        keywords="about Lukemanbnb, Kenya property rentals, coastal accommodations Kenya, vacation rental platform"
        url={window.location.href}
      />
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              About
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}Lukemanbnb
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              We're passionate about connecting travelers with Kenya's most beautiful coastal destinations through authentic, luxurious accommodations.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Founded with a vision to showcase Kenya's stunning coastal beauty, Lukemanbnb began as a passion project to connect travelers with unique, luxury accommodations along our pristine coastline.
                  </p>
                  <p>
                    From the white sand beaches of Diani to the cultural richness of Mombasa, we curate exceptional properties that offer more than just a place to stay – they provide gateways to unforgettable experiences.
                  </p>
                  <p>
                    Today, we proudly host thousands of guests annually, each discovering their own slice of coastal paradise through our carefully selected villas, apartments, and homestays.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80"
                  alt="Coastal view"
                  className="rounded-2xl shadow-luxury"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Premium Properties</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <div className="text-3xl font-bold text-secondary mb-2">10K+</div>
                <div className="text-muted-foreground">Happy Guests</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-accent" />
                </div>
                <div className="text-3xl font-bold text-accent mb-2">4.9</div>
                <div className="text-muted-foreground">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">5</div>
                <div className="text-muted-foreground">Years of Excellence</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8">Our Mission</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                To provide exceptional coastal accommodations that celebrate Kenya's natural beauty while supporting local communities and promoting sustainable tourism practices.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="p-6 rounded-2xl bg-card">
                  <h3 className="font-semibold mb-3">Authentic Experiences</h3>
                  <p className="text-sm text-muted-foreground">
                    Every property is carefully selected to offer genuine coastal living experiences.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-card">
                  <h3 className="font-semibold mb-3">Community Support</h3>
                  <p className="text-sm text-muted-foreground">
                    We work closely with local communities to ensure tourism benefits everyone.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-card">
                  <h3 className="font-semibold mb-3">Sustainable Tourism</h3>
                  <p className="text-sm text-muted-foreground">
                    Committed to preserving Kenya's coastal environment for future generations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
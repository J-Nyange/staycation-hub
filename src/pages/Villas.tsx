import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import heroVilla from "@/assets/hero-villa.jpg";

const Villas = () => {
  const villaProperties = [
    {
      id: "1",
      title: "Executive Vipingo Villa",
      location: "Vipingo, Kilifi",
      price: 180,
      rating: 4.9,
      reviews: 45,
      guests: 6,
      image: heroVilla,
      category: "villa" as const,
      amenities: ["wifi", "parking", "pool", "kitchen"],
    },
    {
      id: "2",
      title: "Luxury Beachfront Villa",
      location: "Vipingo, Kilifi",
      price: 250,
      rating: 5.0,
      reviews: 67,
      guests: 8,
      image: heroVilla,
      category: "villa" as const,
      amenities: ["wifi", "parking", "pool", "kitchen", "beach-access"],
    },
    {
      id: "3",
      title: "Oceanview Villa Paradise",
      location: "Diani Beach, Ukunda",
      price: 220,
      rating: 4.8,
      reviews: 39,
      guests: 7,
      image: heroVilla,
      category: "villa" as const,
      amenities: ["wifi", "parking", "pool", "kitchen", "ocean-view"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-accent/10 via-background to-primary/10">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Luxury 
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {" "}Villas
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Exclusive beachfront villas with private pools and premium amenities. 
            Perfect for special occasions and luxury getaways.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm">
              Private Pool
            </span>
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm">
              Beachfront Access
            </span>
            <span className="bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm">
              Concierge Service
            </span>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {villaProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Villas;
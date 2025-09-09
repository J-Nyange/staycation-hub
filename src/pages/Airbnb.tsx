import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import airbnbInterior from "@/assets/airbnb-interior.jpg";

const Airbnb = () => {
  const airbnbProperties = [
    {
      id: "1",
      title: "Diani Studio Bedsitter",
      location: "Diani Beach, Ukunda",
      price: 85,
      rating: 4.7,
      reviews: 28,
      guests: 2,
      image: airbnbInterior,
      category: "airbnb" as const,
      amenities: ["wifi", "kitchen", "beach-access"],
    },
    {
      id: "2",
      title: "Two Bedroom Voi Apartment",
      location: "Voi, Taita Taveta",
      price: 95,
      rating: 4.6,
      reviews: 19,
      guests: 4,
      image: airbnbInterior,
      category: "airbnb" as const,
      amenities: ["wifi", "parking", "kitchen"],
    },
    {
      id: "3",
      title: "Modern Nyali Apartment",
      location: "Nyali, Mombasa",
      price: 110,
      rating: 4.8,
      reviews: 34,
      guests: 3,
      image: airbnbInterior,
      category: "airbnb" as const,
      amenities: ["wifi", "parking", "kitchen", "pool-access"],
    },
    {
      id: "4",
      title: "Coastal View Studio",
      location: "Malindi, Kilifi",
      price: 75,
      rating: 4.5,
      reviews: 22,
      guests: 2,
      image: airbnbInterior,
      category: "airbnb" as const,
      amenities: ["wifi", "kitchen", "beach-view"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Airbnb 
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {" "}Apartments
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Comfortable, well-equipped apartments perfect for short stays and extended visits. 
            Experience local living with modern amenities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm">
              Self Check-in
            </span>
            <span className="bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm">
              Kitchen Facilities
            </span>
            <span className="bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm">
              Local Experience
            </span>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {airbnbProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Airbnb;
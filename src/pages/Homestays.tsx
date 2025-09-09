import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import homestayCottage from "@/assets/homestay-cottage.jpg";

const Homestays = () => {
  const homestayProperties = [
    {
      id: "1",
      title: "Cozy Coastal Cottage",
      location: "Nyali, Mombasa",
      price: 120,
      rating: 4.8,
      reviews: 32,
      guests: 4,
      image: homestayCottage,
      category: "homestay" as const,
      amenities: ["wifi", "parking", "garden", "breakfast"],
    },
    {
      id: "2",
      title: "Traditional Homestay",
      location: "Malindi, Kilifi",
      price: 75,
      rating: 4.5,
      reviews: 15,
      guests: 3,
      image: homestayCottage,
      category: "homestay" as const,
      amenities: ["wifi", "breakfast", "cultural-experience"],
    },
    {
      id: "3",
      title: "Family Friendly Cottage",
      location: "Watamu, Kilifi",
      price: 95,
      rating: 4.7,
      reviews: 28,
      guests: 5,
      image: homestayCottage,
      category: "homestay" as const,
      amenities: ["wifi", "garden", "breakfast", "family-activities"],
    },
    {
      id: "4",
      title: "Authentic Local Experience",
      location: "Lamu, Lamu County",
      price: 85,
      rating: 4.9,
      reviews: 21,
      guests: 3,
      image: homestayCottage,
      category: "homestay" as const,
      amenities: ["wifi", "breakfast", "cultural-tours", "local-guide"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-secondary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            Authentic 
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              {" "}Homestays
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Experience genuine Kenyan hospitality with local families. 
            Immerse yourself in culture while enjoying comfortable accommodations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm">
              Local Family Experience
            </span>
            <span className="bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm">
              Home-cooked Meals
            </span>
            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm">
              Cultural Activities
            </span>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {homestayProperties.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Homestays;
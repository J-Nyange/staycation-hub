import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PropertyCard from "@/components/PropertyCard";
import { useProperties, Property } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSort from "@/components/FilterSort";
import { generateBreadcrumbSchema } from "@/lib/structuredData";
import homestayHero from "@/assets/homestay-cottage.jpg";

const Homestays = () => {
  const { data: homestayProperties = [], isLoading, error } = useProperties('homestay');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <p className="text-muted-foreground">Error loading homestays. Please try again later.</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: "Home", url: "https://Lukemanbnb.com" },
      { name: "Homestays", url: "https://Lukemanbnb.com/homestays" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Authentic Homestays in Kenya"
        description="Experience genuine Kenyan hospitality in our carefully selected homestays. Connect with local culture and enjoy warm, family-friendly accommodations along the coast."
        keywords="homestays Kenya, authentic Kenya accommodation, local homestays, family-friendly Kenya, cultural stays Mombasa, traditional Kenyan homes"
        image="/homestay-cottage.jpg"
        url={window.location.href}
      />
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={homestayHero} alt="Authentic homestay cottage" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-white">
            Authentic 
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Homestays
            </span>
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Experience genuine Kenyan hospitality with local families. 
            Immerse yourself in culture while enjoying comfortable accommodations.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Local Family Experience
            </span>
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Home-cooked Meals
            </span>
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Cultural Activities
            </span>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {!isLoading && (
            <FilterSort 
              properties={homestayProperties} 
              onFilterChange={setFilteredProperties} 
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-card rounded-2xl overflow-hidden">
                  <Skeleton className="w-full h-64" />
                  <div className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              (filteredProperties.length > 0 ? filteredProperties : homestayProperties).map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Homestays;
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PropertyCard from "@/components/PropertyCard";
import { useProperties, Property } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSort from "@/components/FilterSort";
import { generateBreadcrumbSchema } from "@/lib/structuredData";
import villaHero from "@/assets/hero-villa.jpg";

const Villas = () => {
  const { data: villaProperties = [], isLoading, error } = useProperties('villa');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <p className="text-muted-foreground">Error loading villas. Please try again later.</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: "Home", url: "https://Lukemanbnb.com" },
      { name: "Luxury Villas", url: "https://Lukemanbnb.com/villas" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Luxury Villas in Kenya"
        description="Experience ultimate luxury in our exclusive coastal villas. Private pools, breathtaking ocean views, and world-class amenities along Kenya's stunning coastline."
        keywords="luxury villas Kenya, Kenya beach villas, private villas Diani, exclusive villas Mombasa, luxury accommodation Kenya, oceanfront villas"
        image="/hero-villa.jpg"
        url={window.location.href}
      />
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={villaHero} alt="Luxury villa" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-white">
            Luxury 
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Villas
            </span>
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Exclusive beachfront villas with private pools and premium amenities. 
            Perfect for special occasions and luxury getaways.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Private Pool
            </span>
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Beachfront Access
            </span>
            <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              Concierge Service
            </span>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {!isLoading && (
            <FilterSort 
              properties={villaProperties} 
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
              (filteredProperties.length > 0 ? filteredProperties : villaProperties).map((property) => (
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

export default Villas;
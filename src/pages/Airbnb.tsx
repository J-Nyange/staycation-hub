import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import PropertyCard from "@/components/PropertyCard";
import { useProperties, Property } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSort from "@/components/FilterSort";
import { generateBreadcrumbSchema } from "@/lib/structuredData";

const Airbnb = () => {
  const { data: airbnbProperties = [], isLoading, error } = useProperties('airbnb');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <p className="text-muted-foreground">Error loading Airbnb properties. Please try again later.</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const breadcrumbSchema = generateBreadcrumbSchema({
    items: [
      { name: "Home", url: "https://Lukemanbnb.com" },
      { name: "Airbnb Apartments", url: "https://Lukemanbnb.com/airbnb" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Airbnb Apartments in Kenya"
        description="Comfortable, well-equipped apartments perfect for short stays and extended visits. Experience local living with modern amenities along Kenya's coast."
        keywords="Airbnb Kenya, Kenya apartments, coastal apartments Kenya, self-catering Kenya, vacation apartments Mombasa, Diani apartments"
        image="/airbnb-interior.jpg"
        url={window.location.href}
      />
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
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
          {!isLoading && (
            <FilterSort 
              properties={airbnbProperties} 
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
              (filteredProperties.length > 0 ? filteredProperties : airbnbProperties).map((property) => (
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

export default Airbnb;
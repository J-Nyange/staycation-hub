import { useState } from "react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { useProperties, Property } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import FilterSort from "./FilterSort";

const FeaturedProperties = () => {
  const [activeCategory, setActiveCategory] = useState<"all" | "airbnb" | "villa" | "homestay">("all");
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  
  // Fetch all properties when "all" is selected, otherwise fetch by category
  const { data: allProperties = [], isLoading, error } = useProperties();
  
  // Get properties to display based on active category
  const getDisplayProperties = () => {
    if (activeCategory === "all") {
      // Show 2 from each category
      const airbnbProps = allProperties.filter(p => p.category === "airbnb").slice(0, 2);
      const villaProps = allProperties.filter(p => p.category === "villa").slice(0, 2);
      const homestayProps = allProperties.filter(p => p.category === "homestay").slice(0, 2);
      return [...airbnbProps, ...villaProps, ...homestayProps];
    }
    return allProperties.filter(p => p.category === activeCategory);
  };
  
  const properties = getDisplayProperties();

  if (error) {
    return (
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-muted-foreground">Error loading properties. Please try again later.</p>
        </div>
      </section>
    );
  }

  const categories = [
    { id: "all", label: "All Properties" },
    { id: "airbnb", label: "Airbnb" },
    { id: "villa", label: "Villas" },
    { id: "homestay", label: "Homestays" },
  ];

  return (
    <section id="featured-properties" className="py-16 lg:py-24 bg-gradient-to-b from-background via-muted-luxury/30 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-4">
            Featured Collection
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Discover Our 
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {" "}Premium Properties
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked accommodations that offer the perfect blend of luxury, comfort, and authentic coastal experiences
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "luxury" : "outline"}
              onClick={() => {
                setActiveCategory(category.id as any);
                setFilteredProperties([]);
              }}
              className="group"
            >
              {category.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeCategory === category.id 
                  ? "bg-white/20 text-white" 
                  : "bg-primary/10 text-primary"
              }`}>
                {activeCategory === category.id ? properties.length : ''}
              </span>
            </Button>
          ))}
        </div>

        {/* Filter and Sort */}
        {!isLoading && properties.length > 0 && (
          <FilterSort 
            properties={properties} 
            onFilterChange={setFilteredProperties} 
            className="mb-8"
          />
        )}

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
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
            (filteredProperties.length > 0 ? filteredProperties : properties).map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg" 
            className="group"
            onClick={() => {
              setActiveCategory("all");
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            View All Properties
            <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-300">
              <span className="ml-2">→</span>
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;
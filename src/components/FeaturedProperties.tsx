import { useState } from "react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import airbnbInterior from "@/assets/airbnb-interior.jpg";
import heroVilla from "@/assets/hero-villa.jpg";
import homestayCottage from "@/assets/homestay-cottage.jpg";

const FeaturedProperties = () => {
  const [activeCategory, setActiveCategory] = useState<"all" | "airbnb" | "villa" | "homestay">("all");

  const properties = [
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
      id: "3",
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
      id: "4",
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
      id: "5",
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
      id: "6",
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
  ];

  const categories = [
    { id: "all", label: "All Properties", count: properties.length },
    { id: "airbnb", label: "Airbnb", count: properties.filter(p => p.category === "airbnb").length },
    { id: "villa", label: "Villas", count: properties.filter(p => p.category === "villa").length },
    { id: "homestay", label: "Homestays", count: properties.filter(p => p.category === "homestay").length },
  ];

  const filteredProperties = activeCategory === "all" 
    ? properties 
    : properties.filter(property => property.category === activeCategory);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-background via-muted-luxury/30 to-background">
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
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "luxury" : "outline"}
              onClick={() => setActiveCategory(category.id as any)}
              className="group"
            >
              {category.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeCategory === category.id 
                  ? "bg-white/20 text-white" 
                  : "bg-primary/10 text-primary"
              }`}>
                {category.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="outline" size="lg" className="group">
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
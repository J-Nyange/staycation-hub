import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";

const Homestays = () => {
  const { data: homestayProperties = [], isLoading, error } = useProperties('homestay');

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
              homestayProperties.map((property) => (
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
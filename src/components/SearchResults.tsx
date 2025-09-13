import { Property } from "@/hooks/useProperties";
import PropertyCard from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResultsProps {
  results: Property[];
  isLoading: boolean;
  searchQuery?: string;
}

const SearchResults = ({ results, isLoading, searchQuery }: SearchResultsProps) => {
  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Searching Properties...</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-card rounded-2xl overflow-hidden">
                <Skeleton className="w-full h-64" />
                <div className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Search Results"}
          </h2>
          <p className="text-muted-foreground">
            {results.length === 0 
              ? "No properties found matching your criteria" 
              : `Found ${results.length} propert${results.length === 1 ? 'y' : 'ies'}`
            }
          </p>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((property) => (
              <PropertyCard key={property.id} {...property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all our properties.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchResults;
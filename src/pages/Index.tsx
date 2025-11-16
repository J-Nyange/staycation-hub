import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProperties from "@/components/FeaturedProperties";
import SearchResults from "@/components/SearchResults";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useSearch } from "@/hooks/useSearch";
import { generateOrganizationSchema } from "@/lib/structuredData";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const { data: searchResults, isLoading } = useSearch({
    location: searchQuery || undefined,
  });

  const handleBackClick = () => {
    setSearchParams({});
  };

  const showSearchResults = searchQuery.trim() !== '';

  const organizationSchema = generateOrganizationSchema({
    name: "Villa Horizon Kenya",
    url: "https://villahorizon.com",
    logo: "https://villahorizon.com/logo.png",
    description: "Discover luxury villas, cozy homestays, and modern apartments along Kenya's stunning coastline. Book your perfect coastal getaway today.",
    contactEmail: "info@villahorizon.com",
    sameAs: [
      "https://facebook.com/villahorizon",
      "https://instagram.com/villahorizon",
      "https://twitter.com/villahorizon"
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Luxury Coastal Properties in Kenya"
        description="Discover luxury villas, cozy homestays, and modern apartments along Kenya's stunning coastline. Find your perfect beachfront accommodation in Diani, Mombasa, Malindi, and Watamu."
        keywords="Kenya coastal properties, luxury villas Kenya, Diani beach rentals, Mombasa vacation homes, Watamu accommodation, Malindi beachfront, Kenya holiday rentals"
        image="/hero-villa.jpg"
        url={window.location.href}
      />
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <Navbar />
      <main>
        {showSearchResults ? (
          <SearchResults 
            results={searchResults || []} 
            isLoading={isLoading} 
            searchQuery={searchQuery}
            onBackClick={handleBackClick}
          />
        ) : (
          <>
            <Hero />
            <FeaturedProperties />
            <BlogSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;

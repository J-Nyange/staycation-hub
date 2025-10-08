import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProperties from "@/components/FeaturedProperties";
import SearchResults from "@/components/SearchResults";
import BlogSection from "@/components/BlogSection";
import Footer from "@/components/Footer";
import { useSearch } from "@/hooks/useSearch";

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

  return (
    <div className="min-h-screen bg-background">
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
